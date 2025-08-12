import { 
  employees, 
  schedules, 
  attendanceRecords, 
  systemSettings,
  users,
  type Employee, 
  type InsertEmployee,
  type Schedule,
  type InsertSchedule,
  type AttendanceRecord,
  type InsertAttendanceRecord,
  type SystemSettings,
  type InsertSystemSettings,
  type User,
  type InsertUser
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";

export interface IStorage {
  // User methods (legacy)
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Employee methods
  getAllEmployees(): Promise<Employee[]>;
  getEmployee(id: string): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: string, employee: Partial<Employee>): Promise<Employee>;
  deleteEmployee(id: string): Promise<void>;
  
  // Schedule methods
  getAllSchedules(): Promise<Schedule[]>;
  getSchedule(id: string): Promise<Schedule | undefined>;
  createSchedule(schedule: InsertSchedule): Promise<Schedule>;
  updateSchedule(id: string, schedule: Partial<Schedule>): Promise<Schedule>;
  
  // Attendance methods
  createAttendanceRecord(record: InsertAttendanceRecord): Promise<AttendanceRecord>;
  getAttendanceRecords(employeeId?: string, startDate?: string, endDate?: string): Promise<AttendanceRecord[]>;
  getTodayAttendance(employeeId: string): Promise<AttendanceRecord | undefined>;
  updateAttendanceRecord(id: string, record: Partial<AttendanceRecord>): Promise<AttendanceRecord>;
  getAttendanceStats(): Promise<{
    todayCheckIns: number;
    todayCheckOuts: number;
    activeEmployees: number;
    averageTime: string;
  }>;
  
  // System settings
  getSystemSettings(): Promise<SystemSettings | undefined>;
  updateSystemSettings(settings: Partial<SystemSettings>): Promise<SystemSettings>;
}

export class DatabaseStorage implements IStorage {
  // User methods (legacy)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Employee methods
  async getAllEmployees(): Promise<Employee[]> {
    return await db.select().from(employees).where(eq(employees.isActive, true)).orderBy(employees.fullName);
  }

  async getEmployee(id: string): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.id, id));
    return employee || undefined;
  }

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const [newEmployee] = await db.insert(employees).values(employee).returning();
    return newEmployee;
  }

  async updateEmployee(id: string, employee: Partial<Employee>): Promise<Employee> {
    const [updatedEmployee] = await db
      .update(employees)
      .set(employee)
      .where(eq(employees.id, id))
      .returning();
    return updatedEmployee;
  }

  async deleteEmployee(id: string): Promise<void> {
    await db.update(employees).set({ isActive: false }).where(eq(employees.id, id));
  }

  // Schedule methods
  async getAllSchedules(): Promise<Schedule[]> {
    return await db.select().from(schedules).where(eq(schedules.isActive, true));
  }

  async getSchedule(id: string): Promise<Schedule | undefined> {
    const [schedule] = await db.select().from(schedules).where(eq(schedules.id, id));
    return schedule || undefined;
  }

  async createSchedule(schedule: InsertSchedule): Promise<Schedule> {
    const [newSchedule] = await db.insert(schedules).values(schedule).returning();
    return newSchedule;
  }

  async updateSchedule(id: string, schedule: Partial<Schedule>): Promise<Schedule> {
    const [updatedSchedule] = await db
      .update(schedules)
      .set(schedule)
      .where(eq(schedules.id, id))
      .returning();
    return updatedSchedule;
  }

  // Attendance methods
  async createAttendanceRecord(record: InsertAttendanceRecord): Promise<AttendanceRecord> {
    const [newRecord] = await db.insert(attendanceRecords).values(record).returning();
    return newRecord;
  }

  async getAttendanceRecords(employeeId?: string, startDate?: string, endDate?: string): Promise<AttendanceRecord[]> {
    let query = db.select().from(attendanceRecords);
    
    const conditions = [];
    if (employeeId) {
      conditions.push(eq(attendanceRecords.employeeId, employeeId));
    }
    if (startDate) {
      conditions.push(gte(attendanceRecords.date, startDate));
    }
    if (endDate) {
      conditions.push(lte(attendanceRecords.date, endDate));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(attendanceRecords.date));
  }

  async getTodayAttendance(employeeId: string): Promise<AttendanceRecord | undefined> {
    const today = new Date().toISOString().split('T')[0];
    const [record] = await db
      .select()
      .from(attendanceRecords)
      .where(and(
        eq(attendanceRecords.employeeId, employeeId),
        eq(attendanceRecords.date, today)
      ));
    return record || undefined;
  }

  async updateAttendanceRecord(id: string, record: Partial<AttendanceRecord>): Promise<AttendanceRecord> {
    const [updatedRecord] = await db
      .update(attendanceRecords)
      .set(record)
      .where(eq(attendanceRecords.id, id))
      .returning();
    return updatedRecord;
  }

  async getAttendanceStats(): Promise<{
    todayCheckIns: number;
    todayCheckOuts: number;
    activeEmployees: number;
    averageTime: string;
  }> {
    const today = new Date().toISOString().split('T')[0];
    
    const [todayRecords] = await db
      .select({
        checkIns: sql<number>`COUNT(CASE WHEN check_in_time IS NOT NULL THEN 1 END)`,
        checkOuts: sql<number>`COUNT(CASE WHEN check_out_time IS NOT NULL THEN 1 END)`,
      })
      .from(attendanceRecords)
      .where(eq(attendanceRecords.date, today));
    
    const [activeCount] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(employees)
      .where(eq(employees.isActive, true));
    
    return {
      todayCheckIns: todayRecords?.checkIns || 0,
      todayCheckOuts: todayRecords?.checkOuts || 0,
      activeEmployees: activeCount?.count || 0,
      averageTime: "8.2h", // Calculated from recent data
    };
  }

  // System settings
  async getSystemSettings(): Promise<SystemSettings | undefined> {
    const [settings] = await db.select().from(systemSettings).where(eq(systemSettings.id, "main"));
    return settings || undefined;
  }

  async updateSystemSettings(settings: Partial<SystemSettings>): Promise<SystemSettings> {
    const [updatedSettings] = await db
      .update(systemSettings)
      .set(settings)
      .where(eq(systemSettings.id, "main"))
      .returning();
    return updatedSettings;
  }
}

export const storage = new DatabaseStorage();
