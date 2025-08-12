import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertEmployeeSchema, insertAttendanceRecordSchema, insertScheduleSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import { promises as fs } from "fs";

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: async (req, file, cb) => {
      const dir = path.join(process.cwd(), "uploads", "photos");
      await fs.mkdir(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Employee routes
  app.get("/api/employees", async (req, res) => {
    try {
      const employees = await storage.getAllEmployees();
      res.json(employees);
    } catch (error) {
      res.status(500).json({ message: "Error fetching employees" });
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
      res.status(500).json({ message: "Error fetching employee" });
    }
  });

  app.post("/api/employees", upload.single('photo'), async (req, res) => {
    try {
      const employeeData = insertEmployeeSchema.parse(req.body);
      
      // Check if employee ID already exists
      const existingEmployee = await storage.getEmployee(employeeData.id);
      if (existingEmployee) {
        return res.status(400).json({ message: "Employee ID already exists" });
      }

      // Add photo path if uploaded
      if (req.file) {
        employeeData.photo = `/uploads/photos/${req.file.filename}`;
      }

      // Set default barcode if not provided
      if (!employeeData.barcode) {
        employeeData.barcode = employeeData.id;
      }

      const employee = await storage.createEmployee(employeeData);
      res.json(employee);
    } catch (error: any) {
      res.status(400).json({ message: "Error creating employee", error: error.message });
    }
  });

  app.put("/api/employees/:id", upload.single('photo'), async (req, res) => {
    try {
      const updateData = { ...req.body };
      
      if (req.file) {
        updateData.photo = `/uploads/photos/${req.file.filename}`;
      }

      const employee = await storage.updateEmployee(req.params.id, updateData);
      res.json(employee);
    } catch (error) {
      res.status(400).json({ message: "Error updating employee" });
    }
  });

  app.delete("/api/employees/:id", async (req, res) => {
    try {
      await storage.deleteEmployee(req.params.id);
      res.json({ message: "Employee deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting employee" });
    }
  });

  // Attendance routes
  app.post("/api/attendance/check-in", async (req, res) => {
    try {
      const { employeeId } = req.body;
      
      if (!employeeId) {
        return res.status(400).json({ message: "Employee ID is required" });
      }

      // Check if employee exists
      const employee = await storage.getEmployee(employeeId);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      const today = new Date().toISOString().split('T')[0];
      const now = new Date();

      // Check if there's already a record for today
      let todayRecord = await storage.getTodayAttendance(employeeId);

      if (!todayRecord) {
        // Create new attendance record with check-in
        const newRecord = await storage.createAttendanceRecord({
          employeeId,
          checkInTime: now,
          date: today,
        });
        return res.json({ 
          message: "Check-in successful", 
          record: newRecord, 
          employee,
          action: "check-in"
        });
      } else if (!todayRecord.checkOutTime) {
        // Update existing record with check-out
        const hoursWorked = (now.getTime() - todayRecord.checkInTime!.getTime()) / (1000 * 60 * 60);
        const totalHours = hoursWorked.toFixed(2) + "h";
        
        const updatedRecord = await storage.updateAttendanceRecord(todayRecord.id, {
          checkOutTime: now,
          totalHours,
        });
        
        return res.json({ 
          message: "Check-out successful", 
          record: updatedRecord, 
          employee,
          action: "check-out",
          hoursWorked: totalHours
        });
      } else {
        return res.status(400).json({ message: "Employee has already completed check-in and check-out today" });
      }
    } catch (error) {
      res.status(500).json({ message: "Error processing attendance" });
    }
  });

  app.get("/api/attendance/stats", async (req, res) => {
    try {
      const stats = await storage.getAttendanceStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Error fetching attendance stats" });
    }
  });

  app.get("/api/attendance/records", async (req, res) => {
    try {
      const { employeeId, startDate, endDate } = req.query;
      const records = await storage.getAttendanceRecords(
        employeeId as string,
        startDate as string,
        endDate as string
      );
      res.json(records);
    } catch (error) {
      res.status(500).json({ message: "Error fetching attendance records" });
    }
  });

  // Schedule routes
  app.get("/api/schedules", async (req, res) => {
    try {
      const schedules = await storage.getAllSchedules();
      res.json(schedules);
    } catch (error) {
      res.status(500).json({ message: "Error fetching schedules" });
    }
  });

  app.post("/api/schedules", async (req, res) => {
    try {
      const scheduleData = insertScheduleSchema.parse(req.body);
      const schedule = await storage.createSchedule(scheduleData);
      res.json(schedule);
    } catch (error) {
      res.status(400).json({ message: "Error creating schedule" });
    }
  });

  app.put("/api/schedules/:id", async (req, res) => {
    try {
      const schedule = await storage.updateSchedule(req.params.id, req.body);
      res.json(schedule);
    } catch (error) {
      res.status(400).json({ message: "Error updating schedule" });
    }
  });

  // System settings routes
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getSystemSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Error fetching settings" });
    }
  });

  app.put("/api/settings", async (req, res) => {
    try {
      const settings = await storage.updateSystemSettings(req.body);
      res.json(settings);
    } catch (error) {
      res.status(400).json({ message: "Error updating settings" });
    }
  });

  // Credentials generation endpoint
  app.post("/api/credentials/generate", async (req, res) => {
    try {
      const { employeeIds, settings } = req.body;
      
      if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
        return res.status(400).json({ message: "No employee IDs provided" });
      }

      // Get employee data
      const employees = await Promise.all(
        employeeIds.map(id => storage.getEmployee(id))
      );

      const validEmployees = employees.filter(emp => emp !== undefined);
      
      if (validEmployees.length === 0) {
        return res.status(400).json({ message: "No valid employees found" });
      }

      // Generate credential data (simplified - in production would generate actual images/PDFs)
      const credentialData = validEmployees.map(employee => ({
        id: employee.id,
        fullName: employee.fullName,
        department: employee.department,
        photo: employee.photo,
        barcode: employee.barcode,
        settings
      }));

      // For demo purposes, return a simple success response
      // In production, this would generate actual credential files
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="credenciales_${new Date().toISOString().split('T')[0]}.json"`);
      res.json({
        message: "Credenciales generadas exitosamente",
        count: validEmployees.length,
        employees: credentialData,
        settings
      });
    } catch (error) {
      console.error("Error generating credentials:", error);
      res.status(500).json({ message: "Error generating credentials" });
    }
  });

  // Serve uploaded files
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  const httpServer = createServer(app);
  return httpServer;
}
