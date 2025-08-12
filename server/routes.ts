import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertEmployeeSchema, insertScheduleSchema, insertCompanySchema } from "@shared/schema";
import multer from "multer";
import ExcelJS from "exceljs";
import JsBarcode from "jsbarcode";
import { Canvas } from "canvas";

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Company routes
  app.get("/api/company", async (req, res) => {
    try {
      const company = await storage.getCompany();
      res.json(company);
    } catch (error) {
      res.status(500).json({ message: "Failed to get company information" });
    }
  });

  app.put("/api/company", upload.single("logo"), async (req, res) => {
    try {
      const data = req.body;
      if (req.file) {
        data.logo = req.file.buffer;
      }
      const company = await storage.updateCompany(data);
      res.json(company);
    } catch (error) {
      res.status(500).json({ message: "Failed to update company information" });
    }
  });

  // Schedule routes
  app.get("/api/schedules", async (req, res) => {
    try {
      const schedules = await storage.getSchedules();
      res.json(schedules);
    } catch (error) {
      res.status(500).json({ message: "Failed to get schedules" });
    }
  });

  app.get("/api/schedules/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const schedule = await storage.getSchedule(id);
      if (!schedule) {
        return res.status(404).json({ message: "Schedule not found" });
      }
      res.json(schedule);
    } catch (error) {
      res.status(500).json({ message: "Failed to get schedule" });
    }
  });

  app.post("/api/schedules", async (req, res) => {
    try {
      const validatedData = insertScheduleSchema.parse(req.body);
      const schedule = await storage.createSchedule(validatedData);
      res.status(201).json(schedule);
    } catch (error) {
      res.status(400).json({ message: "Invalid schedule data" });
    }
  });

  app.put("/api/schedules/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const schedule = await storage.updateSchedule(id, req.body);
      res.json(schedule);
    } catch (error) {
      res.status(500).json({ message: "Failed to update schedule" });
    }
  });

  app.delete("/api/schedules/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteSchedule(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete schedule" });
    }
  });

  // Employee routes
  app.get("/api/employees", async (req, res) => {
    try {
      const employees = await storage.getEmployees();
      res.json(employees);
    } catch (error) {
      res.status(500).json({ message: "Failed to get employees" });
    }
  });

  app.get("/api/employees/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const employee = await storage.getEmployee(id);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      res.json(employee);
    } catch (error) {
      res.status(500).json({ message: "Failed to get employee" });
    }
  });

  app.get("/api/employees/by-barcode/:barcode", async (req, res) => {
    try {
      const barcode = req.params.barcode;
      const employee = await storage.getEmployeeByBarcode(barcode);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      res.json(employee);
    } catch (error) {
      res.status(500).json({ message: "Failed to get employee by barcode" });
    }
  });

  app.post("/api/employees", upload.single("photo"), async (req, res) => {
    try {
      const data = req.body;
      if (req.file) {
        data.photo = req.file.buffer;
      }
      
      // Generate barcode if not provided
      if (!data.barcode) {
        data.barcode = data.employeeId;
      }

      const validatedData = insertEmployeeSchema.parse(data);
      const employee = await storage.createEmployee(validatedData);
      res.status(201).json(employee);
    } catch (error) {
      res.status(400).json({ message: "Invalid employee data" });
    }
  });

  app.put("/api/employees/:id", upload.single("photo"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = req.body;
      if (req.file) {
        data.photo = req.file.buffer;
      }
      const employee = await storage.updateEmployee(id, data);
      res.json(employee);
    } catch (error) {
      res.status(500).json({ message: "Failed to update employee" });
    }
  });

  app.delete("/api/employees/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteEmployee(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete employee" });
    }
  });

  // Attendance routes
  app.get("/api/attendances", async (req, res) => {
    try {
      const { startDate, endDate, department } = req.query;
      const attendances = await storage.getAttendances(
        startDate as string,
        endDate as string,
        department as string
      );
      res.json(attendances);
    } catch (error) {
      res.status(500).json({ message: "Failed to get attendances" });
    }
  });

  app.get("/api/employees/:id/attendances", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { startDate, endDate } = req.query;
      const attendances = await storage.getEmployeeAttendances(
        id,
        startDate as string,
        endDate as string
      );
      res.json(attendances);
    } catch (error) {
      res.status(500).json({ message: "Failed to get employee attendances" });
    }
  });

  app.post("/api/checkin", async (req, res) => {
    try {
      const { barcode, employeeId } = req.body;
      
      let employee;
      if (barcode) {
        employee = await storage.getEmployeeByBarcode(barcode);
      } else if (employeeId) {
        employee = await storage.getEmployeeByEmployeeId(employeeId);
      }
      
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      // Check for recent check-in (within 1 minute)
      const today = new Date().toISOString().split('T')[0];
      const existingAttendance = await storage.getTodayAttendance(employee.id);
      
      if (existingAttendance?.checkIn) {
        const lastCheckIn = new Date(existingAttendance.checkIn);
        const now = new Date();
        const diffMinutes = (now.getTime() - lastCheckIn.getTime()) / (1000 * 60);
        
        if (diffMinutes < 1) {
          return res.status(400).json({ 
            message: "Check-in bloqueado. Espera 1 minuto antes de volver a registrar.",
            cooldown: true 
          });
        }
      }

      const attendance = await storage.checkIn(employee.id);
      
      // Calculate hours worked today
      let hoursWorked = 0;
      if (attendance.checkIn && attendance.checkOut) {
        hoursWorked = attendance.totalHours || 0;
      } else if (attendance.checkIn) {
        const checkInTime = new Date(attendance.checkIn);
        const now = new Date();
        hoursWorked = (now.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
      }

      res.json({
        success: true,
        employee,
        attendance,
        hoursWorked: Math.round(hoursWorked * 100) / 100,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to check in" });
    }
  });

  app.post("/api/checkout", async (req, res) => {
    try {
      const { barcode, employeeId } = req.body;
      
      let employee;
      if (barcode) {
        employee = await storage.getEmployeeByBarcode(barcode);
      } else if (employeeId) {
        employee = await storage.getEmployeeByEmployeeId(employeeId);
      }
      
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      const attendance = await storage.checkOut(employee.id);
      
      res.json({
        success: true,
        employee,
        attendance,
        hoursWorked: attendance.totalHours || 0,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to check out" });
    }
  });

  // Reports
  app.get("/api/reports/attendance", async (req, res) => {
    try {
      const { startDate, endDate, department } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start date and end date are required" });
      }

      const report = await storage.getAttendanceReport(
        startDate as string,
        endDate as string,
        department as string
      );
      
      res.json(report);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate attendance report" });
    }
  });

  app.get("/api/reports/attendance/excel", async (req, res) => {
    try {
      const { startDate, endDate, department } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start date and end date are required" });
      }

      const report = await storage.getAttendanceReport(
        startDate as string,
        endDate as string,
        department as string
      );

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Reporte de Asistencias");

      // Add headers
      worksheet.columns = [
        { header: "ID Empleado", key: "employeeId", width: 15 },
        { header: "Nombre Completo", key: "fullName", width: 30 },
        { header: "Departamento", key: "department", width: 20 },
        { header: "Fecha", key: "date", width: 12 },
        { header: "Entradas", key: "checkIns", width: 20 },
        { header: "Salidas", key: "checkOuts", width: 20 },
        { header: "Horas Trabajadas", key: "totalHours", width: 18 },
        { header: "Horas Extra", key: "overtimeHours", width: 15 },
        { header: "Firma", key: "signature", width: 25 },
      ];

      // Add data
      report.forEach((row) => {
        worksheet.addRow({
          employeeId: row.employeeId,
          fullName: row.fullName,
          department: row.department,
          date: row.date,
          checkIns: row.checkIns.join(", "),
          checkOuts: row.checkOuts.join(", "),
          totalHours: row.totalHours,
          overtimeHours: row.overtimeHours,
          signature: "_".repeat(20),
        });
      });

      // Style the header row
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE6E6FA" },
      };

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="reporte-asistencias-${startDate}-${endDate}.xlsx"`
      );

      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      res.status(500).json({ message: "Failed to generate Excel report" });
    }
  });

  // Barcode generation
  app.get("/api/barcode/:text", async (req, res) => {
    try {
      const text = req.params.text;
      const canvas = new Canvas(200, 50, "svg");
      
      JsBarcode(canvas, text, {
        format: "CODE128",
        width: 2,
        height: 50,
        displayValue: true,
        fontSize: 12,
        textMargin: 5,
      });

      res.setHeader("Content-Type", "image/svg+xml");
      res.send(canvas.toBuffer());
    } catch (error) {
      res.status(500).json({ message: "Failed to generate barcode" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
