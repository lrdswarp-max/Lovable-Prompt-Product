import { pgTable, text, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const workoutPlansTable = pgTable("workout_plans", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  trainerId: text("trainer_id").notNull(),
  studentId: text("student_id"),
  isPublished: boolean("is_published").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const workoutDaysTable = pgTable("workout_days", {
  id: text("id").primaryKey(),
  planId: text("plan_id").notNull(),
  dayName: text("day_name").notNull(),
  focus: text("focus").notNull(),
  orderIndex: integer("order_index").notNull().default(0),
});

export const planExercisesTable = pgTable("plan_exercises", {
  id: text("id").primaryKey(),
  dayId: text("day_id").notNull(),
  exerciseId: text("exercise_id").notNull(),
  sets: integer("sets").notNull().default(3),
  reps: text("reps").notNull().default("10"),
  restSeconds: integer("rest_seconds").notNull().default(60),
  notes: text("notes"),
  orderIndex: integer("order_index").notNull().default(0),
});

export const insertWorkoutPlanSchema = createInsertSchema(workoutPlansTable).omit({ createdAt: true, updatedAt: true });
export const insertWorkoutDaySchema = createInsertSchema(workoutDaysTable);
export const insertPlanExerciseSchema = createInsertSchema(planExercisesTable);

export const selectWorkoutPlanSchema = createSelectSchema(workoutPlansTable);
export const selectWorkoutDaySchema = createSelectSchema(workoutDaysTable);
export const selectPlanExerciseSchema = createSelectSchema(planExercisesTable);

export type InsertWorkoutPlan = z.infer<typeof insertWorkoutPlanSchema>;
export type WorkoutPlan = typeof workoutPlansTable.$inferSelect;
export type InsertWorkoutDay = z.infer<typeof insertWorkoutDaySchema>;
export type WorkoutDay = typeof workoutDaysTable.$inferSelect;
export type InsertPlanExercise = z.infer<typeof insertPlanExerciseSchema>;
export type PlanExercise = typeof planExercisesTable.$inferSelect;
