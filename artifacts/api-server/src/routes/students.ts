import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  usersTable,
  studentTrainerAssignmentsTable,
  workoutPlansTable,
  workoutSessionsTable,
  conversationsTable,
  conversationParticipantsTable,
} from "@workspace/db";
import { nanoid } from "../lib/id";
import { InviteStudentBody } from "@workspace/api-zod";

const TRAINER_ID = "trainer1";

const router: IRouter = Router();

router.get("/students", async (req, res) => {
  try {
    const assignments = await db.query.studentTrainerAssignmentsTable.findMany({
      where: eq(studentTrainerAssignmentsTable.trainerId, TRAINER_ID),
    });

    const students = await Promise.all(
      assignments.map(async (a) => {
        const user = await db.query.usersTable.findFirst({ where: eq(usersTable.id, a.studentId) });
        if (!user) return null;

        let activePlanName: string | undefined;
        if (a.activePlanId) {
          const plan = await db.query.workoutPlansTable.findFirst({ where: eq(workoutPlansTable.id, a.activePlanId) });
          activePlanName = plan?.name;
        }

        const lastSessionRaw = await db.query.workoutSessionsTable.findMany({
          where: eq(workoutSessionsTable.studentId, a.studentId),
        });
        const lastSessions = lastSessionRaw.filter((s) => s.status === "complete");
        const lastSession = lastSessions.length > 0
          ? new Date(Math.max(...lastSessions.map((s) => s.startTime))).toISOString().split("T")[0]
          : undefined;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          status: a.status,
          activePlanName,
          lastSession,
          goal: user.goal ?? undefined,
          weightKg: user.weightKg ?? undefined,
          heightCm: user.heightCm ?? undefined,
        };
      })
    );

    res.json(students.filter(Boolean));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to list students" });
  }
});

router.post("/students", async (req, res) => {
  try {
    const parsed = InviteStudentBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
      return;
    }
    const { name, email } = parsed.data;

    let user = await db.query.usersTable.findFirst({ where: eq(usersTable.email, email.toLowerCase()) });

    if (!user) {
      const id = `student_${nanoid()}`;
      await db.insert(usersTable).values({
        id,
        name,
        email: email.toLowerCase(),
        role: "student",
      });
      user = await db.query.usersTable.findFirst({ where: eq(usersTable.id, id) });
    }

    await db.insert(studentTrainerAssignmentsTable).values({
      id: `assign_${user!.id}`,
      studentId: user!.id,
      trainerId: TRAINER_ID,
      status: "invited",
    }).onConflictDoNothing();

    const convId = `conv_${user!.id}_${TRAINER_ID}`;
    const existingConv = await db.query.conversationsTable.findFirst({ where: eq(conversationsTable.id, convId) });
    if (!existingConv) {
      await db.insert(conversationsTable).values({ id: convId, isGroup: false }).onConflictDoNothing();
      await db.insert(conversationParticipantsTable).values([
        { id: `cp_${convId}_student`, conversationId: convId, userId: user!.id },
        { id: `cp_${convId}_trainer`, conversationId: convId, userId: TRAINER_ID },
      ]).onConflictDoNothing();
    }

    res.status(201).json({
      id: user!.id,
      name: user!.name,
      email: user!.email,
      status: "invited",
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to invite student" });
  }
});

export default router;
