import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { exercisesTable, muscleGroupEnum } from "@workspace/db";
import { nanoid } from "../lib/id";
import { ListExercisesQueryParams, CreateExerciseBody } from "@workspace/api-zod";
import { z } from "zod";

type MuscleGroupValue = typeof muscleGroupEnum.enumValues[number];
const MuscleGroupZod = z.enum(muscleGroupEnum.enumValues);

const router: IRouter = Router();

router.get("/exercises", async (req, res) => {
  try {
    const parsed = ListExercisesQueryParams.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid query", details: parsed.error.flatten() });
      return;
    }
    const { muscleGroup, search } = parsed.data;

    let exercises = await db.query.exercisesTable.findMany();

    if (muscleGroup && muscleGroup !== "all") {
      exercises = exercises.filter((e) => e.muscleGroup === muscleGroup);
    }
    if (search) {
      const q = search.toLowerCase();
      exercises = exercises.filter(
        (e) => e.name.toLowerCase().includes(q) || e.equipment.toLowerCase().includes(q)
      );
    }

    res.json(
      exercises.map((e) => ({
        id: e.id,
        name: e.name,
        muscleGroup: e.muscleGroup,
        equipment: e.equipment,
        description: e.description ?? undefined,
        isGlobal: e.isGlobal ?? false,
        isCustom: e.isCustom ?? false,
      }))
    );
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to list exercises" });
  }
});

router.post("/exercises", async (req, res) => {
  try {
    const bodyParsed = CreateExerciseBody.safeParse(req.body);
    if (!bodyParsed.success) {
      res.status(400).json({ error: "Invalid request", details: bodyParsed.error.flatten() });
      return;
    }

    const mgParsed = MuscleGroupZod.safeParse(bodyParsed.data.muscleGroup);
    if (!mgParsed.success) {
      res.status(400).json({
        error: `Invalid muscleGroup. Must be one of: ${muscleGroupEnum.enumValues.join(", ")}`,
      });
      return;
    }

    const { name, equipment, description } = bodyParsed.data;
    const muscleGroup: MuscleGroupValue = mgParsed.data;
    const id = `ex_${nanoid()}`;

    await db.insert(exercisesTable).values({
      id,
      name,
      muscleGroup,
      equipment,
      description,
      isCustom: true,
      isGlobal: false,
    });

    const ex = await db.query.exercisesTable.findFirst({ where: eq(exercisesTable.id, id) });
    res.status(201).json({
      id: ex!.id,
      name: ex!.name,
      muscleGroup: ex!.muscleGroup,
      equipment: ex!.equipment,
      description: ex!.description ?? undefined,
      isGlobal: false,
      isCustom: true,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to create exercise" });
  }
});

export default router;
