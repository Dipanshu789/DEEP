import { pgTable, text, serial, integer, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull(), // 'user' | 'admin'
  faceData: text("face_data"), // Base64 encoded face data
  isRegistered: boolean("is_registered").default(false),
  companyId: integer("company_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  employeeCount: text("employee_count").notNull(),
  companyCode: text("company_code").notNull().unique(),
  companyPassword: text("company_password").notNull(),
  adminId: integer("admin_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const attendanceRecords = pgTable("attendance_records", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  companyId: integer("company_id").notNull(),
  checkIn: timestamp("check_in"),
  checkOut: timestamp("check_out"),
  date: text("date").notNull(),
  faceVerified: boolean("face_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  role: true,
  faceData: true,
});

export const insertCompanySchema = createInsertSchema(companies).pick({
  name: true,
  email: true,
  employeeCount: true,
  companyCode: true,
  companyPassword: true,
  adminId: true,
});

export const insertAttendanceSchema = createInsertSchema(attendanceRecords).pick({
  userId: true,
  companyId: true,
  checkIn: true,
  checkOut: true,
  date: true,
  faceVerified: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Company = typeof companies.$inferSelect;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type AttendanceRecord = typeof attendanceRecords.$inferSelect;
