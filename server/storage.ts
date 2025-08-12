import { 
  type Employee, 
  type InsertEmployee,
  type WorkSchedule,
  type InsertWorkSchedule,
  type AttendanceRecord,
  type InsertAttendanceRecord,
  type CredentialSettings,
  type InsertCredentialSettings,
  type SystemSettings,
  type InsertSystemSettings,
  type Department,
  type InsertDepartment
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Employees
  getEmployees(): Promise<Employee[]>;
  getEmployee(id: string): Promise<Employee | undefined>;
  getEmployeeByBarcodeData(barcodeData: string): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: string, employee: Partial<InsertEmployee>): Promise<Employee | undefined>;
  deleteEmployee(id: string): Promise<boolean>;

  // Work Schedules
  getWorkSchedules(): Promise<WorkSchedule[]>;
  getWorkSchedule(id: string): Promise<WorkSchedule | undefined>;
  createWorkSchedule(schedule: InsertWorkSchedule): Promise<WorkSchedule>;
  updateWorkSchedule(id: string, schedule: Partial<InsertWorkSchedule>): Promise<WorkSchedule | undefined>;
  deleteWorkSchedule(id: string): Promise<boolean>;

  // Attendance Records
  getAttendanceRecords(filters?: { 
    employeeId?: string; 
    startDate?: string; 
    endDate?: string; 
    department?: string;
  }): Promise<AttendanceRecord[]>;
  getAttendanceRecord(id: string): Promise<AttendanceRecord | undefined>;
  getTodayAttendanceRecord(employeeId: string): Promise<AttendanceRecord | undefined>;
  createAttendanceRecord(record: InsertAttendanceRecord): Promise<AttendanceRecord>;
  updateAttendanceRecord(id: string, record: Partial<InsertAttendanceRecord>): Promise<AttendanceRecord | undefined>;

  // Departments
  getDepartments(): Promise<Department[]>;
  getDepartment(id: string): Promise<Department | undefined>;
  createDepartment(department: InsertDepartment): Promise<Department>;
  updateDepartment(id: string, department: Partial<InsertDepartment>): Promise<Department | undefined>;
  deleteDepartment(id: string): Promise<boolean>;

  // Credential Settings
  getCredentialSettings(): Promise<CredentialSettings | undefined>;
  updateCredentialSettings(settings: InsertCredentialSettings): Promise<CredentialSettings>;

  // System Settings
  getSystemSettings(): Promise<SystemSettings | undefined>;
  updateSystemSettings(settings: InsertSystemSettings): Promise<SystemSettings>;
}

export class MemStorage implements IStorage {
  private employees: Map<string, Employee>;
  private workSchedules: Map<string, WorkSchedule>;
  private attendanceRecords: Map<string, AttendanceRecord>;
  private departments: Map<string, Department>;
  private credentialSettings: CredentialSettings | undefined;
  private systemSettings: SystemSettings | undefined;

