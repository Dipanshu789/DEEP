import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  decimal,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";
import { messages } from "./messages.schema";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  fullName: varchar("full_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role", { enum: ["admin", "user"] }).notNull().default("user"),
  faceData: text("face_data"), // Base64 encoded face image
  faceDescriptor: text("face_descriptor"), // JSON stringified array of face descriptor
  companyCode: varchar("company_code"),
  passwordHash: text("password_hash"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Companies table
export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  email: varchar("email").notNull(),
  companyCode: varchar("company_code").unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  employeeCount: integer("employee_count").notNull(),
  adminId: varchar("admin_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Geofences table
export const geofences = pgTable("geofences", {
  id: serial("id").primaryKey(),
  adminId: varchar("admin_id").notNull(),
  companyCode: varchar("company_code").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
  altitude: decimal("altitude", { precision: 8, scale: 2 }),
  radius: integer("radius").notNull().default(100), // meters
  createdAt: timestamp("created_at").defaultNow(),
});

// Attendance logs table
export const attendanceLogs = pgTable("attendance_logs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  companyCode: varchar("company_code").notNull(),
  date: varchar("date").notNull(), // YYYY-MM-DD format
  checkInTime: timestamp("check_in_time"),
  checkOutTime: timestamp("check_out_time"),
  checkInLat: decimal("check_in_lat", { precision: 10, scale: 8 }),
  checkInLon: decimal("check_in_lon", { precision: 11, scale: 8 }),
  checkOutLat: decimal("check_out_lat", { precision: 10, scale: 8 }),
  checkOutLon: decimal("check_out_lon", { precision: 11, scale: 8 }),
  isTracking: boolean("is_tracking").default(false),
  hoursWorked: decimal("hours_worked", { precision: 5, scale: 2 }),
  status: varchar("status", { enum: ["present", "absent", "late", "incomplete", "complete"] }).default("incomplete"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  company: one(companies, {
    fields: [users.companyCode],
    references: [companies.companyCode],
  }),
  attendanceLogs: many(attendanceLogs),
}));

export const companiesRelations = relations(companies, ({ one, many }) => ({
  admin: one(users, {
    fields: [companies.adminId],
    references: [users.id],
  }),
  employees: many(users),
  geofence: one(geofences),
}));

export const geofencesRelations = relations(geofences, ({ one }) => ({
  company: one(companies, {
    fields: [geofences.companyCode],
    references: [companies.companyCode],
  }),
  admin: one(users, {
    fields: [geofences.adminId],
    references: [users.id],
  }),
}));

export const attendanceLogsRelations = relations(attendanceLogs, ({ one }) => ({
  user: one(users, {
    fields: [attendanceLogs.userId],
    references: [users.id],
  }),
  company: one(companies, {
    fields: [attendanceLogs.companyCode],
    references: [companies.companyCode],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
  createdAt: true,
});

export const insertGeofenceSchema = createInsertSchema(geofences).omit({
  id: true,
  createdAt: true,
});

export const insertAttendanceLogSchema = createInsertSchema(attendanceLogs).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Geofence = typeof geofences.$inferSelect;
export type InsertGeofence = z.infer<typeof insertGeofenceSchema>;
export type AttendanceLog = typeof attendanceLogs.$inferSelect;
export type InsertAttendanceLog = z.infer<typeof insertAttendanceLogSchema>;

export { messages };
export type { Message, InsertMessage } from "./messages.schema";
