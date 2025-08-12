import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const workSchedules = pgTable("work_schedules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  entryTime: text("entry_time").notNull(),
  breakfastOutTime: text("breakfast_out_time"),
  breakfastInTime: text("breakfast_in_time"),
  lunchOutTime: text("lunch_out_time"),
  lunchInTime: text("lunch_in_time"),
  exitTime: text("exit_time").notNull(),
  overtimeEnabled: boolean("overtime_enabled").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const employees = pgTable("employees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: text("employee_id").notNull().unique(),
  fullName: text("full_name").notNull(),
  department: text("department").notNull(),
  workScheduleId: varchar("work_schedule_id").references(() => workSchedules.id),
  photoUrl: text("photo_url"),
  barcodeData: text("barcode_data").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const attendanceRecords = pgTable("attendance_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").references(() => employees.id).notNull(),
  checkInTime: timestamp("check_in_time"),
  checkOutTime: timestamp("check_out_time"),
  breakfastOutTime: timestamp("breakfast_out_time"),
  breakfastInTime: timestamp("breakfast_in_time"),
  lunchOutTime: timestamp("lunch_out_time"),
  lunchInTime: timestamp("lunch_in_time"),
  totalHours: integer("total_hours"), // in minutes
  overtimeHours: integer("overtime_hours"), // in minutes
  date: text("date").notNull(), // YYYY-MM-DD format
  createdAt: timestamp("created_at").defaultNow(),
});

export const credentialSettings = pgTable("credential_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyName: text("company_name").notNull(),
  logoUrl: text("logo_url"),
  primaryColor: text("primary_color").default("#2563EB"),
  fontFamily: text("font_family").default("Inter"),
  template: json("template").$type<{
    width: number;
    height: number;
    elements: Array<{
      type: string;
      position: { x: number; y: number };
      size: { width: number; height: number };
      style: Record<string, any>;
    }>;
  }>(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const departments = pgTable("departments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const systemSettings = pgTable("system_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyName: text("company_name").default("TimeCheck Pro"),
  timezone: text("timezone").default("America/Mexico_City"),
  emailNotifications: boolean("email_notifications").default(true),
  darkMode: boolean("dark_mode").default(false),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertWorkScheduleSchema = createInsertSchema(workSchedules).omit({
  id: true,
  createdAt: true,
});

export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  createdAt: true,
});

export const insertAttendanceRecordSchema = createInsertSchema(attendanceRecords).omit({
  id: true,
  createdAt: true,
});

export const insertCredentialSettingsSchema = createInsertSchema(credentialSettings).omit({
  id: true,
});

export const insertDepartmentSchema = createInsertSchema(departments).omit({
  id: true,
  createdAt: true,
});

export const insertSystemSettingsSchema = createInsertSchema(systemSettings).omit({
  id: true,
});

// Types
export type WorkSchedule = typeof workSchedules.$inferSelect;
export type Employee = typeof employees.$inferSelect;
export type AttendanceRecord = typeof attendanceRecords.$inferSelect;
export type CredentialSettings = typeof credentialSettings.$inferSelect;
export type SystemSettings = typeof systemSettings.$inferSelect;
export type Department = typeof departments.$inferSelect;

export type InsertWorkSchedule = z.infer<typeof insertWorkScheduleSchema>;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type InsertAttendanceRecord = z.infer<typeof insertAttendanceRecordSchema>;
export type InsertCredentialSettings = z.infer<typeof insertCredentialSettingsSchema>;
export type InsertSystemSettings = z.infer<typeof insertSystemSettingsSchema>;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;