  constructor() {
    this.employees = new Map();
    this.workSchedules = new Map();
    this.attendanceRecords = new Map();
    this.departments = new Map();
    
    // Initialize with default data
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    const adminSchedule: WorkSchedule = {
      id: randomUUID(),
      name: "Horario Administrativo",
      entryTime: "08:00",
      breakfastOutTime: "10:00",
      breakfastInTime: "10:30",
      lunchOutTime: "14:00",
      lunchInTime: "15:00",
      exitTime: "18:00",
      overtimeEnabled: true,
      createdAt: new Date(),
    };

    const schedule1: WorkSchedule = {
      id: randomUUID(),
      name: "Horario 1",
      entryTime: "07:00",
      breakfastOutTime: "09:30",
      breakfastInTime: "10:00",
      lunchOutTime: "13:00",
      lunchInTime: "14:00",
      exitTime: "17:00",
      overtimeEnabled: true,
      createdAt: new Date(),
    };

    const schedule2: WorkSchedule = {
      id: randomUUID(),
      name: "Horario 2",
      entryTime: "09:00",
      breakfastOutTime: "11:00",
      breakfastInTime: "11:30",
      lunchOutTime: "15:00",
      lunchInTime: "16:00",
      exitTime: "19:00",
      overtimeEnabled: false,
      createdAt: new Date(),
    };

    this.workSchedules.set(adminSchedule.id, adminSchedule);
    this.workSchedules.set(schedule1.id, schedule1);
    this.workSchedules.set(schedule2.id, schedule2);

    // Default departments
    const defaultDepartments = [
      { name: "Administración", description: "Área administrativa general" },
      { name: "Ventas", description: "Departamento de ventas" },
      { name: "Recursos Humanos", description: "Gestión de personal" },
      { name: "Tecnología", description: "Departamento de IT" },
      { name: "Operaciones", description: "Operaciones y logística" },
      { name: "Marketing", description: "Marketing y publicidad" },
      { name: "Finanzas", description: "Departamento financiero" },
    ];

    defaultDepartments.forEach(dept => {
      const department: Department = {
        id: randomUUID(),
        name: dept.name,
        description: dept.description,
        isActive: true,
        createdAt: new Date(),
      };
      this.departments.set(department.id, department);
    });

    // Default system settings
    this.systemSettings = {
      id: randomUUID(),
      companyName: "TimeCheck Pro",
      timezone: "America/Mexico_City",
      emailNotifications: true,
      darkMode: false,
      updatedAt: new Date(),
    };

    // Default credential settings
    this.credentialSettings = {
      id: randomUUID(),
      companyName: "TimeCheck Pro",
      logoUrl: null,
      primaryColor: "#2563EB",
      fontFamily: "Inter",
      template: {
        width: 85,
        height: 54,
        elements: [
          {
            type: "employeeId",
            position: { x: 3, y: 3 },
            size: { width: 20, height: 4 },
            style: { fontSize: "10px", fontWeight: "bold" }
          },
          {
            type: "employeeName",
            position: { x: 3, y: 8 },
            size: { width: 40, height: 6 },
            style: { fontSize: "12px", fontWeight: "600" }
          },
          {
            type: "department",
            position: { x: 3, y: 14 },
            size: { width: 40, height: 4 },
            style: { fontSize: "8px" }
          },
          {
            type: "photo",
            position: { x: 67, y: 3 },
            size: { width: 12, height: 12 },
            style: {}
          },
          {
            type: "logo",
            position: { x: 75, y: 3 },
            size: { width: 8, height: 8 },
            style: {}
          },
          {
            type: "barcode",
            position: { x: 3, y: 45 },
            size: { width: 79, height: 8 },
            style: {}
          }
        ]
      },
      updatedAt: new Date(),
    };
  }

  // Employee methods
  async getEmployees(): Promise<Employee[]> {
    return Array.from(this.employees.values());
  }

  async getEmployee(id: string): Promise<Employee | undefined> {
    return this.employees.get(id);
  }

  async getEmployeeByBarcodeData(barcodeData: string): Promise<Employee | undefined> {
    return Array.from(this.employees.values()).find(
      employee => employee.barcodeData === barcodeData
    );
  }

  async createEmployee(insertEmployee: InsertEmployee): Promise<Employee> {
    const id = randomUUID();
    const employee: Employee = {
      ...insertEmployee,
      id,
      createdAt: new Date(),
    };
    this.employees.set(id, employee);
    return employee;
  }

  async updateEmployee(id: string, updates: Partial<InsertEmployee>): Promise<Employee | undefined> {
    const employee = this.employees.get(id);
    if (!employee) return undefined;

    const updatedEmployee = { ...employee, ...updates };
    this.employees.set(id, updatedEmployee);
    return updatedEmployee;
  }

  async deleteEmployee(id: string): Promise<boolean> {
    return this.employees.delete(id);
  }

  // Work Schedule methods
  async getWorkSchedules(): Promise<WorkSchedule[]> {
    return Array.from(this.workSchedules.values());
  }

  async getWorkSchedule(id: string): Promise<WorkSchedule | undefined> {
    return this.workSchedules.get(id);
  }

  async createWorkSchedule(insertSchedule: InsertWorkSchedule): Promise<WorkSchedule> {
    const id = randomUUID();
    const schedule: WorkSchedule = {
      ...insertSchedule,
      id,
      createdAt: new Date(),
    };
    this.workSchedules.set(id, schedule);
    return schedule;
  }

