import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Filter, Search } from "lucide-react";

export default function Employees() {
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("week");

  const { data: employees, isLoading } = useQuery({
    queryKey: ["/api/employees"],
  });

  const filteredEmployees = employees?.filter((employee: any) => {
    const matchesSearch = employee.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = departmentFilter === "all" || employee.department === departmentFilter;
    return matchesSearch && matchesDepartment;
  }) || [];

  const departments = [...new Set(employees?.map((emp: any) => emp.department) || [])];

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Gestión de Empleados</h2>
          <p className="text-slate-600">Administra empleados y consulta historial de asistencias</p>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar empleado..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={periodFilter} onValueChange={setPeriodFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Última semana</SelectItem>
                  <SelectItem value="month">Por mes</SelectItem>
                  <SelectItem value="year">Por año</SelectItem>
                </SelectContent>
              </Select>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los departamentos</SelectItem>
                  {departments.map((dept: string) => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button>
                <Filter className="w-4 h-4 mr-2" />
                Filtrar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Employee List */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Empleado</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">ID</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Departamento</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Horario</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Estado</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {isLoading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-slate-300 rounded-full"></div>
                            <div className="h-4 bg-slate-300 rounded w-32"></div>
                          </div>
                        </td>
                        <td className="px-6 py-4"><div className="h-4 bg-slate-300 rounded w-16"></div></td>
                        <td className="px-6 py-4"><div className="h-4 bg-slate-300 rounded w-24"></div></td>
                        <td className="px-6 py-4"><div className="h-4 bg-slate-300 rounded w-20"></div></td>
                        <td className="px-6 py-4"><div className="h-6 bg-slate-300 rounded w-16"></div></td>
                        <td className="px-6 py-4"><div className="h-8 bg-slate-300 rounded w-20"></div></td>
                      </tr>
                    ))
                  ) : filteredEmployees.length > 0 ? (
                    filteredEmployees.map((employee: any) => (
                      <tr key={employee.id} className="hover:bg-slate-50 transition-colors duration-200">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={employee.photoUrl} alt={employee.fullName} />
                              <AvatarFallback>
                                {employee.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-slate-900">{employee.fullName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600">{employee.employeeId}</td>
                        <td className="px-6 py-4 text-slate-600">{employee.department}</td>
                        <td className="px-6 py-4 text-slate-600">
                          {employee.workScheduleId ? "Asignado" : "Sin asignar"}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={employee.isActive ? "default" : "destructive"}>
                            {employee.isActive ? "Activo" : "Inactivo"}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <Button size="sm">
                            Ver Detalles
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <Users className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                        <p className="text-slate-500">No se encontraron empleados</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
