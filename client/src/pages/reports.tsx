import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { exportToExcel } from "@/lib/excel-utils";
import { Download, FileSpreadsheet, Eye } from "lucide-react";

export default function Reports() {
  const [period, setPeriod] = useState("week");
  const [department, setDepartment] = useState("all");
  const [format, setFormat] = useState("xlsx");
  const [includeOvertime, setIncludeOvertime] = useState(true);
  const [includeBreaks, setIncludeBreaks] = useState(true);
  const [includeSignature, setIncludeSignature] = useState(false);
  const { toast } = useToast();

  const { data: employees } = useQuery({
    queryKey: ["/api/employees"],
  });

  const departments = [...new Set(employees?.map((emp: any) => emp.department) || [])];

  const generateReportMutation = useMutation({
    mutationFn: async () => {
      const startDate = getStartDate(period);
      const endDate = new Date().toISOString().split('T')[0];
      
      const response = await fetch("/api/reports/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          format,
          period,
          department: department === "all" ? undefined : department,
          startDate,
          endDate,
          includeOvertime,
          includeBreaks,
          includeSignature,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to generate report");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      if (format === "xlsx") {
        exportToExcel(data.data, data.filename);
        toast({
          title: "Reporte generado",
          description: "El archivo Excel se ha descargado exitosamente",
        });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo generar el reporte",
        variant: "destructive",
      });
    },
  });

  const getStartDate = (period: string) => {
    const today = new Date();
    switch (period) {
      case "week":
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        return weekAgo.toISOString().split('T')[0];
      case "month":
        return new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      case "year":
        return new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
      default:
        return today.toISOString().split('T')[0];
    }
  };

  const recentReports = [
    {
      name: "Asistencias_Enero_2024.xlsx",
      period: "Enero 2024",
      department: "Todos",
      date: "15/01/2024 14:30",
    },
    {
      name: "Asistencias_Semanal_S03.xlsx",
      period: "Semana 3",
      department: "Ventas",
      date: "12/01/2024 09:15",
    },
  ];

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Reportes Excel</h2>
          <p className="text-slate-600">Genera reportes detallados de asistencias en formato Excel</p>
        </div>

        {/* Report Configuration */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <h3 className="text-xl font-semibold text-slate-900 mb-6">Configuración de Reporte</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <Label>Período</Label>
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">Última semana</SelectItem>
                    <SelectItem value="month">Mes actual</SelectItem>
                    <SelectItem value="prev-month">Mes anterior</SelectItem>
                    <SelectItem value="year">Año actual</SelectItem>
                    <SelectItem value="custom">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Departamento</Label>
                <Select value={department} onValueChange={setDepartment}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los departamentos</SelectItem>
                    {departments.map((dept: string) => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Formato</Label>
                <Select value={format} onValueChange={setFormat}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                    <SelectItem value="csv">CSV (.csv)</SelectItem>
                    <SelectItem value="pdf">PDF (.pdf)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="overtime"
                    checked={includeOvertime}
                    onCheckedChange={setIncludeOvertime}
                  />
                  <Label htmlFor="overtime" className="text-sm text-slate-700">
                    Incluir horas extra
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="breaks"
                    checked={includeBreaks}
                    onCheckedChange={setIncludeBreaks}
                  />
                  <Label htmlFor="breaks" className="text-sm text-slate-700">
                    Incluir descansos
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="signature"
                    checked={includeSignature}
                    onCheckedChange={setIncludeSignature}
                  />
                  <Label htmlFor="signature" className="text-sm text-slate-700">
                    Espacio para firma
                  </Label>
                </div>
              </div>
              <Button 
                onClick={() => generateReportMutation.mutate()}
                disabled={generateReportMutation.isPending}
                className="bg-secondary hover:bg-emerald-700"
              >
                <Download className="w-4 h-4 mr-2" />
                {generateReportMutation.isPending ? "Generando..." : "Generar Reporte"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Reports */}
        <Card>
          <CardContent className="p-0">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-xl font-semibold text-slate-900">Reportes Recientes</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Nombre del Reporte</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Período</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Departamento</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Fecha de Generación</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {recentReports.map((report, index) => (
                    <tr key={index} className="hover:bg-slate-50 transition-colors duration-200">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <FileSpreadsheet className="w-5 h-5 text-secondary" />
                          <span className="font-medium text-slate-900">{report.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{report.period}</td>
                      <td className="px-6 py-4 text-slate-600">{report.department}</td>
                      <td className="px-6 py-4 text-slate-600">{report.date}</td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <Button size="sm">
                            <Download className="w-4 h-4 mr-1" />
                            Descargar
                          </Button>
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4 mr-1" />
                            Ver
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
