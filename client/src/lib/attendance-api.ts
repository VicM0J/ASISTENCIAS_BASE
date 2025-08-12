import { apiRequest } from "./queryClient";

export interface CheckInResponse {
  message: string;
  record: {
    id: string;
    employeeId: string;
    checkInTime?: string;
    checkOutTime?: string;
    date: string;
    totalHours?: string;
    overtimeHours?: string;
  };
  employee: {
    id: string;
    fullName: string;
    department: string;
    photo?: string;
  };
  action: "check-in" | "check-out";
  hoursWorked?: string;
}

export interface AttendanceStats {
  todayCheckIns: number;
  todayCheckOuts: number;
  activeEmployees: number;
  averageTime: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  checkInTime?: string;
  checkOutTime?: string;
  date: string;
  totalHours?: string;
  overtimeHours?: string;
  createdAt: string;
}

export const attendanceApi = {
  async checkIn(employeeId: string): Promise<CheckInResponse> {
    const response = await apiRequest("POST", "/api/attendance/check-in", { employeeId });
    return response.json();
  },

  async getStats(): Promise<AttendanceStats> {
    const response = await apiRequest("GET", "/api/attendance/stats");
    return response.json();
  },

  async getRecords(params?: {
    employeeId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<AttendanceRecord[]> {
    const searchParams = new URLSearchParams();
    
    if (params?.employeeId) {
      searchParams.append("employeeId", params.employeeId);
    }
    if (params?.startDate) {
      searchParams.append("startDate", params.startDate);
    }
    if (params?.endDate) {
      searchParams.append("endDate", params.endDate);
    }

    const url = `/api/attendance/records${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
    const response = await apiRequest("GET", url);
    return response.json();
  },

  async getTodayAttendance(employeeId: string): Promise<AttendanceRecord | null> {
    const today = new Date().toISOString().split('T')[0];
    const records = await this.getRecords({ 
      employeeId, 
      startDate: today, 
      endDate: today 
    });
    return records.length > 0 ? records[0] : null;
  },

  async getWeeklyAttendance(employeeId: string): Promise<AttendanceRecord[]> {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);

    return this.getRecords({
      employeeId,
      startDate: weekAgo.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0],
    });
  },

  async getMonthlyAttendance(employeeId: string, year?: number, month?: number): Promise<AttendanceRecord[]> {
    const targetDate = new Date(year || new Date().getFullYear(), month || new Date().getMonth(), 1);
    const startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
    const endDate = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);

    return this.getRecords({
      employeeId,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    });
  },

  calculateWorkingHours(checkInTime: string, checkOutTime: string): number {
    const checkIn = new Date(checkInTime);
    const checkOut = new Date(checkOutTime);
    return (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60); // Convert to hours
  },

  calculateOvertimeHours(totalHours: number, standardHours = 8): number {
    return Math.max(0, totalHours - standardHours);
  },

  formatHours(hours: number): string {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    return minutes > 0 ? `${wholeHours}.${minutes}h` : `${wholeHours}h`;
  },

  isLateEntry(checkInTime: string, expectedTime: string, toleranceMinutes = 15): boolean {
    const checkIn = new Date(checkInTime);
    const expected = new Date(`${checkIn.toDateString()} ${expectedTime}`);
    const toleranceMs = toleranceMinutes * 60 * 1000;
    
    return checkIn.getTime() > (expected.getTime() + toleranceMs);
  },

  isEarlyExit(checkOutTime: string, expectedTime: string): boolean {
    const checkOut = new Date(checkOutTime);
    const expected = new Date(`${checkOut.toDateString()} ${expectedTime}`);
    
    return checkOut.getTime() < expected.getTime();
  },
};
