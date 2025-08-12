import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertEmployeeSchema, 
  insertWorkScheduleSchema, 
  insertAttendanceRecordSchema,
  insertCredentialSettingsSchema,
  insertSystemSettingsSchema,
  insertDepartmentSchema
} from "@shared/schema";
import multer from "multer";
import path from "path";
import { promises as fs } from "fs";

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Employee routes
  app.get("/api/employees", async (req, res) => {
    try {
      const employees = await storage.getEmployees();
      res.json(employees);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  app.get("/api/employees/:id", async (req, res) => {
    try {
      const employee = await storage.getEmployee(req.params.id);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      res.json(employee);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch employee" });
    }
  });

  app.post("/api/employees", upload.single('photo'), async (req, res) => {
    try {
      // Parse and clean form data
      const formData = { ...req.body };
      
      // Handle boolean conversion for FormData strings
      if (formData.isActive === "true") formData.isActive = true;
      if (formData.isActive === "false") formData.isActive = false;
      
      // Remove empty strings and undefined values
      Object.keys(formData).forEach(key => {
        if (formData[key] === "" || formData[key] === "undefined") {
          delete formData[key];
        }
      });
      
      // Validate with schema
      const data = insertEmployeeSchema.parse(formData);
      
      // Handle photo upload
      if (req.file) {
        const photoUrl = `/uploads/${req.file.filename}`;
        data.photoUrl = photoUrl;
      }

      // Generate barcode data if not provided
      if (!data.barcodeData) {
        data.barcodeData = data.employeeId;
      }

      const employee = await storage.createEmployee(data);
      res.status(201).json(employee);
    } catch (error) {
      res.status(400).json({ message: "Invalid employee data", error: error.message });
    }
  });

  app.put("/api/employees/:id", upload.single('photo'), async (req, res) => {
    try {
      const data = req.body;
      
      // Handle photo upload
      if (req.file) {
        const photoUrl = `/uploads/${req.file.filename}`;
        data.photoUrl = photoUrl;
      }

      const employee = await storage.updateEmployee(req.params.id, data);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      res.json(employee);
    } catch (error) {
      res.status(400).json({ message: "Failed to update employee" });
    }
  });

  app.delete("/api/employees/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteEmployee(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Employee not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete employee" });
    }
  });

  // Work Schedule routes
  app.get("/api/work-schedules", async (req, res) => {
    try {
      const schedules = await storage.getWorkSchedules();
      res.json(schedules);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch work schedules" });
    }
  });

  app.post("/api/work-schedules", async (req, res) => {
    try {
      const data = insertWorkScheduleSchema.parse(req.body);
      const schedule = await storage.createWorkSchedule(data);
      res.status(201).json(schedule);
    } catch (error) {
      res.status(400).json({ message: "Invalid work schedule data" });
    }
  });

  app.put("/api/work-schedules/:id", async (req, res) => {
    try {
      const schedule = await storage.updateWorkSchedule(req.params.id, req.body);
      if (!schedule) {
        return res.status(404).json({ message: "Work schedule not found" });
      }
      res.json(schedule);
    } catch (error) {
      res.status(400).json({ message: "Failed to update work schedule" });
    }
  });

  app.delete("/api/work-schedules/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteWorkSchedule(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Work schedule not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete work schedule" });
    }
  });

  // Attendance routes
  app.get("/api/attendance", async (req, res) => {
    try {
      const { employeeId, startDate, endDate, department } = req.query;
      const records = await storage.getAttendanceRecords({
        employeeId: employeeId as string,
        startDate: startDate as string,
        endDate: endDate as string,
        department: department as string,
      });
      res.json(records);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch attendance records" });
    }
  });

  app.post("/api/attendance/check-in", async (req, res) => {
    try {
      const { barcodeData } = req.body;
      
      if (!barcodeData) {
        return res.status(400).json({ message: "Barcode data is required" });
      }

      // Find employee by barcode
      const employee = await storage.getEmployeeByBarcodeData(barcodeData);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      const today = new Date().toISOString().split('T')[0];
      
      // Check if there's already a record for today
      let attendanceRecord = await storage.getTodayAttendanceRecord(employee.id);
      
      if (!attendanceRecord) {
        // Create new attendance record
        attendanceRecord = await storage.createAttendanceRecord({
          employeeId: employee.id,
          checkInTime: new Date(),
          checkOutTime: null,
          breakfastOutTime: null,
          breakfastInTime: null,
          lunchOutTime: null,
          lunchInTime: null,
          totalHours: null,
          overtimeHours: null,
          date: today,
        });
        res.json({ type: "check-in", record: attendanceRecord, employee });
      } else if (!attendanceRecord.checkOutTime) {
        // Update with check-out time
        const checkOutTime = new Date();
        const totalMinutes = Math.floor((checkOutTime.getTime() - attendanceRecord.checkInTime!.getTime()) / (1000 * 60));
        
        attendanceRecord = await storage.updateAttendanceRecord(attendanceRecord.id, {
          checkOutTime,
          totalHours: totalMinutes,
        });
        
        res.json({ type: "check-out", record: attendanceRecord, employee });
      } else {
        res.status(400).json({ message: "Employee has already checked out today" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to process check-in/out" });
    }
  });

  app.get("/api/attendance/recent", async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const records = await storage.getAttendanceRecords({
        startDate: today,
        endDate: today,
      });
      
      // Get employee details for each record
      const recentActivity = await Promise.all(
        records.slice(-10).map(async (record) => {
          const employee = await storage.getEmployee(record.employeeId);
          return { record, employee };
        })
      );
      
      res.json(recentActivity.reverse());
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recent activity" });
    }
  });

  // Credential settings routes
  app.get("/api/credential-settings", async (req, res) => {
    try {
      const settings = await storage.getCredentialSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch credential settings" });
    }
  });

  app.put("/api/credential-settings", upload.single('logo'), async (req, res) => {
    try {
      const data = req.body;
      
      // Handle logo upload
      if (req.file) {
        const logoUrl = `/uploads/${req.file.filename}`;
        data.logoUrl = logoUrl;
      }

      const settings = await storage.updateCredentialSettings(data);
      res.json(settings);
    } catch (error) {
      res.status(400).json({ message: "Failed to update credential settings" });
    }
  });

  // Department routes
  app.get("/api/departments", async (req, res) => {
    try {
      const departments = await storage.getDepartments();
      res.json(departments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch departments" });
    }
  });

  app.post("/api/departments", async (req, res) => {
    try {
      const data = insertDepartmentSchema.parse(req.body);
      const department = await storage.createDepartment(data);
      res.status(201).json(department);
    } catch (error) {
      res.status(400).json({ message: "Invalid department data" });
    }
  });

  app.put("/api/departments/:id", async (req, res) => {
    try {
      const department = await storage.updateDepartment(req.params.id, req.body);
      if (!department) {
        return res.status(404).json({ message: "Department not found" });
      }
      res.json(department);
    } catch (error) {
      res.status(400).json({ message: "Failed to update department" });
    }
  });

  app.delete("/api/departments/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteDepartment(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Department not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete department" });
    }
  });

  // System settings routes
  app.get("/api/system-settings", async (req, res) => {
    try {
      const settings = await storage.getSystemSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch system settings" });
    }
  });

  app.put("/api/system-settings", async (req, res) => {
    try {
      const settings = await storage.updateSystemSettings(req.body);
      res.json(settings);
    } catch (error) {
      res.status(400).json({ message: "Failed to update system settings" });
    }
  });

  // Reports routes
  app.post("/api/reports/export", async (req, res) => {
    try {
      const { format, period, department, startDate, endDate } = req.body;
      
      // Get attendance records based on filters
      const records = await storage.getAttendanceRecords({
        startDate,
        endDate,
        department,
      });

      // Get employee details for each record
      const reportData = await Promise.all(
        records.map(async (record) => {
          const employee = await storage.getEmployee(record.employeeId);
          return {
            employeeId: employee?.employeeId,
            fullName: employee?.fullName,
            department: employee?.department,
            date: record.date,
            checkIn: record.checkInTime?.toISOString(),
            checkOut: record.checkOutTime?.toISOString(),
            totalHours: record.totalHours ? Math.floor(record.totalHours / 60) + ':' + (record.totalHours % 60).toString().padStart(2, '0') : '',
            overtimeHours: record.overtimeHours ? Math.floor(record.overtimeHours / 60) + ':' + (record.overtimeHours % 60).toString().padStart(2, '0') : '',
          };
        })
      );

      if (format === 'xlsx') {
        // For Excel export, we'll return the data and let the frontend handle the file generation
        res.json({ data: reportData, filename: `attendance_report_${Date.now()}.xlsx` });
      } else {
        res.status(400).json({ message: "Unsupported format" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to generate report" });
    }
  });

  // Serve uploaded files
  app.use('/uploads', async (req, res) => {
    try {
      const filePath = path.join(process.cwd(), 'uploads', req.path);
      await fs.access(filePath);
      res.sendFile(filePath);
    } catch (error) {
      res.status(404).json({ message: "File not found" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
