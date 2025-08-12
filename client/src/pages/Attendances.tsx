
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Clock, CheckCircle, XCircle, Filter } from "lucide-react";
import { formatTime, createImageUrl } from "@/lib/utils";

export default function Attendances() {
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [filterType, setFilterType] = useState("day");
  const [departmentFilter, setDepartmentFilter] = useState("all");

  // Calculate date range based on filter type
  const getDateRange = () => {
    const selected = new Date(selectedDate);
    
    switch (filterType) {
      case "week":
        const startOfWeek = new Date(selected);
        startOfWeek.setDate(selected.getDate() - selected.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        return {
          start: startOfWeek.toISOString().split('T')[0],
          end: endOfWeek.toISOString().split('T')[0]
        };
      case "month":
        const startOfMonth = new Date(selected.getFullYear(), selected.getMonth(), 1);
        const endOfMonth = new Date(selected.getFullYear(), selected.getMonth() + 1, 0);
        return {
          start: startOfMonth.toISOString().split('T')[0],
          end: endOfMonth.toISOString().split('T')[0]
        };
      case "previous":
        const previousDay = new Date(selected);
        previousDay.setDate(selected.getDate() - 1);
        return {
          start: previousDay.toISOString().split('T')[0],
          end: previousDay.toISOString().split('T')[0]
        };
      default: // day
        return {
          start: selectedDate,
          end: selectedDate
        };
    }
  };

  const dateRange = getDateRange();

  const { data: attendances, isLoading } = useQuery({
    queryKey: ["/api/attendances", dateRange.start, dateRange.end, departmentFilter],
  });

  const { data: employees } = useQuery({
    queryKey: ["/api/employees"],
  });

  const departments = [...new Set(employees?.map((emp: any) => emp.department) || [])];

  // Group attendances by date and employee
  const groupedAttendances = attendances?.reduce((acc: any, attendance: any) => {
    const date = attendance.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(attendance);
    return acc;
  }, {}) || {};

  const sortedDates = Object.keys(groupedAttendances).sort().reverse();

  const getStatusBadge = (attendance: any) => {
    if (attendance.checkIn && attendance.checkOut) {
      return <Badge className="bg-green-100 text-green-800">Completo</Badge>;
    } else if (attendance.checkIn) {
      return <Badge className="bg-yellow-100 text-yellow-800">En progreso</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800">Sin registro</Badge>;
    }
  };

  const getFilterLabel = () => {
    switch (filterType) {
      case "week":
        return `Semana del ${new Date(dateRange.start).toLocaleDateString('es-ES')} al ${new Date(dateRange.end).toLocaleDateString('es-ES')}`;
      case "month":
        return `Mes de ${new Date(selectedDate).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`;
      case "previous":
        return `Día anterior: ${new Date(dateRange.start).toLocaleDateString('es-ES')}`;
      default:
        return `Día: ${new Date(selectedDate).toLocaleDateString('es-ES')}`;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <Card className="tablet-card shadow-sm border border-gray-200">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Users className="h-6 w-6 mr-2" />
              Asistencias Diarias
            </h2>
            
            {/* Filters */}
            <div className="grid lg:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <div>
                <Label htmlFor="filter-type" className="text-sm font-medium text-gray-700 mb-2">
                  Tipo de Filtro
                </Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="tablet-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Día actual</SelectItem>
                    <SelectItem value="previous">Día anterior</SelectItem>
                    <SelectItem value="week">Semana</SelectItem>
                    <SelectItem value="month">Mes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="selected-date" className="text-sm font-medium text-gray-700 mb-2">
                  Fecha de Referencia
                </Label>
                <Input
                  id="selected-date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="tablet-input"
                />
              </div>

              <div>
                <Label htmlFor="department-filter" className="text-sm font-medium text-gray-700 mb-2">
                  Departamento
                </Label>
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger className="tablet-input">
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

              <div className="flex items-end">
                <div className="text-sm">
                  <p className="font-medium text-gray-700">Período Seleccionado:</p>
                  <p className="text-gray-600">{getFilterLabel()}</p>
                </div>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <Calendar className="h-8 w-8 text-blue-600" />
                    <div className="ml-3">
                      <p className="text-2xl font-bold text-blue-600">
                        {sortedDates.length}
                      </p>
                      <p className="text-sm text-gray-600">Días con registros</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                    <div className="ml-3">
                      <p className="text-2xl font-bold text-green-600">
                        {attendances?.filter((att: any) => att.checkIn && att.checkOut).length || 0}
                      </p>
                      <p className="text-sm text-gray-600">Asistencias completas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-yellow-50 border-yellow-200">
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <Clock className="h-8 w-8 text-yellow-600" />
                    <div className="ml-3">
                      <p className="text-2xl font-bold text-yellow-600">
                        {attendances?.filter((att: any) => att.checkIn && !att.checkOut).length || 0}
                      </p>
                      <p className="text-sm text-gray-600">En progreso</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-50 border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-gray-600" />
                    <div className="ml-3">
                      <p className="text-2xl font-bold text-gray-600">
                        {attendances?.length || 0}
                      </p>
                      <p className="text-sm text-gray-600">Total registros</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Attendance Records */}
            <div className="space-y-6">
              {sortedDates.length > 0 ? (
                sortedDates.map((date) => (
                  <Card key={date} className="border border-gray-200">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Calendar className="h-5 w-5 mr-2" />
                        {new Date(date).toLocaleDateString('es-ES', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                        <Badge className="ml-2 bg-blue-100 text-blue-800">
                          {groupedAttendances[date].length} registros
                        </Badge>
                      </h3>
                      
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Empleado</th>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Departamento</th>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Entrada</th>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Salida</th>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Horas</th>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Estado</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {groupedAttendances[date].map((attendance: any) => {
                              const photoUrl = attendance.employee.photo ? 
                                createImageUrl(new Uint8Array(attendance.employee.photo.data)) : null;
                              
                              return (
                                <tr key={attendance.id} className="hover:bg-gray-50">
                                  <td className="px-4 py-3">
                                    <div className="flex items-center">
                                      {photoUrl ? (
                                        <img 
                                          src={photoUrl} 
                                          alt="Empleado" 
                                          className="w-10 h-10 rounded-full object-cover mr-3"
                                        />
                                      ) : (
                                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-600 mr-3">
                                          {attendance.employee.fullName[0]}
                                        </div>
                                      )}
                                      <div>
                                        <p className="font-medium text-gray-900">
                                          {attendance.employee.fullName}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                          ID: {attendance.employee.employeeId}
                                        </p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-600">
                                    {attendance.employee.department}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-900">
                                    {attendance.checkIn ? formatTime(attendance.checkIn) : '--'}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-900">
                                    {attendance.checkOut ? formatTime(attendance.checkOut) : '--'}
                                  </td>
                                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                    {attendance.totalHours ? `${attendance.totalHours.toFixed(1)}h` : '--'}
                                  </td>
                                  <td className="px-4 py-3">
                                    {getStatusBadge(attendance)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="border border-gray-200">
                  <CardContent className="p-12">
                    <div className="text-center">
                      <XCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-lg font-medium text-gray-900 mb-2">
                        No hay registros de asistencias
                      </p>
                      <p className="text-gray-600">
                        No se encontraron registros para el período seleccionado.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
