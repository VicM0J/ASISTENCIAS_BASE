import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import BarcodeScanner from "@/components/barcode-scanner";
import { useBarcodeScanner } from "@/hooks/use-barcode-scanner";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Camera, Keyboard, Clock, UserCheck, UserX, Scan } from "lucide-react";

export default function CheckInOut() {
  const [scannerActive, setScannerActive] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [autoScanEnabled, setAutoScanEnabled] = useState(true);
  const { toast } = useToast();

  const { data: recentActivity, isLoading } = useQuery({
    queryKey: ["/api/attendance/recent"],
  });

  const checkInMutation = useMutation({
    mutationFn: async (barcodeData: string) => {
      const response = await fetch("/api/attendance/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ barcodeData }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      const { type, employee, record } = data;
      const time = new Date().toLocaleTimeString('es-MX', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      toast({
        title: type === "check-in" ? "✅ Entrada Registrada" : "🚪 Salida Registrada",
        description: (
          <div className="space-y-1">
            <div className="font-semibold">{employee.fullName}</div>
            <div className="text-sm">ID: {employee.employeeId}</div>
            <div className="text-sm">Hora: {time}</div>
            <div className="text-sm text-muted-foreground">{employee.department}</div>
          </div>
        ),
        duration: 5000,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/recent"] });
      setScannerActive(false);
      setManualInput("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleBarcodeDetected = (barcode: string) => {
    checkInMutation.mutate(barcode);
  };

  const handleBarcodeError = (error: string) => {
    toast({
      title: "Error en escáner",
      description: error,
      variant: "destructive",
    });
  };

  // Hook para detectar escáner físico automáticamente
  useBarcodeScanner({
    onDetected: handleBarcodeDetected,
    onError: handleBarcodeError,
    autoScan: autoScanEnabled,
  });

  const handleManualSubmit = () => {
    if (manualInput.trim()) {
      checkInMutation.mutate(manualInput.trim());
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Check In / Check Out</h2>
          <p className="text-slate-600">Registra entradas y salidas escaneando el código de barras</p>
          
          {/* Auto-scan toggle */}
          <div className="mt-4 flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Button
                variant={autoScanEnabled ? "default" : "outline"}
                size="sm"
                onClick={() => setAutoScanEnabled(!autoScanEnabled)}
              >
                <Scan className="w-4 h-4 mr-2" />
                {autoScanEnabled ? "Escáner Automático: ACTIVO" : "Escáner Automático: INACTIVO"}
              </Button>
            </div>
            {autoScanEnabled && (
              <div className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                ✓ Listo para recibir códigos de escáner físico
              </div>
            )}
          </div>
        </div>

        {/* Camera Scanner Section */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Escáner de Código de Barras</h3>
              <p className="text-slate-600">Posiciona el código de barras frente a la cámara o usa un escáner físico</p>
              {autoScanEnabled && (
                <div className="mt-2 text-sm text-blue-600 bg-blue-50 px-4 py-2 rounded-lg inline-block">
                  💡 Tip: Con el escáner automático activo, simplemente escanea cualquier código de barras y se registrará automáticamente
                </div>
              )}
            </div>
            
            <div className="relative bg-slate-900 rounded-xl overflow-hidden mb-6" style={{ height: "400px" }}>
              {scannerActive ? (
                <BarcodeScanner onDetected={handleBarcodeDetected} />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white">
                    <Camera className="w-16 h-16 mb-4 opacity-50 mx-auto" />
                    <p className="text-lg">Cámara se iniciará aquí</p>
                    <p className="text-sm opacity-75">Permitir acceso a la cámara</p>
                  </div>
                </div>
              )}
              
              {/* Scanning Frame */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-80 h-32 border-2 border-primary rounded-lg relative">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary"></div>
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary"></div>
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary"></div>
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary"></div>
                </div>
              </div>
            </div>

            <div className="flex justify-center space-x-4 mb-6">
              <Button 
                onClick={() => setScannerActive(!scannerActive)}
                disabled={checkInMutation.isPending}
              >
                <Camera className="w-4 h-4 mr-2" />
                {scannerActive ? "Detener Cámara" : "Iniciar Cámara"}
              </Button>
              <Button variant="outline">
                <Keyboard className="w-4 h-4 mr-2" />
                Ingreso Manual
              </Button>
            </div>

            {/* Manual Input */}
            <div className="space-y-4">
              <div className="flex space-x-4">
                <Input
                  placeholder="Ingrese código de barras manualmente"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleManualSubmit()}
                  disabled={checkInMutation.isPending}
                />
                <Button 
                  onClick={handleManualSubmit}
                  disabled={!manualInput.trim() || checkInMutation.isPending}
                >
                  Confirmar
                </Button>
              </div>

              {/* Instructions for physical scanner */}
              {autoScanEnabled && (
                <div className="bg-slate-50 p-4 rounded-lg border-l-4 border-primary">
                  <div className="flex items-start space-x-3">
                    <Scan className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <h4 className="font-medium text-slate-900 mb-1">Escáner Físico Activo</h4>
                      <p className="text-sm text-slate-600">
                        • Conecta tu escáner de códigos de barras USB o Bluetooth<br/>
                        • Apunta y escanea cualquier código de barras de empleado<br/>
                        • La asistencia se registrará automáticamente sin necesidad de hacer clic
                      </p>
                      {checkInMutation.isPending && (
                        <div className="mt-2 text-sm text-blue-600">
                          🔄 Procesando código escaneado...
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardContent className="p-8">
            <h3 className="text-xl font-semibold text-slate-900 mb-6">Actividad Reciente</h3>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl animate-pulse">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-slate-300 rounded-full"></div>
                      <div>
                        <div className="h-4 bg-slate-300 rounded w-32 mb-2"></div>
                        <div className="h-3 bg-slate-300 rounded w-20"></div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="h-4 bg-slate-300 rounded w-16 mb-2"></div>
                      <div className="h-3 bg-slate-300 rounded w-12"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivity?.length > 0 ? (
                  recentActivity.map((activity: any, index: number) => {
                    const isCheckIn = activity.record.checkInTime && !activity.record.checkOutTime;
                    const time = isCheckIn 
                      ? new Date(activity.record.checkInTime).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
                      : activity.record.checkOutTime 
                        ? new Date(activity.record.checkOutTime).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
                        : "N/A";

                    return (
                      <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            isCheckIn ? "bg-secondary" : "bg-accent"
                          }`}>
                            {isCheckIn ? (
                              <UserCheck className="w-6 h-6 text-white" />
                            ) : (
                              <UserX className="w-6 h-6 text-white" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{activity.employee?.fullName}</p>
                            <p className="text-sm text-slate-500">ID: {activity.employee?.employeeId}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-slate-900">{time}</p>
                          <Badge variant={isCheckIn ? "default" : "destructive"}>
                            {isCheckIn ? "Entrada" : "Salida"}
                          </Badge>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No hay actividad reciente</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
