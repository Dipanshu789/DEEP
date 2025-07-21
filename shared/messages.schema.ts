import { pgTable, varchar, text, timestamp } from "drizzle-orm/pg-core";

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().notNull(),
  senderId: varchar("sender_id").notNull(),
  senderName: varchar("sender_name").notNull(),
  senderProfileImageUrl: varchar("sender_profile_image_url"),
  message: text("message").notNull(),
  to: varchar("to").notNull(), // userId or "all" for group
  timestamp: timestamp("timestamp").notNull(),
});

// Types
export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;
