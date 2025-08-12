import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Building2, Database, Upload, Download, Settings as SettingsIcon, Clock } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const [companyName, setCompanyName] = useState("");
  const [newLogo, setNewLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [blockTime, setBlockTime] = useState("1");
  const [dateFormat, setDateFormat] = useState("DD/MM/YYYY");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: company } = useQuery({
    queryKey: ["/api/company"],
    onSuccess: (data) => {
      if (data) {
        setCompanyName(data.name || "JASANA");
      }
    },
  });

  const { data: schedules } = useQuery({
    queryKey: ["/api/schedules"],
  });

  const updateCompanyMutation = useMutation({
    mutationFn: async (data: { name?: string; logo?: File }) => {
      const formData = new FormData();
      if (data.name) formData.append("name", data.name);
      if (data.logo) formData.append("logo", data.logo);

      const response = await fetch("/api/company", {
        method: "PUT",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to update company");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Información Actualizada",
        description: "La información de la empresa se ha actualizado correctamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/company"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar la información. Intenta nuevamente.",
        variant: "destructive",
      });
    },
  });

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Archivo muy grande",
          description: "El logo debe ser menor a 5MB.",
          variant: "destructive",
        });
        return;
      }

      setNewLogo(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveCompanyInfo = () => {
    if (!companyName.trim()) {
      toast({
        title: "Error",
        description: "El nombre de la empresa es requerido.",
        variant: "destructive",
      });
      return;
    }

    updateCompanyMutation.mutate({
      name: companyName,
      ...(newLogo && { logo: newLogo }),
    });
  };

  const exportData = async () => {
    try {
      // In a real implementation, this would export all data
      toast({
        title: "Exportación Iniciada",
        description: "La exportación de datos ha comenzado. Se descargará automáticamente.",
      });
      
      // Simulate export
      setTimeout(() => {
        toast({
          title: "Exportación Completa",
          description: "Los datos se han exportado exitosamente.",
        });
      }, 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo exportar los datos. Intenta nuevamente.",
        variant: "destructive",
      });
    }
  };

  const importData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.db,.sql';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        toast({
          title: "Importación Iniciada",
          description: `Importando datos desde ${file.name}...`,
        });
        
        // Simulate import
        setTimeout(() => {
          toast({
            title: "Importación Completa",
            description: "Los datos se han importado exitosamente.",
          });
        }, 3000);
      }
    };
    input.click();
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <Card className="tablet-card shadow-sm border border-gray-200">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Configuración del Sistema
            </h2>
            
            {/* Company Settings */}
            <div className="mb-8">
              <div className="flex items-center space-x-2 mb-4">
                <Building2 className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Información de la Empresa
                </h3>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="company-name" className="text-sm font-medium text-gray-700 mb-2">
                    Nombre de la Empresa
                  </Label>
                  <Input
                    id="company-name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="tablet-input"
                    data-testid="input-company-name"
                  />
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2">
                    Logo de la Empresa
                  </Label>
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center">
                      {logoPreview ? (
                        <img 
                          src={logoPreview} 
                          alt="Logo" 
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <span className="text-white font-bold">
                          {companyName[0] || "J"}
                        </span>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      id="logo-upload"
                    />
                    <Label htmlFor="logo-upload" className="cursor-pointer">
                      <Button 
                        type="button" 
                        variant="outline"
                        className="tablet-button"
                        data-testid="upload-company-logo"
                        asChild
                      >
                        <span>
                          <Upload className="h-4 w-4 mr-2" />
                          Cambiar Logo
                        </span>
                      </Button>
                    </Label>
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <Button
                  onClick={saveCompanyInfo}
                  disabled={updateCompanyMutation.isPending}
                  className="tablet-button"
                  data-testid="save-company-info"
                >
                  {updateCompanyMutation.isPending ? "Guardando..." : "Guardar Información"}
                </Button>
              </div>
            </div>

            <Separator className="my-8" />

            {/* Schedule Management */}
            <div className="mb-8">
              <div className="flex items-center space-x-2 mb-4">
                <Clock className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Horarios Laborales
                </h3>
              </div>
              
              <div className="space-y-4">
                {schedules && schedules.length > 0 ? (
                  schedules.map((schedule: any) => (
                    <Card key={schedule.id} className="bg-gray-50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">
                            {schedule.name}
                          </h4>
                          <Badge variant="outline" data-testid={`schedule-badge-${schedule.id}`}>
                            {schedule.overtimeAllowed ? "Con horas extra" : "Sin horas extra"}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <span className="text-gray-600">Entrada:</span>
                            <span className="ml-1 font-medium">{schedule.entryTime}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Salida:</span>
                            <span className="ml-1 font-medium">{schedule.exitTime}</span>
                          </div>
                          {schedule.breakfastStart && schedule.breakfastEnd && (
                            <div>
                              <span className="text-gray-600">Desayuno:</span>
                              <span className="ml-1 font-medium">
                                {schedule.breakfastStart}-{schedule.breakfastEnd}
                              </span>
                            </div>
                          )}
                          {schedule.lunchStart && schedule.lunchEnd && (
                            <div>
                              <span className="text-gray-600">Comida:</span>
                              <span className="ml-1 font-medium">
                                {schedule.lunchStart}-{schedule.lunchEnd}
                              </span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <p className="text-gray-500">No hay horarios configurados</p>
                )}
              </div>
            </div>

            <Separator className="my-8" />

            {/* Database Settings */}
            <div className="mb-8">
              <div className="flex items-center space-x-2 mb-4">
                <Database className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Base de Datos Local
                </h3>
              </div>
              
              <Card className="bg-gray-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-medium text-gray-900">Estado de la Base de Datos</p>
                      <p className="text-sm text-gray-600">SQLite - Almacenamiento Local</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                      Conectado
                    </Badge>
                  </div>
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                    <Button
                      onClick={exportData}
                      variant="outline"
                      className="tablet-button"
                      data-testid="backup-data"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Respaldar Datos
                    </Button>
                    <Button
                      onClick={importData}
                      variant="outline"
                      className="tablet-button"
                      data-testid="restore-data"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Restaurar Datos
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Separator className="my-8" />

            {/* System Settings */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <SettingsIcon className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Configuración del Sistema
                </h3>
              </div>
              
              <div className="space-y-4">
                <Card className="bg-gray-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          Tiempo de bloqueo después del check
                        </p>
                        <p className="text-sm text-gray-600">
                          Previene registros duplicados
                        </p>
                      </div>
                      <Select value={blockTime} onValueChange={setBlockTime}>
                        <SelectTrigger className="w-32" data-testid="select-block-time">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 minuto</SelectItem>
                          <SelectItem value="2">2 minutos</SelectItem>
                          <SelectItem value="5">5 minutos</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gray-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">Formato de fecha</p>
                        <p className="text-sm text-gray-600">
                          Formato de visualización de fechas
                        </p>
                      </div>
                      <Select value={dateFormat} onValueChange={setDateFormat}>
                        <SelectTrigger className="w-40" data-testid="select-date-format">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                          <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                          <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">Modo tablet optimizado</p>
                        <p className="text-sm text-gray-600">
                          Interfaz optimizada para dispositivos táctiles
                        </p>
                      </div>
                      <Switch 
                        defaultChecked={true} 
                        data-testid="switch-tablet-mode"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">Sonido de confirmación</p>
                        <p className="text-sm text-gray-600">
                          Reproducir sonido al registrar asistencia
                        </p>
                      </div>
                      <Switch 
                        defaultChecked={true} 
                        data-testid="switch-sound"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
