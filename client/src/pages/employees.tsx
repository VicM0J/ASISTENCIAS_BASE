import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Filter, Search, Eye, Edit } from "lucide-react";
import { createImageUrl, getWeekRange, getMonthRange, getYearRange } from "@/lib/utils";
import { Link } from "wouter";

export default function Employees() {
  const [filterPeriod, setFilterPeriod] = useState("week");
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");

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

  const getDateRange = () => {
    switch (filterPeriod) {
      case "week":
        return getWeekRange();
      case "month":
        return getMonthRange();
      case "year":
        return getYearRange();
      default:
        return getWeekRange();
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 md:mb-0">
            Gestión de Empleados
          </h2>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <Select value={filterPeriod} onValueChange={setFilterPeriod}>
              <SelectTrigger className="w-40" data-testid="period-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Última semana</SelectItem>
                <SelectItem value="month">Este mes</SelectItem>
                <SelectItem value="year">Este año</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-48" data-testid="department-filter">
                <SelectValue placeholder="Todos los departamentos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los departamentos</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button className="tablet-button" data-testid="apply-filters">
              <Filter className="h-4 w-4 mr-2" />
              Filtrar
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar empleado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 tablet-input"
              data-testid="search-employees"
            />
          </div>
        </div>

        <Card className="shadow-sm border border-gray-200 overflow-hidden">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="loading-spinner" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Empleado
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        ID
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Departamento
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Horario
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Estado
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredEmployees.length > 0 ? (
                      filteredEmployees.map((employee: any) => {
                        const photoUrl = employee.photo ? 
                          createImageUrl(new Uint8Array(employee.photo.data)) : null;
                        
                        return (
                          <tr key={employee.id} className="hover:bg-gray-50" data-testid={`employee-row-${employee.id}`}>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-3">
                                {photoUrl ? (
                                  <img 
                                    src={photoUrl} 
                                    alt="Empleado" 
                                    className="w-10 h-10 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-600">
                                    {employee.fullName[0]}
                                  </div>
                                )}
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {employee.fullName}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    {employee.email || "Sin email"}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {employee.employeeId}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {employee.department}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {employee.schedule?.name || "Sin horario"}
                            </td>
                            <td className="px-6 py-4">
                              <Badge 
                                variant={employee.isActive ? "default" : "secondary"}
                                className={employee.isActive ? "bg-green-100 text-green-800" : ""}
                              >
                                {employee.isActive ? "Activo" : "Inactivo"}
                              </Badge>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-primary hover:text-primary/80"
                                  data-testid={`view-employee-${employee.id}`}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  Ver detalles
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-gray-600 hover:text-gray-800"
                                  data-testid={`edit-employee-${employee.id}`}
                                >
                                  <Edit className="h-4 w-4 mr-1" />
                                  Editar
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                          {searchTerm || departmentFilter !== "all" 
                            ? "No se encontraron empleados con los filtros aplicados"
                            : "No hay empleados registrados"
                          }
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Employee Button */}
        <div className="mt-6 flex justify-center">
          <Link href="/add-employee">
            <Button className="tablet-button" data-testid="add-employee-button">
              Añadir Nuevo Empleado
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
