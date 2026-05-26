import { sql } from "drizzle-orm";
import { pgTable, pgEnum, text, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const userRoleEnum = pgEnum("user_role", ["student", "trainer"]);

/**
 * Single users table satisfying both Replit OIDC auth and the TrainFlow app.
 * - OIDC fields: email, firstName, lastName, profileImageUrl, updatedAt
 * - App fields:  name, role, pinHash, goal, weightKg, heightCm, onboardingDone
 * All app-specific fields are nullable so OIDC upserts don't require them.
 */
export const usersTable = pgTable("users", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").unique(),
  // OIDC profile fields
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  // App profile fields
  name: text("name"),
  role: userRoleEnum("role"),
  pinHash: text("pin_hash"),
  goal: text("goal"),
  weightKg: text("weight_kg"),
  heightCm: text("height_cm"),
  onboardingDone: text("onboarding_done").default("false"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ createdAt: true, updatedAt: true });
export const selectUserSchema = createSelectSchema(usersTable);
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = typeof usersTable.$inferInsert;
export type User = typeof usersTable.$inferSelect;
