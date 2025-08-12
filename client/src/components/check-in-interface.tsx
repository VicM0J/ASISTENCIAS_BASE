import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, Keyboard, UserCheck, LogOut, Users, Clock } from "lucide-react";
import BarcodeScanner from "./barcode-scanner";
import { attendanceApi } from "@/lib/attendance-api";
import { useToast } from "@/hooks/use-toast";
import Swal from "sweetalert2";

export default function CheckInInterface() {
  const [employeeId, setEmployeeId] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch attendance stats
  const { data: stats } = useQuery({
    queryKey: ["/api/attendance/stats"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: attendanceApi.checkIn,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/stats"] });
      
      // Show SweetAlert with employee info
      Swal.fire({
        title: `¡${data.action === "check-in" ? "Check-in" : "Check-out"} Exitoso!`,
        html: `
          <div class="text-center">
            ${data.employee.photo ? 
              `<img src="${data.employee.photo}" class="w-24 h-24 rounded-full mx-auto mb-4 object-cover" alt="Empleado">` :
              '<div class="w-24 h-24 rounded-full mx-auto mb-4 bg-slate-200 flex items-center justify-center"><span class="text-2xl text-slate-400">👤</span></div>'
            }
            <h3 class="text-lg font-semibold text-navy">${data.employee.fullName}</h3>
            <p class="text-slate-600">${data.employee.department}</p>
            ${data.hoursWorked ? 
              `<p class="text-lg font-bold text-green-600 mt-2">${data.hoursWorked} trabajadas hoy</p>` :
              '<p class="text-lg font-bold text-blue-600 mt-2">Iniciando jornada laboral</p>'
            }
          </div>
        `,
        icon: 'success',
        confirmButtonText: 'Continuar',
        confirmButtonColor: '#0891b2',
        timer: 5000,
        timerProgressBar: true
      });
      
      setEmployeeId("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al procesar el registro",
        variant: "destructive",
      });
    }
  });

  const handleManualCheckIn = () => {
    if (!employeeId.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa un ID válido",
        variant: "destructive",
      });
      return;
    }
    checkInMutation.mutate(employeeId.trim());
  };

  const handleBarcodeDetected = (code: string) => {
    setEmployeeId(code);
    setShowScanner(false);
    checkInMutation.mutate(code);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  return (
    <div>
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-navy">Check In / Check Out</h2>
            <p className="text-slate-600">Registra entradas y salidas de empleados</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-500">Fecha actual</div>
            <div className="text-xl font-semibold text-navy">{formatDate(currentTime)}</div>
            <div className="text-lg text-turquoise">{formatTime(currentTime)}</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Camera Scanner */}
            <Card className="shadow-lg">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-turquoise rounded-full flex items-center justify-center mx-auto mb-4">
                    <Camera className="text-white text-2xl h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-semibold text-navy mb-2">Escaneo por Cámara</h3>
                  <p className="text-slate-600">Posiciona el código de barras frente a la cámara</p>
                </div>
                
                {/* Camera View */}
                <div className="bg-slate-100 rounded-lg h-64 flex items-center justify-center mb-6 relative overflow-hidden">
                  {showScanner ? (
                    <BarcodeScanner onBarcodeDetected={handleBarcodeDetected} />
                  ) : (
                    <div className="text-center">
                      <Camera className="h-16 w-16 text-slate-400 mx-auto mb-2" />
                      <p className="text-slate-500">Presiona para activar la cámara</p>
                    </div>
                  )}
                </div>
                
                <Button 
                  onClick={() => setShowScanner(!showScanner)}
                  className="w-full bg-turquoise hover:bg-cyan-600"
                  disabled={checkInMutation.isPending}
                >
                  <Camera className="mr-2 h-4 w-4" />
                  {showScanner ? "Detener Escaneo" : "Iniciar Escaneo"}
                </Button>
              </CardContent>
            </Card>

            {/* Manual Input */}
            <Card className="shadow-lg">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-navy rounded-full flex items-center justify-center mx-auto mb-4">
                    <Keyboard className="text-white text-2xl h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-semibold text-navy mb-2">Entrada Manual</h3>
                  <p className="text-slate-600">Ingresa el ID del empleado manualmente</p>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">ID del Empleado</label>
                    <Input
                      type="text"
                      placeholder="Ej: MOJV040815"
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleManualCheckIn()}
                      className="text-center text-lg font-mono"
                      disabled={checkInMutation.isPending}
                    />
                  </div>
                  
                  <Button 
                    onClick={handleManualCheckIn}
                    className="w-full bg-navy hover:bg-slate-700"
                    disabled={checkInMutation.isPending || !employeeId.trim()}
                  >
                    <UserCheck className="mr-2 h-4 w-4" />
                    {checkInMutation.isPending ? "Procesando..." : "Registrar Asistencia"}
                  </Button>
                </div>
                
                {/* Recent Activity Placeholder */}
                <div className="mt-8 pt-6 border-t border-slate-200">
                  <h4 className="font-semibold text-slate-700 mb-3">Actividad Reciente</h4>
                  <div className="text-sm text-slate-500 text-center py-4">
                    Los registros aparecerán aquí después de cada check-in
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
            <Card className="shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <UserCheck className="text-green-600 h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-slate-600">Entradas Hoy</p>
                    <p className="text-2xl font-bold text-navy">{stats?.todayCheckIns || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <LogOut className="text-red-600 h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-slate-600">Salidas Hoy</p>
                    <p className="text-2xl font-bold text-navy">{stats?.todayCheckOuts || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="text-blue-600 h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-slate-600">Empleados Activos</p>
                    <p className="text-2xl font-bold text-navy">{stats?.activeEmployees || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Clock className="text-yellow-600 h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-slate-600">Tiempo Promedio</p>
                    <p className="text-2xl font-bold text-navy">{stats?.averageTime || "0h"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
