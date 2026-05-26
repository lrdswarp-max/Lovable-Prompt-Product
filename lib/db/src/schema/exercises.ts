import { pgTable, text, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const muscleGroupEnum = pgEnum("muscle_group", [
  "chest", "back", "legs", "shoulders", "biceps", "triceps", "core", "cardio",
]);

export const exercisesTable = pgTable("exercises", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  muscleGroup: muscleGroupEnum("muscle_group").notNull(),
  equipment: text("equipment").notNull(),
  description: text("description"),
  isGlobal: boolean("is_global").default(false),
  isCustom: boolean("is_custom").default(false),
  trainerId: text("trainer_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertExerciseSchema = createInsertSchema(exercisesTable).omit({ createdAt: true });
export const selectExerciseSchema = createSelectSchema(exercisesTable);
export type InsertExercise = z.infer<typeof insertExerciseSchema>;
export type Exercise = typeof exercisesTable.$inferSelect;
