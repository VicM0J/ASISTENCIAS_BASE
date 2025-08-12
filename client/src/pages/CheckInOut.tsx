import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import BarcodeScanner from "@/components/BarcodeScanner";
import { apiRequest } from "@/lib/queryClient";
import { formatTime, createImageUrl } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import Swal from "sweetalert2";

export default function CheckInOut() {
  const [manualId, setManualId] = useState("");
  const [scannerReady, setScannerReady] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: recentAttendances } = useQuery({
    queryKey: ["/api/attendances"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const attendanceMutation = useMutation({
    mutationFn: async (data: { barcode?: string; employeeId?: string }) => {
      const response = await apiRequest("POST", "/api/attendance-toggle", data);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        const actionType = data.isCheckIn ? "Entrada" : "Salida";
        showSuccessAlert(data.employee, data.hoursWorked, actionType);
        queryClient.invalidateQueries({ queryKey: ["/api/attendances"] });
        setManualId("");
      }
    },
    onError: (error: any) => {
      if (error.message.includes("bloqueado")) {
        toast({
          title: "Registro Bloqueado",
          description: "Debes esperar 1 minuto antes de volver a registrar.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "No se pudo registrar la asistencia. Verifica el código.",
          variant: "destructive",
        });
      }
    },
  });

  const showSuccessAlert = (employee: any, hoursWorked: number, action: string) => {
    const photoUrl = employee.photo ? createImageUrl(new Uint8Array(employee.photo.data)) : null;
    
    Swal.fire({
      title: `¡${action} Exitosa!`,
      html: `
        <div class="text-center">
          ${photoUrl ? 
            `<img src="${photoUrl}" alt="Empleado" class="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-4 border-primary">` :
            `<div class="w-24 h-24 rounded-full mx-auto mb-4 bg-gray-200 flex items-center justify-center text-2xl font-bold text-gray-600">${employee.fullName[0]}</div>`
          }
          <h3 class="text-xl font-semibold text-gray-900 mb-2">${employee.fullName}</h3>
          <p class="text-gray-600 mb-2">Área: ${employee.department}</p>
          <p class="text-lg font-medium text-primary">Horas trabajadas hoy: ${hoursWorked.toFixed(1)}h</p>
          <p class="text-sm text-gray-500 mt-2">ID: ${employee.employeeId}</p>
        </div>
      `,
      icon: 'success',
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#0D9488',
      timer: 5000,
      timerProgressBar: true,
      width: '500px',
    });
  };

  const handleBarcodeScan = (barcode: string) => {
    console.log(`Procesando código escaneado: "${barcode}"`);
    
    if (!barcode || barcode.length < 4) {
      console.log("Código muy corto, ignorando");
      return;
    }

    if (!scannerReady) {
      console.log("Scanner no está listo, ignorando");
      return;
    }

    setScannerReady(false);
    
    toast({
      title: "Código Detectado",
      description: `Procesando código: ${barcode}`,
      duration: 2000,
    });

    console.log("Enviando registro de asistencia para:", barcode);
    attendanceMutation.mutate({ barcode });
    
    // Reset scanner ready state after mutation completes
    setTimeout(() => {
      setScannerReady(true);
      console.log("Scanner listo nuevamente");
    }, 3000);
  };

  const handleManualEntry = () => {
    if (!manualId.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa un ID de empleado.",
        variant: "destructive",
      });
      return;
    }
    attendanceMutation.mutate({ employeeId: manualId.trim() });
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <Card className="tablet-card shadow-sm border border-gray-200">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Control de Asistencias
              </h2>
              <p className="text-gray-600 mb-4">
                Escanea tu código de barras para registrar entrada o salida
              </p>
              
              {/* Scanner Status Indicator */}
              <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                scannerReady 
                  ? 'bg-green-100 text-green-800 border border-green-200' 
                  : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
              }`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  scannerReady ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'
                }`} />
                {scannerReady ? 'Escáner listo - Puede escanear código' : 'Procesando...'}
              </div>
            </div>

            <BarcodeScanner 
              onScan={handleBarcodeScan}
              disabled={attendanceMutation.isPending}
            />

            {/* Manual Input */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <div className="max-w-md mx-auto">
                <Label htmlFor="manual-id" className="block text-sm font-medium text-gray-700 mb-2">
                  ID del Empleado (Manual)
                </Label>
                <div className="flex space-x-3">
                  <Input
                    id="manual-id"
                    type="text"
                    placeholder="MOJV040815"
                    value={manualId}
                    onChange={(e) => setManualId(e.target.value.toUpperCase())}
                    className="tablet-input"
                    data-testid="manual-employee-id"
                  />
                  <Button
                    onClick={handleManualEntry}
                    disabled={attendanceMutation.isPending || !manualId.trim()}
                    className="tablet-button bg-accent hover:bg-accent/90"
                    data-testid="manual-checkin"
                  >
                    {attendanceMutation.isPending ? "Registrando..." : "Registrar"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Recent Check-ins */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Registros Recientes
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-thin">
                {recentAttendances && recentAttendances.length > 0 ? (
                  recentAttendances.slice(0, 5).map((attendance: any) => {
                    const photoUrl = attendance.employee.photo ? 
                      createImageUrl(new Uint8Array(attendance.employee.photo.data)) : null;
                    
                    return (
                      <div key={attendance.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          {photoUrl ? (
                            <img 
                              src={photoUrl} 
                              alt="Empleado" 
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-lg font-semibold text-gray-600">
                              {attendance.employee.fullName[0]}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900">
                              {attendance.employee.fullName}
                            </p>
                            <p className="text-sm text-gray-600">
                              {attendance.employee.department}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            attendance.checkOut ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {attendance.checkOut ? 'Salida' : 'Entrada'}
                          </span>
                          <p className="text-sm text-gray-600 mt-1">
                            {formatTime(attendance.checkOut || attendance.checkIn)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    No hay registros recientes
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
