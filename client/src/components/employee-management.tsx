import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, Edit, Search, UserPlus } from "lucide-react";

interface EmployeeManagementProps {
  onViewDetails: (employeeId: string) => void;
}

export default function EmployeeManagement({ onViewDetails }: EmployeeManagementProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [periodFilter, setPeriodFilter] = useState("week");

  const { data: employees, isLoading } = useQuery({
    queryKey: ["/api/employees"],
  });

  const filteredEmployees = (employees && Array.isArray(employees)) ? employees.filter((employee: any) => {
    const matchesSearch = employee.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = !departmentFilter || employee.department === departmentFilter;
    return matchesSearch && matchesDepartment;
  }) : [];

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
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-navy">Gestión de Empleados</h2>
            <p className="text-slate-600">Administra empleados y consulta historiales de asistencia</p>
          </div>
          <Button className="bg-turquoise hover:bg-cyan-600">
            <UserPlus className="mr-2 h-4 w-4" />
            Añadir Empleado
          </Button>
        </div>
      </div>

      <div className="p-8">
        {/* Filters */}
        <Card className="shadow-lg mb-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-navy mb-4">Filtros de Búsqueda</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Buscar por Nombre/ID</label>
                <Input
                  type="text"
                  placeholder="Nombre o ID del empleado"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Departamento</label>
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
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
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Período</label>
                <Select value={periodFilter} onValueChange={setPeriodFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">Última semana (Vie-Jue)</SelectItem>
                    <SelectItem value="month">Este mes</SelectItem>
                    <SelectItem value="year">Este año</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button className="w-full bg-navy hover:bg-slate-700">
                  <Search className="mr-2 h-4 w-4" />
                  Buscar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Employee List */}
        <Card className="shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-navy">Lista de Empleados</h3>
          </div>
          
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="text-slate-500">Cargando empleados...</div>
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-slate-500">No se encontraron empleados</div>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {filteredEmployees.map((employee: any) => (
                <div key={employee.id} className="px-6 py-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {employee.photo ? (
                        <img 
                          src={employee.photo} 
                          alt={`Foto de ${employee.fullName}`}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center">
                          <span className="text-slate-400 text-lg">👤</span>
                        </div>
                      )}
                      <div>
                        <h4 className="font-semibold text-navy">{employee.fullName}</h4>
                        <p className="text-sm text-slate-600">
                          ID: <span>{employee.id}</span> • <span>{employee.department}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm text-slate-600">Horas esta semana</p>
                        <p className="font-semibold text-navy">--h</p>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => onViewDetails(employee.id)}
                          className="bg-turquoise hover:bg-cyan-600 text-sm"
                        >
                          <Eye className="mr-1 h-4 w-4" />
                          Ver Detalles
                        </Button>
                        <Button
                          variant="outline"
                          className="text-sm"
                        >
                          <Edit className="mr-1 h-4 w-4" />
                          Editar
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
