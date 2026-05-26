import { pgTable, text, boolean, timestamp, bigint } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const conversationsTable = pgTable("conversations", {
  id: text("id").primaryKey(),
  isGroup: boolean("is_group").notNull().default(false),
  title: text("title"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const conversationParticipantsTable = pgTable("conversation_participants", {
  id: text("id").primaryKey(),
  conversationId: text("conversation_id").notNull(),
  userId: text("user_id").notNull(),
});

export const messagesTable = pgTable("messages", {
  id: text("id").primaryKey(),
  conversationId: text("conversation_id").notNull(),
  senderId: text("sender_id").notNull(),
  senderName: text("sender_name").notNull(),
  text: text("text").notNull(),
  timestamp: bigint("timestamp", { mode: "number" }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const studentTrainerAssignmentsTable = pgTable("student_trainer_assignments", {
  id: text("id").primaryKey(),
  studentId: text("student_id").notNull().unique(),
  trainerId: text("trainer_id").notNull(),
  status: text("status").notNull().default("active"),
  activePlanId: text("active_plan_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertConversationSchema = createInsertSchema(conversationsTable).omit({ createdAt: true });
export const insertConversationParticipantSchema = createInsertSchema(conversationParticipantsTable);
export const insertMessageSchema = createInsertSchema(messagesTable).omit({ createdAt: true });
export const insertAssignmentSchema = createInsertSchema(studentTrainerAssignmentsTable).omit({ createdAt: true });

export const selectConversationSchema = createSelectSchema(conversationsTable);
export const selectMessageSchema = createSelectSchema(messagesTable);
export const selectAssignmentSchema = createSelectSchema(studentTrainerAssignmentsTable);

export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversationsTable.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messagesTable.$inferSelect;
export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;
export type Assignment = typeof studentTrainerAssignmentsTable.$inferSelect;
