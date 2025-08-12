import * as XLSX from "xlsx";

export interface ExportReportData {
  startDate: string;
  endDate: string;
  department?: string;
  type: "summary" | "detailed" | "overtime";
  includePhotos: boolean;
  includeSignature: boolean;
  includeCharts: boolean;
}

export interface EmployeeAttendanceData {
  id: string;
  fullName: string;
  department: string;
  photo?: string;
  records: Array<{
    date: string;
    checkInTime?: string;
    checkOutTime?: string;
    totalHours?: string;
    overtimeHours?: string;
  }>;
  totalHours: string;
  totalOvertime: string;
}

export const exportToExcel = async (reportData: ExportReportData): Promise<void> => {
  try {
    // Fetch attendance data based on report parameters
    const attendanceData = await fetchAttendanceData(reportData);
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    
    // Generate different sheets based on report type
    if (reportData.type === "summary") {
      generateSummarySheet(workbook, attendanceData, reportData);
    } else if (reportData.type === "detailed") {
      generateDetailedSheet(workbook, attendanceData, reportData);
    } else if (reportData.type === "overtime") {
      generateOvertimeSheet(workbook, attendanceData, reportData);
    }
    
    // Add metadata sheet
    generateMetadataSheet(workbook, reportData);
    
    // Generate filename
    const filename = generateFilename(reportData);
    
    // Export file
    XLSX.writeFile(workbook, filename);
    
  } catch (error) {
    console.error("Error generating Excel report:", error);
    throw new Error("Failed to generate Excel report");
  }
};

const fetchAttendanceData = async (reportData: ExportReportData): Promise<EmployeeAttendanceData[]> => {
  // Fetch employees
  const employeesResponse = await fetch("/api/employees");
  const employees = await employeesResponse.json();
  
  // Filter by department if specified
  const filteredEmployees = reportData.department 
    ? employees.filter((emp: any) => emp.department === reportData.department)
    : employees;
  
  // Fetch attendance records for each employee
  const attendancePromises = filteredEmployees.map(async (employee: any) => {
    const recordsResponse = await fetch(
      `/api/attendance/records?employeeId=${employee.id}&startDate=${reportData.startDate}&endDate=${reportData.endDate}`
    );
    const records = await recordsResponse.json();
    
    // Calculate totals
    let totalMinutes = 0;
    let overtimeMinutes = 0;
    
    records.forEach((record: any) => {
      if (record.checkInTime && record.checkOutTime) {
        const checkIn = new Date(record.checkInTime);
        const checkOut = new Date(record.checkOutTime);
        const minutes = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60);
        totalMinutes += minutes;
        
        // Calculate overtime (assuming 8 hours = 480 minutes standard)
        if (minutes > 480) {
          overtimeMinutes += minutes - 480;
        }
      }
    });
    
    return {
      id: employee.id,
      fullName: employee.fullName,
      department: employee.department,
      photo: employee.photo,
      records: records.map((record: any) => ({
        date: record.date,
        checkInTime: record.checkInTime ? formatTime(record.checkInTime) : "",
        checkOutTime: record.checkOutTime ? formatTime(record.checkOutTime) : "",
        totalHours: calculateDailyHours(record.checkInTime, record.checkOutTime),
        overtimeHours: calculateDailyOvertime(record.checkInTime, record.checkOutTime),
      })),
      totalHours: formatHours(totalMinutes / 60),
      totalOvertime: formatHours(overtimeMinutes / 60),
    };
  });
  
  return Promise.all(attendancePromises);
};

const generateSummarySheet = (
  workbook: XLSX.WorkBook, 
  data: EmployeeAttendanceData[], 
  reportData: ExportReportData
) => {
  const summaryData = data.map(employee => ({
    "ID Empleado": employee.id,
    "Nombre Completo": employee.fullName,
    "Departamento": employee.department,
    "Total Horas": employee.totalHours,
    "Horas Extra": employee.totalOvertime,
    "Días Trabajados": employee.records.filter(r => r.checkInTime && r.checkOutTime).length,
    ...(reportData.includeSignature ? { "Firma": "" } : {}),
  }));
  
  const worksheet = XLSX.utils.json_to_sheet(summaryData);
  
  // Style the header row
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    if (!worksheet[cellAddress]) continue;
    
    worksheet[cellAddress].s = {
      fill: { fgColor: { rgb: "1e293b" } }, // Navy background
      font: { color: { rgb: "FFFFFF" }, bold: true },
      alignment: { horizontal: "center" }
    };
  }
  
  // Auto-size columns
  const colWidths = Object.keys(summaryData[0] || {}).map(key => ({
    wch: Math.max(key.length, 15)
  }));
  worksheet['!cols'] = colWidths;
  
  XLSX.utils.book_append_sheet(workbook, worksheet, "Resumen");
};

const generateDetailedSheet = (
  workbook: XLSX.WorkBook, 
  data: EmployeeAttendanceData[], 
  reportData: ExportReportData
) => {
  const detailedData: any[] = [];
  
  data.forEach(employee => {
    employee.records.forEach(record => {
      detailedData.push({
        "ID Empleado": employee.id,
        "Nombre Completo": employee.fullName,
        "Departamento": employee.department,
        "Fecha": formatDate(record.date),
        "Hora Entrada": record.checkInTime,
        "Hora Salida": record.checkOutTime,
        "Horas Trabajadas": record.totalHours,
        "Horas Extra": record.overtimeHours,
        ...(reportData.includeSignature ? { "Firma": "" } : {}),
      });
    });
  });
  
  const worksheet = XLSX.utils.json_to_sheet(detailedData);
  
  // Style the header row
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    if (!worksheet[cellAddress]) continue;
    
    worksheet[cellAddress].s = {
      fill: { fgColor: { rgb: "0891b2" } }, // Turquoise background
      font: { color: { rgb: "FFFFFF" }, bold: true },
      alignment: { horizontal: "center" }
    };
  }
  
  // Auto-size columns
  const colWidths = Object.keys(detailedData[0] || {}).map(key => ({
    wch: Math.max(key.length, 12)
  }));
  worksheet['!cols'] = colWidths;
  
  XLSX.utils.book_append_sheet(workbook, worksheet, "Detallado");
};

