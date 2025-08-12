import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, real, blob } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const companies = sqliteTable("companies", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().default("JASANA"),
  logo: blob("logo"),
  primaryColor: text("primary_color").notNull().default("#0D9488"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

export const schedules = sqliteTable("schedules", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  entryTime: text("entry_time").notNull(),
  breakfastStart: text("breakfast_start"),
  breakfastEnd: text("breakfast_end"),
  lunchStart: text("lunch_start"),
  lunchEnd: text("lunch_end"),
  exitTime: text("exit_time").notNull(),
  overtimeAllowed: integer("overtime_allowed", { mode: "boolean" }).default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

export const employees = sqliteTable("employees", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  employeeId: text("employee_id").notNull().unique(),
  fullName: text("full_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  department: text("department").notNull(),
  scheduleId: integer("schedule_id").references(() => schedules.id),
  photo: blob("photo"),
  barcode: text("barcode").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

export const attendances = sqliteTable("attendances", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  employeeId: integer("employee_id").notNull().references(() => employees.id),
  checkIn: integer("check_in", { mode: "timestamp" }),
  checkOut: integer("check_out", { mode: "timestamp" }),
  breakStart: integer("break_start", { mode: "timestamp" }),
  breakEnd: integer("break_end", { mode: "timestamp" }),
  lunchStart: integer("lunch_start", { mode: "timestamp" }),
  lunchEnd: integer("lunch_end", { mode: "timestamp" }),
  totalHours: real("total_hours").default(0),
  overtimeHours: real("overtime_hours").default(0),
  date: text("date").notNull(), // YYYY-MM-DD format
  status: text("status").notNull().default("pending"), // pending, complete, incomplete
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

// Zod schemas
export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
  createdAt: true,
});

export const insertScheduleSchema = createInsertSchema(schedules).omit({
  id: true,
  createdAt: true,
});

export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  createdAt: true,
}).extend({
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  scheduleId: z.number().optional().or(z.string().transform(val => val === "" ? undefined : parseInt(val)).optional()),
});

export const insertAttendanceSchema = createInsertSchema(attendances).omit({
  id: true,
  createdAt: true,
});

// Types
export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;

export type Schedule = typeof schedules.$inferSelect;
export type InsertSchedule = z.infer<typeof insertScheduleSchema>;

export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;

export type Attendance = typeof attendances.$inferSelect;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;

// Extended types for API responses
export type EmployeeWithSchedule = Employee & {
  schedule?: Schedule;
};

export type AttendanceWithEmployee = Attendance & {
  employee: Employee;
};

export type AttendanceReport = {
  employeeId: string;
  fullName: string;
  department: string;
  checkIns: string[];
  checkOuts: string[];
  totalHours: number;
  overtimeHours: number;
  date: string;
};
