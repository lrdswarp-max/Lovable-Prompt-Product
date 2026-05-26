import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { usersTable, studentTrainerAssignmentsTable } from "@workspace/db";
import { CompleteOnboardingBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/me/onboarding", async (req, res) => {
  try {
    const parsed = CompleteOnboardingBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
      return;
    }
    const { userId, name, goal, weightKg } = parsed.data;

    const updates: { onboardingDone: string; name?: string; goal?: string; weightKg?: string } = {
      onboardingDone: "true",
    };
    if (name) updates.name = name;
    if (goal) updates.goal = goal;
    if (weightKg) updates.weightKg = weightKg;

    await db.update(usersTable).set(updates).where(eq(usersTable.id, userId));

    await db
      .update(studentTrainerAssignmentsTable)
      .set({ status: "active" })
      .where(eq(studentTrainerAssignmentsTable.studentId, userId));

    const user = await db.query.usersTable.findFirst({ where: eq(usersTable.id, userId) });
    res.json({
      id: user!.id,
      name: user!.name,
      email: user!.email,
      role: user!.role,
      onboardingDone: "true",
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to save onboarding" });
  }
});

export default router;
