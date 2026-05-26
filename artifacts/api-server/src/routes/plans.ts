import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  workoutPlansTable,
  workoutDaysTable,
  planExercisesTable,
  exercisesTable,
  studentTrainerAssignmentsTable,
} from "@workspace/db";
import { nanoid } from "../lib/id";
import {
  ListPlansQueryParams,
  CreatePlanBody,
  GetPlanParams,
  UpdatePlanParams,
  UpdatePlanBody,
  AddDayExerciseParams,
  AddDayExerciseBody,
  CreateExerciseBody,
} from "@workspace/api-zod";
import { z } from "zod";


const CreateDayBody = z.object({
  dayName: z.string(),
  focus: z.string(),
  orderIndex: z.number().optional(),
});

const AddPlanDayParams = z.object({ planId: z.coerce.string() });

const router: IRouter = Router();

async function buildFullPlan(planId: string) {
  const plan = await db.query.workoutPlansTable.findFirst({ where: eq(workoutPlansTable.id, planId) });
  if (!plan) return null;

  const days = await db.query.workoutDaysTable.findMany({ where: eq(workoutDaysTable.planId, planId) });
  const sortedDays = [...days].sort((a, b) => a.orderIndex - b.orderIndex);

  const fullDays = await Promise.all(
    sortedDays.map(async (day) => {
      const planExercises = await db.query.planExercisesTable.findMany({
        where: eq(planExercisesTable.dayId, day.id),
      });
      const sortedPE = [...planExercises].sort((a, b) => a.orderIndex - b.orderIndex);

      const fullExercises = await Promise.all(
        sortedPE.map(async (pe) => {
          const ex = await db.query.exercisesTable.findFirst({
            where: eq(exercisesTable.id, pe.exerciseId),
          });
          return {
            id: pe.id,
            dayId: pe.dayId,
            exerciseId: pe.exerciseId,
            sets: pe.sets,
            reps: pe.reps,
            restSeconds: pe.restSeconds,
            notes: pe.notes ?? undefined,
            orderIndex: pe.orderIndex,
            exercise: ex
              ? {
                  id: ex.id,
                  name: ex.name,
                  muscleGroup: ex.muscleGroup,
                  equipment: ex.equipment,
                  description: ex.description ?? undefined,
                  isGlobal: ex.isGlobal ?? false,
                  isCustom: ex.isCustom ?? false,
                }
              : null,
          };
        })
      );

      return {
        id: day.id,
        planId: day.planId,
        dayName: day.dayName,
        focus: day.focus,
        orderIndex: day.orderIndex,
        exercises: fullExercises.filter((e) => e.exercise !== null),
      };
    })
  );

  return {
    id: plan.id,
    name: plan.name,
    trainerId: plan.trainerId,
    studentId: plan.studentId ?? undefined,
    isPublished: plan.isPublished ?? false,
    days: fullDays,
  };
}

router.get("/plans", async (req, res) => {
  try {
    const parsed = ListPlansQueryParams.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid query", details: parsed.error.flatten() });
      return;
    }
    const { studentId } = parsed.data;

    const actorId = req.actorId;

    let plans;
    if (studentId) {
      plans = await db.query.workoutPlansTable.findMany({
        where: eq(workoutPlansTable.studentId, studentId),
      });
    } else if (actorId) {
      plans = await db.query.workoutPlansTable.findMany({
        where: eq(workoutPlansTable.trainerId, actorId),
      });
    } else {
      plans = await db.query.workoutPlansTable.findMany();
    }

    res.json(
      plans.map((p) => ({
        id: p.id,
        name: p.name,
        trainerId: p.trainerId,
        studentId: p.studentId ?? undefined,
        isPublished: p.isPublished ?? false,
      }))
    );
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to list plans" });
  }
});

