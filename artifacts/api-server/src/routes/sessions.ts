import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { workoutSessionsTable, loggedSetsTable, usersTable } from "@workspace/db";
import { nanoid } from "../lib/id";
import { ListSessionsQueryParams, CreateSessionBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/sessions", async (req, res) => {
  try {
    const actorId = req.actorId;
    if (!actorId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const actor = await db.query.usersTable.findFirst({ where: eq(usersTable.id, actorId) });
    const isTrainer = actor?.role === "trainer";

    const parsed = ListSessionsQueryParams.safeParse(req.query);

    let studentId: string;
    if (isTrainer) {
      if (!parsed.success || !parsed.data.studentId || parsed.data.studentId === "undefined") {
        res.status(400).json({ error: "studentId query param required for trainer" });
        return;
      }
      studentId = parsed.data.studentId;
    } else {
      studentId = actorId;
    }

    const sessions = await db.query.workoutSessionsTable.findMany({
      where: eq(workoutSessionsTable.studentId, studentId),
    });

    const result = await Promise.all(
      sessions.map(async (s) => {
        const sets = await db.query.loggedSetsTable.findMany({
          where: eq(loggedSetsTable.sessionId, s.id),
        });
        return {
          id: s.id,
          studentId: s.studentId,
          planId: s.planId,
          dayId: s.dayId,
          dayName: s.dayName,
          planName: s.planName,
          exerciseFocus: s.exerciseFocus,
          startTime: s.startTime,
          endTime: s.endTime ?? undefined,
          status: s.status,
          totalVolume: s.totalVolume ?? undefined,
          loggedSets: sets.map((ls) => ({
            id: ls.id,
            exerciseId: ls.exerciseId,
            planExerciseId: ls.planExerciseId,
            setNumber: ls.setNumber,
            weight: ls.weight,
            reps: ls.reps,
            timestamp: ls.timestamp,
          })),
        };
      })
    );

    const sorted = result.sort((a, b) => b.startTime - a.startTime);
    res.json(sorted);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to list sessions" });
  }
});

router.post("/sessions", async (req, res) => {
  try {
    const actorId = req.actorId;
    if (!actorId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const parsed = CreateSessionBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
      return;
    }
    const {
      planId, dayId, dayName, planName, exerciseFocus,
      startTime, endTime, status, totalVolume, loggedSets,
    } = parsed.data;

    const studentId = actorId;

    const id = `sess_${nanoid()}`;
    await db.insert(workoutSessionsTable).values({
      id,
      studentId,
      planId,
      dayId,
      dayName,
      planName,
      exerciseFocus,
      startTime,
      endTime: endTime ?? null,
      status,
      totalVolume: totalVolume ?? null,
    });

    if (loggedSets && loggedSets.length > 0) {
      await db.insert(loggedSetsTable).values(
        loggedSets.map((ls, i) => ({
          id: `ls_${id}_${i}`,
          sessionId: id,
          exerciseId: ls.exerciseId,
          planExerciseId: ls.planExerciseId,
          setNumber: ls.setNumber,
          weight: ls.weight,
          reps: ls.reps,
          timestamp: ls.timestamp,
        }))
      );
    }

    const sets = await db.query.loggedSetsTable.findMany({ where: eq(loggedSetsTable.sessionId, id) });

    res.status(201).json({
      id,
      studentId,
      planId,
      dayId,
      dayName,
      planName,
      exerciseFocus,
      startTime,
      endTime: endTime ?? undefined,
      status,
      totalVolume: totalVolume ?? undefined,
      loggedSets: sets.map((ls) => ({
        id: ls.id,
        exerciseId: ls.exerciseId,
        planExerciseId: ls.planExerciseId,
        setNumber: ls.setNumber,
        weight: ls.weight,
        reps: ls.reps,
        timestamp: ls.timestamp,
      })),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to create session" });
  }
});

export default router;