  async updateWorkSchedule(id: string, updates: Partial<InsertWorkSchedule>): Promise<WorkSchedule | undefined> {
    const schedule = this.workSchedules.get(id);
    if (!schedule) return undefined;

    const updatedSchedule = { ...schedule, ...updates };
    this.workSchedules.set(id, updatedSchedule);
    return updatedSchedule;
  }

  async deleteWorkSchedule(id: string): Promise<boolean> {
    return this.workSchedules.delete(id);
  }

  // Attendance Record methods
  async getAttendanceRecords(filters?: { 
    employeeId?: string; 
    startDate?: string; 
    endDate?: string; 
    department?: string;
  }): Promise<AttendanceRecord[]> {
    let records = Array.from(this.attendanceRecords.values());

    if (filters) {
      if (filters.employeeId) {
        records = records.filter(record => record.employeeId === filters.employeeId);
      }
      if (filters.startDate) {
        records = records.filter(record => record.date >= filters.startDate!);
      }
      if (filters.endDate) {
        records = records.filter(record => record.date <= filters.endDate!);
      }
    }

    return records;
  }

  async getAttendanceRecord(id: string): Promise<AttendanceRecord | undefined> {
    return this.attendanceRecords.get(id);
  }

  async getTodayAttendanceRecord(employeeId: string): Promise<AttendanceRecord | undefined> {
    const today = new Date().toISOString().split('T')[0];
    return Array.from(this.attendanceRecords.values()).find(
      record => record.employeeId === employeeId && record.date === today
    );
  }

  async createAttendanceRecord(insertRecord: InsertAttendanceRecord): Promise<AttendanceRecord> {
    const id = randomUUID();
    const record: AttendanceRecord = {
      ...insertRecord,
      id,
      createdAt: new Date(),
    };
    this.attendanceRecords.set(id, record);
    return record;
  }

  async updateAttendanceRecord(id: string, updates: Partial<InsertAttendanceRecord>): Promise<AttendanceRecord | undefined> {
    const record = this.attendanceRecords.get(id);
    if (!record) return undefined;

    const updatedRecord = { ...record, ...updates };
    this.attendanceRecords.set(id, updatedRecord);
    return updatedRecord;
  }

  // Credential Settings methods
  async getCredentialSettings(): Promise<CredentialSettings | undefined> {
    return this.credentialSettings;
  }

  async updateCredentialSettings(settings: InsertCredentialSettings): Promise<CredentialSettings> {
    const updated: CredentialSettings = {
      ...settings,
      id: this.credentialSettings?.id || randomUUID(),
      updatedAt: new Date(),
    };
    this.credentialSettings = updated;
    return updated;
  }

  // Department methods
  async getDepartments(): Promise<Department[]> {
    return Array.from(this.departments.values());
  }

  async getDepartment(id: string): Promise<Department | undefined> {
    return this.departments.get(id);
  }

  async createDepartment(insertDepartment: InsertDepartment): Promise<Department> {
    const id = randomUUID();
    const department: Department = {
      ...insertDepartment,
      id,
      createdAt: new Date(),
    };
    this.departments.set(id, department);
    return department;
  }

  async updateDepartment(id: string, updates: Partial<InsertDepartment>): Promise<Department | undefined> {
    const department = this.departments.get(id);
    if (!department) return undefined;

    const updatedDepartment = { ...department, ...updates };
    this.departments.set(id, updatedDepartment);
    return updatedDepartment;
  }

  async deleteDepartment(id: string): Promise<boolean> {
    return this.departments.delete(id);
  }

  // System Settings methods
  async getSystemSettings(): Promise<SystemSettings | undefined> {
    return this.systemSettings;
  }

  async updateSystemSettings(settings: InsertSystemSettings): Promise<SystemSettings> {
    const updated: SystemSettings = {
      ...settings,
      id: this.systemSettings?.id || randomUUID(),
      updatedAt: new Date(),
    };
    this.systemSettings = updated;
    return updated;
  }
}

export const storage = new MemStorage();