const generateOvertimeSheet = (
  workbook: XLSX.WorkBook, 
  data: EmployeeAttendanceData[], 
  reportData: ExportReportData
) => {
  const overtimeData = data
    .filter(employee => parseFloat(employee.totalOvertime.replace('h', '')) > 0)
    .map(employee => {
      const overtimeRecords = employee.records.filter(record => 
        record.overtimeHours && parseFloat(record.overtimeHours.replace('h', '')) > 0
      );
      
      return {
        "ID Empleado": employee.id,
        "Nombre Completo": employee.fullName,
        "Departamento": employee.department,
        "Total Horas Extra": employee.totalOvertime,
        "Días con Horas Extra": overtimeRecords.length,
        "Promedio Diario Extra": formatHours(
          parseFloat(employee.totalOvertime.replace('h', '')) / Math.max(overtimeRecords.length, 1)
        ),
        ...(reportData.includeSignature ? { "Firma": "" } : {}),
      };
    });
  
  if (overtimeData.length === 0) {
    overtimeData.push({
      "ID Empleado": "N/A",
      "Nombre Completo": "No hay registros de horas extra en este período",
      "Departamento": "",
      "Total Horas Extra": "",
      "Días con Horas Extra": 0,
      "Promedio Diario Extra": "0h",
      ...(reportData.includeSignature ? { "Firma": "" } : {}),
    });
  }
  
  const worksheet = XLSX.utils.json_to_sheet(overtimeData);
  
  // Style the header row
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    if (!worksheet[cellAddress]) continue;
    
    worksheet[cellAddress].s = {
      fill: { fgColor: { rgb: "eab308" } }, // Yellow background
      font: { color: { rgb: "FFFFFF" }, bold: true },
      alignment: { horizontal: "center" }
    };
  }
  
  XLSX.utils.book_append_sheet(workbook, worksheet, "Horas Extra");
};

const generateMetadataSheet = (workbook: XLSX.WorkBook, reportData: ExportReportData) => {
  const metadata = [
    ["Parámetros del Reporte", ""],
    ["Fecha de Inicio", reportData.startDate],
    ["Fecha de Fin", reportData.endDate],
    ["Departamento", reportData.department || "Todos"],
    ["Tipo de Reporte", reportData.type],
    ["Incluye Fotografías", reportData.includePhotos ? "Sí" : "No"],
    ["Incluye Espacio Firma", reportData.includeSignature ? "Sí" : "No"],
    ["Incluye Gráficos", reportData.includeCharts ? "Sí" : "No"],
    ["", ""],
    ["Información del Sistema", ""],
    ["Generado por", "JASANA - Control de Asistencias"],
    ["Fecha de Generación", new Date().toLocaleString('es-ES')],
    ["Versión", "1.0.0"],
  ];
  
  const worksheet = XLSX.utils.aoa_to_sheet(metadata);
  
  // Style the metadata sheet
  worksheet['A1'].s = {
    fill: { fgColor: { rgb: "1e293b" } },
    font: { color: { rgb: "FFFFFF" }, bold: true, size: 14 },
    alignment: { horizontal: "center" }
  };
  
  worksheet['A10'].s = {
    fill: { fgColor: { rgb: "0891b2" } },
    font: { color: { rgb: "FFFFFF" }, bold: true },
    alignment: { horizontal: "center" }
  };
  
  XLSX.utils.book_append_sheet(workbook, worksheet, "Información");
};

const generateFilename = (reportData: ExportReportData): string => {
  const date = new Date().toISOString().split('T')[0];
  const type = reportData.type === "summary" ? "resumen" : 
               reportData.type === "detailed" ? "detallado" : "horas_extra";
  const dept = reportData.department ? `_${reportData.department}` : "";
  
  return `reporte_${type}${dept}_${reportData.startDate}_${reportData.endDate}_${date}.xlsx`;
};

// Utility functions
const formatTime = (timeString: string): string => {
  try {
    return new Date(timeString).toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  } catch {
    return timeString;
  }
};

const formatDate = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleDateString('es-ES');
  } catch {
    return dateString;
  }
};

const formatHours = (hours: number): string => {
  return `${hours.toFixed(1)}h`;
};

const calculateDailyHours = (checkInTime?: string, checkOutTime?: string): string => {
  if (!checkInTime || !checkOutTime) return "0h";
  
  try {
    const checkIn = new Date(checkInTime);
    const checkOut = new Date(checkOutTime);
    const hours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
    return formatHours(hours);
  } catch {
    return "0h";
  }
};

const calculateDailyOvertime = (checkInTime?: string, checkOutTime?: string): string => {
  if (!checkInTime || !checkOutTime) return "0h";
  
  try {
    const checkIn = new Date(checkInTime);
    const checkOut = new Date(checkOutTime);
    const hours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
    const overtime = Math.max(0, hours - 8); // 8 hours standard
    return formatHours(overtime);
  } catch {
    return "0h";
  }
};
