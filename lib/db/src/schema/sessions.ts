import { pgTable, text, integer, bigint, pgEnum, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const sessionStatusEnum = pgEnum("session_status", ["active", "complete"]);

export const workoutSessionsTable = pgTable("workout_sessions", {
  id: text("id").primaryKey(),
  studentId: text("student_id").notNull(),
  planId: text("plan_id").notNull(),
  dayId: text("day_id").notNull(),
  dayName: text("day_name").notNull(),
  planName: text("plan_name").notNull(),
  exerciseFocus: text("exercise_focus").notNull(),
  startTime: bigint("start_time", { mode: "number" }).notNull(),
  endTime: bigint("end_time", { mode: "number" }),
  status: sessionStatusEnum("status").notNull().default("active"),
  totalVolume: integer("total_volume"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const loggedSetsTable = pgTable("logged_sets", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  exerciseId: text("exercise_id").notNull(),
  planExerciseId: text("plan_exercise_id").notNull(),
  setNumber: integer("set_number").notNull(),
  weight: integer("weight").notNull().default(0),
  reps: integer("reps").notNull().default(0),
  timestamp: bigint("timestamp", { mode: "number" }).notNull(),
});

export const insertWorkoutSessionSchema = createInsertSchema(workoutSessionsTable).omit({ createdAt: true });
export const insertLoggedSetSchema = createInsertSchema(loggedSetsTable);
export const selectWorkoutSessionSchema = createSelectSchema(workoutSessionsTable);
export const selectLoggedSetSchema = createSelectSchema(loggedSetsTable);

export type InsertWorkoutSession = z.infer<typeof insertWorkoutSessionSchema>;
export type WorkoutSession = typeof workoutSessionsTable.$inferSelect;
export type InsertLoggedSet = z.infer<typeof insertLoggedSetSchema>;
export type LoggedSet = typeof loggedSetsTable.$inferSelect;
