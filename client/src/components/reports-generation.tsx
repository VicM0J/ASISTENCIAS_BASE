import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileSpreadsheet, Download, Calendar, TrendingUp } from "lucide-react";
import { exportToExcel } from "@/lib/excel-export";

export default function ReportsGeneration() {
  const [reportStartDate, setReportStartDate] = useState("");
  const [reportEndDate, setReportEndDate] = useState("");
  const [reportDepartment, setReportDepartment] = useState("");
  const [reportType, setReportType] = useState("summary");
  const [includePhotos, setIncludePhotos] = useState(true);
  const [includeSignature, setIncludeSignature] = useState(true);
  const [includeCharts, setIncludeCharts] = useState(false);

  const setQuickPeriod = (period: string) => {
    const today = new Date();
    const endDate = today.toISOString().split('T')[0];
    let startDate = "";

    switch (period) {
      case "week":
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - 7);
        startDate = weekStart.toISOString().split('T')[0];
        break;
      case "month":
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        startDate = monthStart.toISOString().split('T')[0];
        break;
      case "year":
        const yearStart = new Date(today.getFullYear(), 0, 1);
        startDate = yearStart.toISOString().split('T')[0];
        break;
    }

    setReportStartDate(startDate);
    setReportEndDate(endDate);
  };

  const handleGenerateReport = async () => {
    const reportData = {
      startDate: reportStartDate,
      endDate: reportEndDate,
      department: reportDepartment,
      type: reportType as "summary" | "detailed" | "overtime",
      includePhotos,
      includeSignature,
      includeCharts,
    };

    try {
      await exportToExcel(reportData);
    } catch (error) {
      console.error("Error generating report:", error);
    }
  };

  const useTemplate = (template: string) => {
    switch (template) {
      case "weekly":
        setQuickPeriod("week");
        setReportType("summary");
        break;
      case "monthly":
        setQuickPeriod("month");
        setReportType("detailed");
        break;
      case "payroll":
        setQuickPeriod("month");
        setReportType("overtime");
        setIncludeSignature(true);
        break;
    }
  };

  const departments = [
    { value: "sistemas", label: "Sistemas" },
    { value: "recursos-humanos", label: "Recursos Humanos" },
    { value: "ventas", label: "Ventas" },
    { value: "administracion", label: "Administración" },
    { value: "marketing", label: "Marketing" },
    { value: "finanzas", label: "Finanzas" },
  ];

  return (
    <div>
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-8 py-4">
        <div>
          <h2 className="text-2xl font-bold text-navy">Reportes en Excel</h2>
          <p className="text-slate-600">Genera reportes detallados de asistencias</p>
        </div>
      </div>

      <div className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Report Configuration */}
          <Card className="shadow-lg">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-navy mb-6">Configuración del Reporte</h3>
              
              <div className="space-y-6">
                {/* Date Range */}
                <div>
                  <Label className="text-sm font-medium text-slate-700 mb-3">Período del Reporte</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-slate-600 mb-1">Fecha Inicio</Label>
                      <Input
                        type="date"
                        value={reportStartDate}
                        onChange={(e) => setReportStartDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-600 mb-1">Fecha Fin</Label>
                      <Input
                        type="date"
                        value={reportEndDate}
                        onChange={(e) => setReportEndDate(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  {/* Quick Periods */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setQuickPeriod("week")}
                    >
                      Esta semana
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setQuickPeriod("month")}
                    >
                      Este mes
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setQuickPeriod("year")}
                    >
                      Este año
                    </Button>
                  </div>
                </div>

                {/* Department Filter */}
                <div>
                  <Label className="text-sm font-medium text-slate-700 mb-2">Filtrar por Departamento</Label>
                  <Select value={reportDepartment} onValueChange={setReportDepartment}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos los departamentos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos los departamentos</SelectItem>
                      {departments.map((dept) => (
                        <SelectItem key={dept.value} value={dept.value}>
                          {dept.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Report Type */}
                <div>
                  <Label className="text-sm font-medium text-slate-700 mb-2">Tipo de Reporte</Label>
                  <RadioGroup value={reportType} onValueChange={setReportType}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="summary" id="summary" />
                      <Label htmlFor="summary">Resumen de Asistencias</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="detailed" id="detailed" />
                      <Label htmlFor="detailed">Reporte Detallado</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="overtime" id="overtime" />
                      <Label htmlFor="overtime">Solo Horas Extra</Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Additional Options */}
                <div>
                  <Label className="text-sm font-medium text-slate-700 mb-3">Opciones Adicionales</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="include-photos"
                        checked={includePhotos}
                        onCheckedChange={(checked) => setIncludePhotos(checked === true)}
                      />
                      <Label htmlFor="include-photos">Incluir fotografías</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="include-signature"
                        checked={includeSignature}
                        onCheckedChange={(checked) => setIncludeSignature(checked === true)}
                      />
                      <Label htmlFor="include-signature">Espacio para firma</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="include-charts"
                        checked={includeCharts}
                        onCheckedChange={(checked) => setIncludeCharts(checked === true)}
                      />
                      <Label htmlFor="include-charts">Incluir gráficos</Label>
                    </div>
                  </div>
                </div>

                {/* Generate Button */}
                <Button 
                  onClick={handleGenerateReport}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Generar Reporte Excel
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Preview and Templates */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card className="shadow-lg">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-navy mb-4">Estadísticas del Período</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-slate-50 rounded-lg">
                    <div className="text-2xl font-bold text-navy">0</div>
                    <div className="text-sm text-slate-600">Empleados</div>
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-lg">
                    <div className="text-2xl font-bold text-turquoise">0</div>
                    <div className="text-sm text-slate-600">Check-ins</div>
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">0h</div>
                    <div className="text-sm text-slate-600">Promedio diario</div>
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">0h</div>
                    <div className="text-sm text-slate-600">Horas extra</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Report Templates */}
            <Card className="shadow-lg">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-navy mb-4">Plantillas Predefinidas</h3>
                
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    onClick={() => useTemplate("weekly")}
                  >
                    <div className="text-left">
                      <div className="font-medium text-navy">Reporte Semanal</div>
                      <div className="text-sm text-slate-600">Asistencias de la semana laboral actual</div>
                    </div>
                    <Calendar className="h-4 w-4 text-slate-400" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    onClick={() => useTemplate("monthly")}
                  >
                    <div className="text-left">
                      <div className="font-medium text-navy">Reporte Mensual</div>
                      <div className="text-sm text-slate-600">Resumen completo del mes actual</div>
                    </div>
                    <TrendingUp className="h-4 w-4 text-slate-400" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    onClick={() => useTemplate("payroll")}
                  >
                    <div className="text-left">
                      <div className="font-medium text-navy">Reporte de Nómina</div>
                      <div className="text-sm text-slate-600">Formato especial para cálculo de nómina</div>
                    </div>
                    <FileSpreadsheet className="h-4 w-4 text-slate-400" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Reports */}
            <Card className="shadow-lg">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-navy mb-4">Reportes Recientes</h3>
                
                <div className="text-center py-8 text-slate-500">
                  No hay reportes generados recientemente
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
