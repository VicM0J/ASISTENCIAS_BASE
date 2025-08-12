import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import CredentialPreview from "@/components/credential-preview";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Palette, Download, Eye } from "lucide-react";

export default function Credentials() {
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedColor, setSelectedColor] = useState("#2563EB");
  const [selectedFont, setSelectedFont] = useState("Inter");
  const { toast } = useToast();

  const { data: employees } = useQuery({
    queryKey: ["/api/employees"],
  });

  const { data: credentialSettings } = useQuery({
    queryKey: ["/api/credential-settings"],
  });

  const employee = employees?.find((emp: any) => emp.id === selectedEmployee);

  const colors = [
    { name: "Azul", value: "#2563EB" },
    { name: "Verde", value: "#059669" },
    { name: "Rojo", value: "#DC2626" },
    { name: "Púrpura", value: "#7C3AED" },
    { name: "Negro", value: "#1F2937" },
  ];

  const fonts = [
    "Inter",
    "Arial",
    "Helvetica",
    "Roboto",
    "Open Sans",
  ];

  const generateCredentialMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/credentials/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: selectedEmployee,
          color: selectedColor,
          font: selectedFont,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to generate credential");
      }
      
      return response.blob();
    },
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `credencial_${employee?.employeeId || 'empleado'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Credencial generada",
        description: "La credencial se ha descargado exitosamente",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo generar la credencial",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Generador de Credenciales</h2>
          <p className="text-slate-600">Genera credenciales personalizadas para empleados</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Configuration Panel */}
          <Card>
            <CardContent className="p-8">
              <h3 className="text-xl font-semibold text-slate-900 mb-6">Configuración de Credencial</h3>
              
              <div className="space-y-6">
                <div>
                  <Label>Empleado</Label>
                  <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar empleado" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees?.map((emp: any) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.fullName} - {emp.employeeId}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="block text-sm font-semibold text-slate-900 mb-2">Color Principal</Label>
                  <div className="flex space-x-3">
                    {colors.map((color) => (
                      <button
                        key={color.value}
                        className={`w-12 h-12 rounded-lg border-2 ${
                          selectedColor === color.value ? 'border-slate-900' : 'border-slate-300'
                        }`}
                        style={{ backgroundColor: color.value }}
                        onClick={() => setSelectedColor(color.value)}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Logo de la Empresa</Label>
                  <div className="border border-slate-300 rounded-xl p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                        <Palette className="w-6 h-6 text-slate-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">
                          {credentialSettings?.companyName || "TimeCheck Pro"}
                        </p>
                        <p className="text-sm text-slate-500">Logo predeterminado</p>
                      </div>
                      <Button variant="outline" size="sm">
                        Cambiar
                      </Button>
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Fuente</Label>
                  <Select value={selectedFont} onValueChange={setSelectedFont}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fonts.map((font) => (
                        <SelectItem key={font} value={font}>
                          {font}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end space-x-4 pt-6">
                  <Button variant="outline">
                    <Eye className="w-4 h-4 mr-2" />
                    Vista Previa
                  </Button>
                  <Button 
                    onClick={() => generateCredentialMutation.mutate()}
                    disabled={!selectedEmployee || generateCredentialMutation.isPending}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {generateCredentialMutation.isPending ? "Generando..." : "Generar Credencial"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preview Panel */}
          <Card>
            <CardContent className="p-8">
              <h3 className="text-xl font-semibold text-slate-900 mb-6">Vista Previa</h3>
              
              <CredentialPreview
                employee={employee}
                color={selectedColor}
                font={selectedFont}
                companyName={credentialSettings?.companyName || "TimeCheck Pro"}
              />
              
              <div className="mt-6 text-center text-sm text-slate-600">
                <p>Dimensiones: 85mm × 54mm</p>
                <p>Resolución: 300 DPI</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
