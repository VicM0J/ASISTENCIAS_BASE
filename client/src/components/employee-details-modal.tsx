import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, Download, Clock, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import { format, parseISO, differenceInHours } from "date-fns";
import { es } from "date-fns/locale";

interface EmployeeDetailsModalProps {
  employeeId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function EmployeeDetailsModal({ employeeId, isOpen, onClose }: EmployeeDetailsModalProps) {
  const { data: employee, isLoading: employeeLoading } = useQuery({
    queryKey: ["/api/employees", employeeId],
    enabled: isOpen && !!employeeId,
  });

  const { data: attendanceRecords, isLoading: recordsLoading } = useQuery({
    queryKey: ["/api/attendance/records", { employeeId }],
    enabled: isOpen && !!employeeId,
  });

  if (!isOpen) return null;

  if (employeeLoading || recordsLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <div className="flex items-center justify-center p-8">
            <div className="text-slate-500">Cargando información del empleado...</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!employee) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <div className="flex items-center justify-center p-8">
            <div className="text-red-500">Error: Empleado no encontrado</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Calculate statistics from attendance records
  const calculateStats = () => {
    if (!attendanceRecords || attendanceRecords.length === 0) {
      return {
        totalHours: "0h",
        avgDaily: "0h",
        overtimeHours: "0h",
        absences: 0,
        weeklyRecords: [],
      };
    }

    let totalMinutes = 0;
    let completedDays = 0;
    let overtimeMinutes = 0;

    // Filter for last 7 days
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const weeklyRecords = attendanceRecords.filter((record: any) => {
      const recordDate = parseISO(record.date);
      return recordDate >= weekAgo;
    });

    weeklyRecords.forEach((record: any) => {
      if (record.checkInTime && record.checkOutTime) {
        const checkIn = parseISO(record.checkInTime);
        const checkOut = parseISO(record.checkOutTime);
        const minutes = differenceInHours(checkOut, checkIn) * 60;
        
        totalMinutes += minutes;
        completedDays++;

        // Calculate overtime (assuming 8 hours = 480 minutes is standard)
        if (minutes > 480) {
          overtimeMinutes += minutes - 480;
        }
      }
    });

    return {
      totalHours: `${(totalMinutes / 60).toFixed(1)}h`,
      avgDaily: completedDays > 0 ? `${(totalMinutes / completedDays / 60).toFixed(1)}h` : "0h",
      overtimeHours: `${(overtimeMinutes / 60).toFixed(1)}h`,
      absences: 0, // Would need to calculate based on expected work days
      weeklyRecords,
    };
  };

  const stats = calculateStats();

  const formatTimeForDisplay = (timeString: string) => {
    try {
      const date = parseISO(timeString);
      return format(date, 'HH:mm', { locale: es });
    } catch {
      return timeString || "--:--";
    }
  };

  const formatDateForDisplay = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, 'EEEE, dd MMM', { locale: es });
    } catch {
      return dateString || "Fecha inválida";
    }
  };

  const calculateDailyHours = (record: any) => {
    if (!record.checkInTime || !record.checkOutTime) {
      return "--h";
    }
    
    try {
      const checkIn = parseISO(record.checkInTime);
      const checkOut = parseISO(record.checkOutTime);
      const hours = differenceInHours(checkOut, checkIn);
      const minutes = Math.round((differenceInHours(checkOut, checkIn) % 1) * 60);
      return minutes > 0 ? `${hours}.${minutes}h` : `${hours}h`;
    } catch {
      return "--h";
    }
  };

  const getRecordStatus = (record: any) => {
    if (record.checkInTime && record.checkOutTime) {
      return { color: "bg-green-500", icon: CheckCircle };
    } else if (record.checkInTime) {
      return { color: "bg-yellow-500", icon: Clock };
    } else {
      return { color: "bg-red-500", icon: AlertCircle };
    }
  };

  const handleExportReport = () => {
    // Implement export functionality
    console.log("Exporting employee report for:", employee.id);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        {/* Modal Header */}
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {employee.photo ? (
                <img 
                  src={employee.photo} 
                  alt={`Foto de ${employee.fullName}`}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center">
                  <span className="text-2xl text-slate-400">👤</span>
                </div>
              )}
              <div>
                <DialogTitle className="text-xl font-bold text-navy">{employee.fullName}</DialogTitle>
                <p className="text-slate-600">
                  ID: <span>{employee.id}</span> • <span>{employee.department}</span>
                </p>
              </div>
            </div>
            <Button variant="ghost" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        {/* Modal Content */}
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center bg-blue-50">
                <div className="text-2xl font-bold text-blue-600">{stats.totalHours}</div>
                <div className="text-sm text-blue-700">Horas Totales (7 días)</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center bg-green-50">
                <div className="text-2xl font-bold text-green-600">{stats.avgDaily}</div>
                <div className="text-sm text-green-700">Promedio Diario</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center bg-yellow-50">
                <div className="text-2xl font-bold text-yellow-600">{stats.overtimeHours}</div>
                <div className="text-sm text-yellow-700">Horas Extra</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center bg-red-50">
                <div className="text-2xl font-bold text-red-600">{stats.absences}</div>
                <div className="text-sm text-red-700">Faltas</div>
              </CardContent>
            </Card>
          </div>

          {/* Attendance History */}
          <Card>
            <CardContent className="p-6">
              <h4 className="font-semibold text-navy mb-4">
                Historial de Asistencias (Últimos 7 días)
              </h4>
              
              {stats.weeklyRecords.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  No hay registros de asistencia en los últimos 7 días
                </div>
              ) : (
                <div className="space-y-2">
                  {stats.weeklyRecords.map((record: any) => {
                    const status = getRecordStatus(record);
                    const StatusIcon = status.icon;
                    
                    return (
                      <div key={record.id} className="flex items-center justify-between bg-white rounded p-3 border border-slate-200">
                        <div className="flex items-center space-x-3">
                          <div className={`w-2 h-2 ${status.color} rounded-full`}></div>
                          <span className="font-medium capitalize">
                            {formatDateForDisplay(record.date)}
                          </span>
                          <StatusIcon className="h-4 w-4 text-slate-400" />
                        </div>
                        <div className="flex space-x-6 text-sm text-slate-600">
                          <span>
                            Entrada: <strong>{formatTimeForDisplay(record.checkInTime)}</strong>
                          </span>
                          <span>
                            Salida: <strong>{formatTimeForDisplay(record.checkOutTime)}</strong>
                          </span>
                          <span>
                            Total: <strong>{calculateDailyHours(record)}</strong>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Employee Details */}
          <Card>
            <CardContent className="p-6">
              <h4 className="font-semibold text-navy mb-4">Información del Empleado</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-slate-700">Horario Asignado:</span>
                  <span className="ml-2 text-slate-600">{employee.schedule}</span>
                </div>
                <div>
                  <span className="font-medium text-slate-700">Código de Barras:</span>
                  <span className="ml-2 text-slate-600 font-mono">{employee.barcode || employee.id}</span>
                </div>
                <div>
                  <span className="font-medium text-slate-700">Estado:</span>
                  <span className={`ml-2 px-2 py-1 rounded text-xs ${
                    employee.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {employee.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-slate-700">Fecha de Registro:</span>
                  <span className="ml-2 text-slate-600">
                    {employee.createdAt ? formatDateForDisplay(employee.createdAt) : 'No disponible'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-slate-200">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          <Button onClick={handleExportReport} className="bg-turquoise hover:bg-cyan-600">
            <Download className="mr-2 h-4 w-4" />
            Exportar Reporte
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
