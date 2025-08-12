import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import {
  companies,
  schedules,
  employees,
  attendances,
  type Company,
  type InsertCompany,
  type Schedule,
  type InsertSchedule,
  type Employee,
  type InsertEmployee,
  type Attendance,
  type InsertAttendance,
  type EmployeeWithSchedule,
  type AttendanceWithEmployee,
  type AttendanceReport,
} from "@shared/schema";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import path from "path";

const sqlite = new Database(path.join(process.cwd(), "attendance.db"));
sqlite.pragma("journal_mode = WAL");

const db = drizzle(sqlite);

// Initialize database with default data
async function initializeDatabase() {
  // Create tables if they don't exist
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL DEFAULT 'JASANA',
      logo BLOB,
      primary_color TEXT NOT NULL DEFAULT '#0D9488',
      created_at INTEGER DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      entry_time TEXT NOT NULL,
      breakfast_start TEXT,
      breakfast_end TEXT,
      lunch_start TEXT,
      lunch_end TEXT,
      exit_time TEXT NOT NULL,
      overtime_allowed INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id TEXT NOT NULL UNIQUE,
      full_name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      department TEXT NOT NULL,
      schedule_id INTEGER REFERENCES schedules(id),
      photo BLOB,
      barcode TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at INTEGER DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS attendances (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL REFERENCES employees(id),
      check_in INTEGER,
      check_out INTEGER,
      break_start INTEGER,
      break_end INTEGER,
      lunch_start INTEGER,
      lunch_end INTEGER,
      total_hours REAL DEFAULT 0,
      overtime_hours REAL DEFAULT 0,
      date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at INTEGER DEFAULT (unixepoch())
    );
  `);

  // Insert default company if none exists
  const existingCompany = await db.select().from(companies).limit(1);
  if (existingCompany.length === 0) {
    await db.insert(companies).values({
      name: "JASANA",
      primaryColor: "#0D9488",
    });
  }

  // Insert default schedules if none exist
  const existingSchedules = await db.select().from(schedules).limit(1);
  if (existingSchedules.length === 0) {
    await db.insert(schedules).values([
      {
        name: "Horario Administrativo",
        entryTime: "08:00",
        breakfastStart: "10:00",
        breakfastEnd: "10:30",
        lunchStart: "14:00",
        lunchEnd: "15:00",
        exitTime: "18:00",
        overtimeAllowed: true,
      },
      {
        name: "Horario 1",
        entryTime: "07:00",
        breakfastStart: "09:00",
        breakfastEnd: "09:15",
        lunchStart: "13:00",
        lunchEnd: "14:00",
        exitTime: "16:00",
        overtimeAllowed: false,
      },
      {
        name: "Horario 2",
        entryTime: "09:00",
        breakfastStart: "11:00",
        breakfastEnd: "11:15",
        lunchStart: "15:00",
        lunchEnd: "16:00",
        exitTime: "19:00",
        overtimeAllowed: true,
      },
    ]);
  }
}

export interface IStorage {
  // Company methods
  getCompany(): Promise<Company | undefined>;
  updateCompany(data: Partial<InsertCompany>): Promise<Company>;

  // Schedule methods
  getSchedules(): Promise<Schedule[]>;
  getSchedule(id: number): Promise<Schedule | undefined>;
  createSchedule(data: InsertSchedule): Promise<Schedule>;
  updateSchedule(id: number, data: Partial<InsertSchedule>): Promise<Schedule>;
  deleteSchedule(id: number): Promise<void>;

  // Employee methods
  getEmployees(): Promise<EmployeeWithSchedule[]>;
  getEmployee(id: number): Promise<EmployeeWithSchedule | undefined>;
  getEmployeeByEmployeeId(employeeId: string): Promise<EmployeeWithSchedule | undefined>;
  getEmployeeByBarcode(barcode: string): Promise<EmployeeWithSchedule | undefined>;
  createEmployee(data: InsertEmployee): Promise<Employee>;
  updateEmployee(id: number, data: Partial<InsertEmployee>): Promise<Employee>;
  deleteEmployee(id: number): Promise<void>;

  // Attendance methods
  getAttendances(startDate?: string, endDate?: string, departmentFilter?: string): Promise<AttendanceWithEmployee[]>;
  getEmployeeAttendances(employeeId: number, startDate?: string, endDate?: string): Promise<Attendance[]>;
  getTodayAttendance(employeeId: number): Promise<Attendance | undefined>;
  createAttendance(data: InsertAttendance): Promise<Attendance>;
  updateAttendance(id: number, data: Partial<InsertAttendance>): Promise<Attendance>;
  checkIn(employeeId: number): Promise<Attendance>;
  checkOut(employeeId: number): Promise<Attendance>;
  getAttendanceReport(startDate: string, endDate: string, departmentFilter?: string): Promise<AttendanceReport[]>;
}

export class SqliteStorage implements IStorage {
  constructor() {
    initializeDatabase();
  }

  // Company methods
  async getCompany(): Promise<Company | undefined> {
    const result = await db.select().from(companies).limit(1);
    return result[0];
  }

  async updateCompany(data: Partial<InsertCompany>): Promise<Company> {
    const company = await this.getCompany();
    if (company) {
      await db.update(companies).set(data).where(eq(companies.id, company.id));
      return { ...company, ...data } as Company;
    } else {
      const result = await db.insert(companies).values(data as InsertCompany).returning();
      return result[0];
    }
  }

  // Schedule methods
  async getSchedules(): Promise<Schedule[]> {
    return await db.select().from(schedules).orderBy(schedules.name);
  }

  async getSchedule(id: number): Promise<Schedule | undefined> {
    const result = await db.select().from(schedules).where(eq(schedules.id, id)).limit(1);
    return result[0];
  }

  async createSchedule(data: InsertSchedule): Promise<Schedule> {
    const result = await db.insert(schedules).values(data).returning();
    return result[0];
  }

  async updateSchedule(id: number, data: Partial<InsertSchedule>): Promise<Schedule> {
    await db.update(schedules).set(data).where(eq(schedules.id, id));
    const updated = await this.getSchedule(id);
    if (!updated) throw new Error("Schedule not found");
    return updated;
  }

  async deleteSchedule(id: number): Promise<void> {
    await db.delete(schedules).where(eq(schedules.id, id));
  }

  // Employee methods
  async getEmployees(): Promise<EmployeeWithSchedule[]> {
    const result = await db
      .select()
      .from(employees)
      .leftJoin(schedules, eq(employees.scheduleId, schedules.id))
      .where(eq(employees.isActive, true))
      .orderBy(employees.fullName);

    return result.map((row) => ({
      ...row.employees,
      schedule: row.schedules || undefined,
    }));
  }

  async getEmployee(id: number): Promise<EmployeeWithSchedule | undefined> {
    const result = await db
      .select()
      .from(employees)
      .leftJoin(schedules, eq(employees.scheduleId, schedules.id))
      .where(eq(employees.id, id))
      .limit(1);

    if (result.length === 0) return undefined;

    return {
      ...result[0].employees,
      schedule: result[0].schedules || undefined,
    };
  }

  async getEmployeeByEmployeeId(employeeId: string): Promise<EmployeeWithSchedule | undefined> {
    const result = await db
      .select()
      .from(employees)
      .leftJoin(schedules, eq(employees.scheduleId, schedules.id))
      .where(eq(employees.employeeId, employeeId))
      .limit(1);

    if (result.length === 0) return undefined;

    return {
      ...result[0].employees,
      schedule: result[0].schedules || undefined,
    };
  }

  async getEmployeeByBarcode(barcode: string): Promise<EmployeeWithSchedule | undefined> {
    const result = await db
      .select()
      .from(employees)
      .leftJoin(schedules, eq(employees.scheduleId, schedules.id))
      .where(eq(employees.barcode, barcode))
      .limit(1);

    if (result.length === 0) return undefined;

    return {
      ...result[0].employees,
      schedule: result[0].schedules || undefined,
    };
  }

  async createEmployee(data: InsertEmployee): Promise<Employee> {
    const result = await db.insert(employees).values(data).returning();
    return result[0];
  }

  async updateEmployee(id: number, data: Partial<InsertEmployee>): Promise<Employee> {
    await db.update(employees).set(data).where(eq(employees.id, id));
    const updated = await this.getEmployee(id);
    if (!updated) throw new Error("Employee not found");
    return updated;
  }

  async deleteEmployee(id: number): Promise<void> {
    await db.update(employees).set({ isActive: false }).where(eq(employees.id, id));
  }

  // Attendance methods
  async getAttendances(startDate?: string, endDate?: string, departmentFilter?: string): Promise<AttendanceWithEmployee[]> {
    let query = db
      .select()
      .from(attendances)
      .innerJoin(employees, eq(attendances.employeeId, employees.id))
      .orderBy(desc(attendances.createdAt));

    const conditions = [];
    
    if (startDate) {
      conditions.push(gte(attendances.date, startDate));
    }
    
    if (endDate) {
      conditions.push(lte(attendances.date, endDate));
    }
    
    if (departmentFilter && departmentFilter !== "all") {
      conditions.push(eq(employees.department, departmentFilter));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const result = await query;

    return result.map((row) => ({
      ...row.attendances,
      employee: row.employees,
    }));
  }

  async getEmployeeAttendances(employeeId: number, startDate?: string, endDate?: string): Promise<Attendance[]> {
    let query = db
      .select()
      .from(attendances)
      .where(eq(attendances.employeeId, employeeId))
      .orderBy(desc(attendances.date));

    const conditions = [eq(attendances.employeeId, employeeId)];
    
    if (startDate) {
      conditions.push(gte(attendances.date, startDate));
    }
    
    if (endDate) {
      conditions.push(lte(attendances.date, endDate));
    }

    if (conditions.length > 1) {
      query = query.where(and(...conditions));
    }

    return await query;
  }

  async getTodayAttendance(employeeId: number): Promise<Attendance | undefined> {
    const today = new Date().toISOString().split('T')[0];
    const result = await db
      .select()
      .from(attendances)
      .where(and(eq(attendances.employeeId, employeeId), eq(attendances.date, today)))
      .limit(1);

    return result[0];
  }

  async createAttendance(data: InsertAttendance): Promise<Attendance> {
    const result = await db.insert(attendances).values(data).returning();
    return result[0];
  }

  async updateAttendance(id: number, data: Partial<InsertAttendance>): Promise<Attendance> {
    await db.update(attendances).set(data).where(eq(attendances.id, id));
    const result = await db.select().from(attendances).where(eq(attendances.id, id)).limit(1);
    if (!result[0]) throw new Error("Attendance not found");
    return result[0];
  }

  async checkIn(employeeId: number): Promise<Attendance> {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // Check if there's already an attendance record for today
    let attendance = await this.getTodayAttendance(employeeId);
    
    if (!attendance) {
      // Create new attendance record
      attendance = await this.createAttendance({
        employeeId,
        checkIn: now,
        date: today,
        status: "pending",
      });
    } else {
      // Update existing record
      attendance = await this.updateAttendance(attendance.id, {
        checkIn: now,
      });
    }
    
    return attendance;
  }

  async checkOut(employeeId: number): Promise<Attendance> {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    let attendance = await this.getTodayAttendance(employeeId);
    
    if (!attendance || !attendance.checkIn) {
      throw new Error("No check-in found for today");
    }
    
    // Calculate total hours
    const checkInTime = new Date(attendance.checkIn);
    const totalMilliseconds = now.getTime() - checkInTime.getTime();
    const totalHours = totalMilliseconds / (1000 * 60 * 60);
    
    attendance = await this.updateAttendance(attendance.id, {
      checkOut: now,
      totalHours: Math.round(totalHours * 100) / 100,
      status: "complete",
    });
    
    return attendance;
  }

  async getAttendanceReport(startDate: string, endDate: string, departmentFilter?: string): Promise<AttendanceReport[]> {
    const attendanceData = await this.getAttendances(startDate, endDate, departmentFilter);
    
    const reportMap = new Map<string, AttendanceReport>();
    
    attendanceData.forEach((attendance) => {
      const key = `${attendance.employee.employeeId}-${attendance.date}`;
      
      if (!reportMap.has(key)) {
        reportMap.set(key, {
          employeeId: attendance.employee.employeeId,
          fullName: attendance.employee.fullName,
          department: attendance.employee.department,
          checkIns: [],
          checkOuts: [],
          totalHours: 0,
          overtimeHours: 0,
          date: attendance.date,
        });
      }
      
      const report = reportMap.get(key)!;
      
      if (attendance.checkIn) {
        report.checkIns.push(new Date(attendance.checkIn).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }));
      }
      
      if (attendance.checkOut) {
        report.checkOuts.push(new Date(attendance.checkOut).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }));
      }
      
      report.totalHours += attendance.totalHours || 0;
      report.overtimeHours += attendance.overtimeHours || 0;
    });
    
    return Array.from(reportMap.values());
  }
}

export const storage = new SqliteStorage();
