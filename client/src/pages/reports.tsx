import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, FileSpreadsheet, Download, Calendar } from "lucide-react";
import { formatTime, getWeekRange, getMonthRange, getYearRange } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function Reports() {
  const [startDate, setStartDate] = useState(() => getWeekRange().start);
  const [endDate, setEndDate] = useState(() => getWeekRange().end);
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const { data: reportData, isLoading, refetch } = useQuery({
    queryKey: ["/api/reports/attendance", startDate, endDate, departmentFilter],
    enabled: false, // Only fetch when explicitly requested
  });

  const { data: employees } = useQuery({
    queryKey: ["/api/employees"],
  });

  const departments = [...new Set(employees?.map((emp: any) => emp.department) || [])];

  const generateReport = async () => {
    if (!startDate || !endDate) {
      toast({
        title: "Error",
        description: "Por favor selecciona las fechas de inicio y fin.",
        variant: "destructive",
      });
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      toast({
        title: "Error",
        description: "La fecha de inicio no puede ser posterior a la fecha de fin.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      await refetch();
      toast({
        title: "Reporte Generado",
        description: "El reporte se ha generado exitosamente.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo generar el reporte. Intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const exportToExcel = async () => {
    if (!reportData || reportData.length === 0) {
      toast({
        title: "Error",
        description: "No hay datos para exportar. Genera un reporte primero.",
        variant: "destructive",
      });
      return;
    }

    try {
      const params = new URLSearchParams({
        startDate,
        endDate,
        ...(departmentFilter !== "all" && { department: departmentFilter }),
      });

      const response = await fetch(`/api/reports/attendance/excel?${params}`);
      
      if (!response.ok) {
        throw new Error("Failed to export report");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `reporte-asistencias-${startDate}-${endDate}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Exportación Exitosa",
        description: "El archivo Excel se ha descargado correctamente.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo exportar el reporte. Intenta nuevamente.",
        variant: "destructive",
      });
    }
  };

  const setQuickDateRange = (range: string) => {
    let dateRange;
    switch (range) {
      case "week":
        dateRange = getWeekRange();
        break;
      case "month":
        dateRange = getMonthRange();
        break;
      case "year":
        dateRange = getYearRange();
        break;
      default:
        return;
    }
    setStartDate(dateRange.start);
    setEndDate(dateRange.end);
  };

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <Card className="tablet-card shadow-sm border border-gray-200">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Reportes de Asistencias
            </h2>
            
            {/* Report Filters */}
            <div className="space-y-6 mb-8">
              {/* Quick Date Range Buttons */}
              <div className="flex flex-wrap gap-2 mb-4">
                <Button
                  variant="outline"
                  onClick={() => setQuickDateRange("week")}
                  data-testid="quick-week"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Esta Semana
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setQuickDateRange("month")}
                  data-testid="quick-month"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Este Mes
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setQuickDateRange("year")}
                  data-testid="quick-year"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Este Año
                </Button>
              </div>

              <div className="grid lg:grid-cols-3 gap-6">
                <div>
                  <Label htmlFor="start-date" className="text-sm font-medium text-gray-700 mb-2">
                    Fecha de Inicio
                  </Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="tablet-input"
                    data-testid="input-start-date"
                  />
                </div>
                
                <div>
                  <Label htmlFor="end-date" className="text-sm font-medium text-gray-700 mb-2">
                    Fecha de Fin
                  </Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="tablet-input"
                    data-testid="input-end-date"
                  />
                </div>
                
                <div>
                  <Label htmlFor="department" className="text-sm font-medium text-gray-700 mb-2">
                    Departamento
                  </Label>
                  <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                    <SelectTrigger className="tablet-input" data-testid="select-department">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los departamentos</SelectItem>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                <Button
                  onClick={generateReport}
                  disabled={isGenerating || isLoading}
                  className="tablet-button"
                  data-testid="generate-report"
                >
                  <Search className="h-4 w-4 mr-2" />
                  {isGenerating || isLoading ? "Generando..." : "Generar Reporte"}
                </Button>
                <Button
                  onClick={exportToExcel}
                  disabled={!reportData || reportData.length === 0}
                  variant="outline"
                  className="tablet-button bg-accent text-white hover:bg-accent/90"
                  data-testid="export-excel"
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Exportar a Excel
                </Button>
              </div>
            </div>

            {/* Report Preview */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="loading-spinner" />
                </div>
              ) : reportData && reportData.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                          ID Empleado
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                          Nombre
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                          Departamento
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                          Fecha
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                          Entradas
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                          Salidas
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                          Horas Trabajadas
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                          Horas Extra
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                          Firma
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {reportData.map((row: any, index: number) => (
                        <tr key={`${row.employeeId}-${row.date}-${index}`} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {row.employeeId}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {row.fullName}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {row.department}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {new Date(row.date).toLocaleDateString('es-ES')}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {row.checkIns.join(", ") || "--"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {row.checkOuts.join(", ") || "--"}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {row.totalHours.toFixed(1)}h
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {row.overtimeHours.toFixed(1)}h
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-400">
                            _________________
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : reportData ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">
                    No se encontraron datos para el período seleccionado
                  </p>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">
                    Selecciona las fechas y haz clic en "Generar Reporte" para ver los datos
                  </p>
                </div>
              )}
            </div>

            {/* Report Summary */}
            {reportData && reportData.length > 0 && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">
                        {reportData.length}
                      </p>
                      <p className="text-sm text-gray-600">Total Registros</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {reportData.reduce((sum: number, row: any) => sum + row.totalHours, 0).toFixed(1)}h
                      </p>
                      <p className="text-sm text-gray-600">Total Horas</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">
                        {reportData.reduce((sum: number, row: any) => sum + row.overtimeHours, 0).toFixed(1)}h
                      </p>
                      <p className="text-sm text-gray-600">Horas Extra</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-yellow-50 border-yellow-200">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-yellow-600">
                        {(reportData.reduce((sum: number, row: any) => sum + row.totalHours, 0) / reportData.length).toFixed(1)}h
                      </p>
                      <p className="text-sm text-gray-600">Promedio/Día</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
