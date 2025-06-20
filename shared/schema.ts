import { pgTable, text, serial, integer, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  role: text("role").notNull(), // 'user' | 'admin' | 'super_admin'
  faceData: text("face_data"), // Encrypted face biometric data
  isRegistered: boolean("is_registered").default(false),
  isActive: boolean("is_active").default(true),
  companyId: integer("company_id"),
  department: text("department"),
  position: text("position"),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  address: text("address"),
  industry: text("industry"),
  employeeCount: text("employee_count").notNull(),
  companyCode: text("company_code").notNull().unique(),
  companyPassword: text("company_password").notNull(),
  adminId: integer("admin_id").notNull(),
  isActive: boolean("is_active").default(true),
  subscription: text("subscription").default("basic"), // 'basic' | 'premium' | 'enterprise'
  maxEmployees: integer("max_employees").default(50),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const attendanceRecords = pgTable("attendance_records", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  companyId: integer("company_id").notNull(),
  checkIn: timestamp("check_in"),
  checkOut: timestamp("check_out"),
  date: text("date").notNull(),
  faceVerified: boolean("face_verified").default(false),
  location: text("location"), // GPS coordinates or office location
  deviceInfo: text("device_info"), // Device used for attendance
  ipAddress: text("ip_address"), // Security tracking
  status: text("status").default("present"), // 'present' | 'late' | 'absent' | 'half_day'
  notes: text("notes"), // Admin notes or user remarks
  approvedBy: integer("approved_by"), // Admin who approved manual entries
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// New enterprise tables
export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  companyId: integer("company_id").notNull(),
  managerId: integer("manager_id"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  companyId: integer("company_id").notNull(),
  action: text("action").notNull(), // 'login', 'check_in', 'check_out', 'face_register', etc.
  entityType: text("entity_type"), // 'user', 'company', 'attendance', etc.
  entityId: integer("entity_id"),
  details: text("details"), // JSON string with additional info
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const companySettings = pgTable("company_settings", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().unique(),
  workingHours: text("working_hours").default('{"start":"09:00","end":"17:00"}'), // JSON
  workingDays: text("working_days").default('["mon","tue","wed","thu","fri"]'), // JSON array
  timeZone: text("time_zone").default("UTC"),
  lateThreshold: integer("late_threshold").default(15), // minutes
  requireFaceVerification: boolean("require_face_verification").default(true),
  allowManualEntry: boolean("allow_manual_entry").default(false),
  geoFencing: text("geo_fencing"), // JSON with allowed locations
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  firstName: true,
  lastName: true,
  role: true,
  faceData: true,
  department: true,
  position: true,
});

export const insertCompanySchema = createInsertSchema(companies).pick({
  name: true,
  email: true,
  phone: true,
  address: true,
  industry: true,
  employeeCount: true,
  companyCode: true,
  companyPassword: true,
  adminId: true,
  subscription: true,
  maxEmployees: true,
});

export const insertDepartmentSchema = createInsertSchema(departments).pick({
  name: true,
  description: true,
  companyId: true,
  managerId: true,
});

export const insertAttendanceSchema = createInsertSchema(attendanceRecords).pick({
  userId: true,
  companyId: true,
  checkIn: true,
  checkOut: true,
  date: true,
  faceVerified: true,
  location: true,
  deviceInfo: true,
  ipAddress: true,
  status: true,
  notes: true,
  approvedBy: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).pick({
  userId: true,
  companyId: true,
  action: true,
  entityType: true,
  entityId: true,
  details: true,
  ipAddress: true,
  userAgent: true,
});

export const insertCompanySettingsSchema = createInsertSchema(companySettings).pick({
  companyId: true,
  workingHours: true,
  workingDays: true,
  timeZone: true,
  lateThreshold: true,
  requireFaceVerification: true,
  allowManualEntry: true,
  geoFencing: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Company = typeof companies.$inferSelect;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;
export type Department = typeof departments.$inferSelect;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type AttendanceRecord = typeof attendanceRecords.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertCompanySettings = z.infer<typeof insertCompanySettingsSchema>;
export type CompanySettings = typeof companySettings.$inferSelect;
