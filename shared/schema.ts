import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const employees = pgTable("employees", {
  id: varchar("id").primaryKey(),
  fullName: text("full_name").notNull(),
  department: varchar("department").notNull(),
  schedule: varchar("schedule").notNull(),
  barcode: text("barcode"),
  photo: text("photo"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const schedules = pgTable("schedules", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  entryTime: text("entry_time").notNull(),
  exitTime: text("exit_time").notNull(),
  breakfastStart: text("breakfast_start"),
  breakfastEnd: text("breakfast_end"),
  lunchStart: text("lunch_start"),
  lunchEnd: text("lunch_end"),
  isActive: boolean("is_active").default(true),
});

export const attendanceRecords = pgTable("attendance_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull().references(() => employees.id),
  checkInTime: timestamp("check_in_time"),
  checkOutTime: timestamp("check_out_time"),
  date: varchar("date").notNull(),
  totalHours: text("total_hours"),
  overtimeHours: text("overtime_hours"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const systemSettings = pgTable("system_settings", {
  id: varchar("id").primaryKey().default("main"),
  blockingTime: integer("blocking_time").default(60),
  entryTolerance: integer("entry_tolerance").default(15),
  autoBackup: boolean("auto_backup").default(true),
  cameraAudio: boolean("camera_audio").default(false),
  credentialSettings: json("credential_settings").$type<{
    colorScheme: string;
    fontSize: string;
    showDepartment: boolean;
    showPhoto: boolean;
    showBarcode: boolean;
    fontFamily: string;
  }>().default({
    colorScheme: "default",
    fontSize: "medium",
    showDepartment: true,
    showPhoto: true,
    showBarcode: true,
    fontFamily: "inter"
  }),
});

// Relations
export const employeesRelations = relations(employees, ({ many }) => ({
  attendanceRecords: many(attendanceRecords),
}));

export const attendanceRecordsRelations = relations(attendanceRecords, ({ one }) => ({
  employee: one(employees, {
    fields: [attendanceRecords.employeeId],
    references: [employees.id],
  }),
}));

// Insert schemas
export const insertEmployeeSchema = createInsertSchema(employees).omit({
  createdAt: true,
});

export const insertScheduleSchema = createInsertSchema(schedules);

export const insertAttendanceRecordSchema = createInsertSchema(attendanceRecords).omit({
  id: true,
  createdAt: true,
});

export const insertSystemSettingsSchema = createInsertSchema(systemSettings);

// Types
export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Schedule = typeof schedules.$inferSelect;
export type InsertSchedule = z.infer<typeof insertScheduleSchema>;
export type AttendanceRecord = typeof attendanceRecords.$inferSelect;
export type InsertAttendanceRecord = z.infer<typeof insertAttendanceRecordSchema>;
export type SystemSettings = typeof systemSettings.$inferSelect;
export type InsertSystemSettings = z.infer<typeof insertSystemSettingsSchema>;

// Legacy user schema for existing auth system
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