router.post("/plans", async (req, res) => {
  try {
    const parsed = CreatePlanBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
      return;
    }
    const { name, studentId, isPublished } = parsed.data;

    const trainerId = req.actorId ?? "trainer1";
    const id = `plan_${nanoid()}`;
    await db.insert(workoutPlansTable).values({
      id,
      name,
      trainerId,
      studentId: studentId ?? null,
      isPublished: isPublished ?? false,
    });

    if (studentId) {
      await db
        .update(studentTrainerAssignmentsTable)
        .set({ activePlanId: id, status: "active" })
        .where(eq(studentTrainerAssignmentsTable.studentId, studentId));
    }

    const plan = await db.query.workoutPlansTable.findFirst({ where: eq(workoutPlansTable.id, id) });
    res.status(201).json({
      id: plan!.id,
      name: plan!.name,
      trainerId: plan!.trainerId,
      studentId: plan!.studentId ?? undefined,
      isPublished: plan!.isPublished ?? false,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to create plan" });
  }
});

router.get("/plans/:planId", async (req, res) => {
  try {
    const paramsParsed = GetPlanParams.safeParse(req.params);
    if (!paramsParsed.success) {
      res.status(400).json({ error: "Invalid planId" });
      return;
    }
    const full = await buildFullPlan(paramsParsed.data.planId);
    if (!full) {
      res.status(404).json({ error: "Plan not found" });
      return;
    }
    res.json(full);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get plan" });
  }
});

router.put("/plans/:planId", async (req, res) => {
  try {
    const paramsParsed = UpdatePlanParams.safeParse(req.params);
    if (!paramsParsed.success) {
      res.status(400).json({ error: "Invalid planId" });
      return;
    }

    const bodyParsed = UpdatePlanBody.safeParse(req.body);
    if (!bodyParsed.success) {
      res.status(400).json({ error: "Invalid request", details: bodyParsed.error.flatten() });
      return;
    }

    const planId = paramsParsed.data.planId;
    const { name, studentId, isPublished } = bodyParsed.data;

    const planUpdate: {
      name?: string;
      studentId?: string | null;
      isPublished?: boolean;
      updatedAt: Date;
    } = { updatedAt: new Date() };

    if (name !== undefined) planUpdate.name = name;
    if (studentId !== undefined) planUpdate.studentId = studentId;
    if (isPublished !== undefined) planUpdate.isPublished = isPublished;

    await db
      .update(workoutPlansTable)
      .set(planUpdate)
      .where(eq(workoutPlansTable.id, planId));

    if (studentId) {
      await db
        .update(studentTrainerAssignmentsTable)
        .set({ activePlanId: planId, status: "active" })
        .where(eq(studentTrainerAssignmentsTable.studentId, studentId));
    }

    const plan = await db.query.workoutPlansTable.findFirst({
      where: eq(workoutPlansTable.id, planId),
    });
    res.json({
      id: plan!.id,
      name: plan!.name,
      trainerId: plan!.trainerId,
      studentId: plan!.studentId ?? undefined,
      isPublished: plan!.isPublished ?? false,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to update plan" });
  }
});

router.post("/plans/:planId/days", async (req, res) => {
  try {
    const paramsParsed = AddPlanDayParams.safeParse(req.params);
    if (!paramsParsed.success) {
      res.status(400).json({ error: "Invalid planId" });
      return;
    }

    const bodyParsed = CreateDayBody.safeParse(req.body);
    if (!bodyParsed.success) {
      res.status(400).json({ error: "Invalid request", details: bodyParsed.error.flatten() });
      return;
    }

    const { dayName, focus, orderIndex } = bodyParsed.data;
    const id = `day_${nanoid()}`;
    await db.insert(workoutDaysTable).values({
      id,
      planId: paramsParsed.data.planId,
      dayName,
      focus,
      orderIndex: orderIndex ?? 0,
    });

    const day = await db.query.workoutDaysTable.findFirst({ where: eq(workoutDaysTable.id, id) });
    res.status(201).json({
      id: day!.id,
      planId: day!.planId,
      dayName: day!.dayName,
      focus: day!.focus,
      orderIndex: day!.orderIndex,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to add day" });
  }
});

router.post("/plans/:planId/days/:dayId/exercises", async (req, res) => {
  try {
    const paramsParsed = AddDayExerciseParams.safeParse(req.params);
    if (!paramsParsed.success) {
      res.status(400).json({ error: "Invalid params" });
      return;
    }

    const bodyParsed = AddDayExerciseBody.safeParse(req.body);
    if (!bodyParsed.success) {
      res.status(400).json({ error: "Invalid request", details: bodyParsed.error.flatten() });
      return;
    }

    const { exerciseId, sets, reps, restSeconds, notes, orderIndex } = bodyParsed.data;
    const id = `pe_${nanoid()}`;
    await db.insert(planExercisesTable).values({
      id,
      dayId: paramsParsed.data.dayId,
      exerciseId,
      sets,
      reps,
      restSeconds,
      notes,
      orderIndex: orderIndex ?? 0,
    });

    const pe = await db.query.planExercisesTable.findFirst({ where: eq(planExercisesTable.id, id) });
    res.status(201).json({
      id: pe!.id,
      dayId: pe!.dayId,
      exerciseId: pe!.exerciseId,
      sets: pe!.sets,
      reps: pe!.reps,
      restSeconds: pe!.restSeconds,
      notes: pe!.notes ?? undefined,
      orderIndex: pe!.orderIndex,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to add exercise to day" });
  }
});

export default router;
