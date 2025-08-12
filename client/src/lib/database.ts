import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface AttendanceDB extends DBSchema {
  employees: {
    key: number;
    value: {
      id: number;
      employeeId: string;
      fullName: string;
      email?: string;
      phone?: string;
      department: string;
      scheduleId?: number;
      photo?: ArrayBuffer;
      barcode: string;
      isActive: boolean;
      createdAt: Date;
    };
    indexes: { 'by-employeeId': string; 'by-barcode': string };
  };
  schedules: {
    key: number;
    value: {
      id: number;
      name: string;
      entryTime: string;
      breakfastStart?: string;
      breakfastEnd?: string;
      lunchStart?: string;
      lunchEnd?: string;
      exitTime: string;
      overtimeAllowed: boolean;
      createdAt: Date;
    };
  };
  attendances: {
    key: number;
    value: {
      id: number;
      employeeId: number;
      checkIn?: Date;
      checkOut?: Date;
      breakStart?: Date;
      breakEnd?: Date;
      lunchStart?: Date;
      lunchEnd?: Date;
      totalHours: number;
      overtimeHours: number;
      date: string;
      status: string;
      createdAt: Date;
    };
    indexes: { 'by-employee': number; 'by-date': string };
  };
  companies: {
    key: number;
    value: {
      id: number;
      name: string;
      logo?: ArrayBuffer;
      primaryColor: string;
      createdAt: Date;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<AttendanceDB>> | null = null;

export const initDB = async (): Promise<IDBPDatabase<AttendanceDB>> => {
  if (!dbPromise) {
    dbPromise = openDB<AttendanceDB>('attendance-system', 1, {
      upgrade(db) {
        // Companies store
        if (!db.objectStoreNames.contains('companies')) {
          db.createObjectStore('companies', {
            keyPath: 'id',
            autoIncrement: true,
          });
        }

        // Schedules store
        if (!db.objectStoreNames.contains('schedules')) {
          db.createObjectStore('schedules', {
            keyPath: 'id',
            autoIncrement: true,
          });
        }

        // Employees store
        if (!db.objectStoreNames.contains('employees')) {
          const employeeStore = db.createObjectStore('employees', {
            keyPath: 'id',
            autoIncrement: true,
          });
          employeeStore.createIndex('by-employeeId', 'employeeId', { unique: true });
          employeeStore.createIndex('by-barcode', 'barcode', { unique: true });
        }

        // Attendances store
        if (!db.objectStoreNames.contains('attendances')) {
          const attendanceStore = db.createObjectStore('attendances', {
            keyPath: 'id',
            autoIncrement: true,
          });
          attendanceStore.createIndex('by-employee', 'employeeId');
          attendanceStore.createIndex('by-date', 'date');
        }
      },
    });

    // Initialize with default data
    const db = await dbPromise;
    await initializeDefaultData(db);
  }

  return dbPromise;
};

const initializeDefaultData = async (db: IDBPDatabase<AttendanceDB>) => {
  // Check if company exists
  const companies = await db.getAll('companies');
  if (companies.length === 0) {
    await db.add('companies', {
      id: 1,
      name: 'JASANA',
      primaryColor: '#0D9488',
      createdAt: new Date(),
    });
  }

  // Check if schedules exist
  const schedules = await db.getAll('schedules');
  if (schedules.length === 0) {
    const defaultSchedules = [
      {
        id: 1,
        name: 'Horario Administrativo',
        entryTime: '08:00',
        breakfastStart: '10:00',
        breakfastEnd: '10:30',
        lunchStart: '14:00',
        lunchEnd: '15:00',
        exitTime: '18:00',
        overtimeAllowed: true,
        createdAt: new Date(),
      },
      {
        id: 2,
        name: 'Horario 1',
        entryTime: '07:00',
        breakfastStart: '09:00',
        breakfastEnd: '09:15',
        lunchStart: '13:00',
        lunchEnd: '14:00',
        exitTime: '16:00',
        overtimeAllowed: false,
        createdAt: new Date(),
      },
      {
        id: 3,
        name: 'Horario 2',
        entryTime: '09:00',
        breakfastStart: '11:00',
        breakfastEnd: '11:15',
        lunchStart: '15:00',
        lunchEnd: '16:00',
        exitTime: '19:00',
        overtimeAllowed: true,
        createdAt: new Date(),
      },
    ];

    for (const schedule of defaultSchedules) {
      await db.add('schedules', schedule);
    }
  }
};

export class IndexedDBStorage {
  private db: Promise<IDBPDatabase<AttendanceDB>>;

  constructor() {
    this.db = initDB();
  }

  // Company methods
  async getCompany() {
    const db = await this.db;
    const companies = await db.getAll('companies');
    return companies[0];
  }

  async updateCompany(data: Partial<AttendanceDB['companies']['value']>) {
    const db = await this.db;
    const company = await this.getCompany();
    
    if (company) {
      await db.put('companies', { ...company, ...data });
      return { ...company, ...data };
    } else {
      const newCompany = {
        id: 1,
        name: 'JASANA',
        primaryColor: '#0D9488',
        createdAt: new Date(),
        ...data,
      };
      await db.add('companies', newCompany);
      return newCompany;
    }
  }

  // Schedule methods
  async getSchedules() {
    const db = await this.db;
    return await db.getAll('schedules');
  }

  async getSchedule(id: number) {
    const db = await this.db;
    return await db.get('schedules', id);
  }

  async createSchedule(data: Omit<AttendanceDB['schedules']['value'], 'id' | 'createdAt'>) {
    const db = await this.db;
    const schedule = {
      ...data,
      createdAt: new Date(),
    };
    const id = await db.add('schedules', schedule as any);
    return { ...schedule, id };
  }

  async updateSchedule(id: number, data: Partial<AttendanceDB['schedules']['value']>) {
    const db = await this.db;
    const schedule = await this.getSchedule(id);
    if (!schedule) throw new Error('Schedule not found');
    
    const updated = { ...schedule, ...data };
    await db.put('schedules', updated);
    return updated;
  }

  async deleteSchedule(id: number) {
    const db = await this.db;
    await db.delete('schedules', id);
  }

  // Employee methods
  async getEmployees() {
    const db = await this.db;
    const employees = await db.getAll('employees');
    const schedules = await this.getSchedules();
    
    return employees
      .filter(emp => emp.isActive)
      .map(employee => ({
        ...employee,
        schedule: schedules.find(s => s.id === employee.scheduleId),
      }));
  }

  async getEmployee(id: number) {
    const db = await this.db;
    const employee = await db.get('employees', id);
    if (!employee) return undefined;
    
    const schedule = employee.scheduleId ? await this.getSchedule(employee.scheduleId) : undefined;
    return { ...employee, schedule };
  }

  async getEmployeeByEmployeeId(employeeId: string) {
    const db = await this.db;
    const employee = await db.getFromIndex('employees', 'by-employeeId', employeeId);
    if (!employee) return undefined;
    
    const schedule = employee.scheduleId ? await this.getSchedule(employee.scheduleId) : undefined;
    return { ...employee, schedule };
  }

  async getEmployeeByBarcode(barcode: string) {
    const db = await this.db;
    const employee = await db.getFromIndex('employees', 'by-barcode', barcode);
    if (!employee) return undefined;
    
    const schedule = employee.scheduleId ? await this.getSchedule(employee.scheduleId) : undefined;
    return { ...employee, schedule };
  }

  async createEmployee(data: Omit<AttendanceDB['employees']['value'], 'id' | 'createdAt'>) {
    const db = await this.db;
    const employee = {
      ...data,
      isActive: true,
      createdAt: new Date(),
    };
    const id = await db.add('employees', employee as any);
    return { ...employee, id };
  }

  async updateEmployee(id: number, data: Partial<AttendanceDB['employees']['value']>) {
    const db = await this.db;
    const employee = await this.getEmployee(id);
    if (!employee) throw new Error('Employee not found');
    
    const updated = { ...employee, ...data };
    await db.put('employees', updated);
    return updated;
  }

  async deleteEmployee(id: number) {
    const db = await this.db;
    const employee = await this.getEmployee(id);
    if (!employee) throw new Error('Employee not found');
    
    await db.put('employees', { ...employee, isActive: false });
  }

  // Attendance methods
  async getAttendances(startDate?: string, endDate?: string, departmentFilter?: string) {
    const db = await this.db;
    let attendances = await db.getAll('attendances');
    
    if (startDate) {
      attendances = attendances.filter(att => att.date >= startDate);
    }
    
    if (endDate) {
      attendances = attendances.filter(att => att.date <= endDate);
    }
    
    const employees = await db.getAll('employees');
    
    const result = await Promise.all(
      attendances.map(async (attendance) => {
        const employee = employees.find(emp => emp.id === attendance.employeeId);
        if (!employee) return null;
        
        if (departmentFilter && departmentFilter !== 'all' && employee.department !== departmentFilter) {
          return null;
        }
        
        return { ...attendance, employee };
      })
    );
    
    return result.filter(Boolean);
  }

  async getTodayAttendance(employeeId: number) {
    const db = await this.db;
    const today = new Date().toISOString().split('T')[0];
    const attendances = await db.getAllFromIndex('attendances', 'by-employee', employeeId);
    return attendances.find(att => att.date === today);
  }

  async createAttendance(data: Omit<AttendanceDB['attendances']['value'], 'id' | 'createdAt'>) {
    const db = await this.db;
    const attendance = {
      ...data,
      totalHours: 0,
      overtimeHours: 0,
      status: 'pending',
      createdAt: new Date(),
    };
    const id = await db.add('attendances', attendance as any);
    return { ...attendance, id };
  }

  async updateAttendance(id: number, data: Partial<AttendanceDB['attendances']['value']>) {
    const db = await this.db;
    const attendance = await db.get('attendances', id);
    if (!attendance) throw new Error('Attendance not found');
    
    const updated = { ...attendance, ...data };
    await db.put('attendances', updated);
    return updated;
  }

  async checkIn(employeeId: number) {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    let attendance = await this.getTodayAttendance(employeeId);
    
    if (!attendance) {
      attendance = await this.createAttendance({
        employeeId,
        checkIn: now,
        date: today,
      } as any);
    } else {
      attendance = await this.updateAttendance(attendance.id, {
        checkIn: now,
      });
    }
    
    return attendance;
  }

  async checkOut(employeeId: number) {
    const now = new Date();
    
    const attendance = await this.getTodayAttendance(employeeId);
    if (!attendance || !attendance.checkIn) {
      throw new Error('No check-in found for today');
    }
    
    const checkInTime = new Date(attendance.checkIn);
    const totalMilliseconds = now.getTime() - checkInTime.getTime();
    const totalHours = totalMilliseconds / (1000 * 60 * 60);
    
    return await this.updateAttendance(attendance.id, {
      checkOut: now,
      totalHours: Math.round(totalHours * 100) / 100,
      status: 'complete',
    });
  }

  // Utility methods
  async clearAllData() {
    const db = await this.db;
    const tx = db.transaction(['employees', 'schedules', 'attendances', 'companies'], 'readwrite');
    
    await tx.objectStore('employees').clear();
    await tx.objectStore('schedules').clear();
    await tx.objectStore('attendances').clear();
    await tx.objectStore('companies').clear();
    
    await tx.done;
    
    // Reinitialize default data
    await initializeDefaultData(db);
  }

  async exportData() {
    const db = await this.db;
    
    const data = {
      companies: await db.getAll('companies'),
      schedules: await db.getAll('schedules'),
      employees: await db.getAll('employees'),
      attendances: await db.getAll('attendances'),
      exportDate: new Date().toISOString(),
    };
    
    return JSON.stringify(data, null, 2);
  }

  async importData(jsonData: string) {
    const data = JSON.parse(jsonData);
    const db = await this.db;
    
    // Clear existing data
    await this.clearAllData();
    
    // Import new data
    const tx = db.transaction(['companies', 'schedules', 'employees', 'attendances'], 'readwrite');
    
    if (data.companies) {
      for (const company of data.companies) {
        await tx.objectStore('companies').add(company);
      }
    }
    
    if (data.schedules) {
      for (const schedule of data.schedules) {
        await tx.objectStore('schedules').add(schedule);
      }
    }
    
    if (data.employees) {
      for (const employee of data.employees) {
        await tx.objectStore('employees').add(employee);
      }
    }
    
    if (data.attendances) {
      for (const attendance of data.attendances) {
        await tx.objectStore('attendances').add(attendance);
      }
    }
    
    await tx.done;
  }
}

// Create a singleton instance
export const indexedDBStorage = new IndexedDBStorage();

// Export utility functions
export const exportAttendanceData = async () => {
  const data = await indexedDBStorage.exportData();
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `attendance-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

export const importAttendanceData = async (file: File) => {
  const text = await file.text();
  await indexedDBStorage.importData(text);
};
