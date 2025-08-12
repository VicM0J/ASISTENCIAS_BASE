
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Mail, Phone, Calendar, Clock } from "lucide-react";
import { createImageUrl } from "@/lib/utils";
import { Link, useParams } from "wouter";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function EmployeeDetails() {
  const { id } = useParams<{ id: string }>();

  const { data: employee, isLoading } = useQuery({
    queryKey: [`/api/employees/${id}`],
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center items-center py-12">
            <div className="loading-spinner" />
          </div>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Empleado no encontrado
              </h2>
              <p className="text-gray-600 mb-4">
                El empleado solicitado no existe o ha sido eliminado.
              </p>
              <Link href="/employees">
                <Button>Volver a Empleados</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const photoUrl = employee.photo ? 
    createImageUrl(new Uint8Array(employee.photo.data)) : null;

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Link href="/employees">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">
              Detalles del Empleado
            </h1>
          </div>
          <Link href={`/employees/edit/${employee.id}`}>
            <Button>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Employee Info Card */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start space-x-6">
                  {/* Photo */}
                  <div className="flex-shrink-0">
                    {photoUrl ? (
                      <img 
                        src={photoUrl} 
                        alt="Empleado" 
                        className="w-32 h-32 rounded-lg object-cover border-4 border-gray-200"
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-lg bg-gray-200 flex items-center justify-center border-4 border-gray-200">
                        <span className="text-gray-500 text-2xl font-semibold">
                          {employee.fullName[0]}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Basic Info */}
                  <div className="flex-1">
                    <div className="mb-4">
                      <h2 className="text-2xl font-bold text-gray-900 mb-1">
                        {employee.fullName}
                      </h2>
                      <p className="text-lg text-gray-600">
                        {employee.department}
                      </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-semibold text-gray-600">
                          ID del Empleado
                        </label>
                        <p className="text-gray-900 font-medium">
                          {employee.employeeId}
                        </p>
                      </div>

                      <div>
                        <label className="text-sm font-semibold text-gray-600">
                          Estado
                        </label>
                        <div className="mt-1">
                          <Badge 
                            variant={employee.isActive ? "default" : "secondary"}
                            className={employee.isActive ? "bg-green-100 text-green-800" : ""}
                          >
                            {employee.isActive ? "Activo" : "Inactivo"}
                          </Badge>
                        </div>
                      </div>

                      {employee.email && (
                        <div>
                          <label className="text-sm font-semibold text-gray-600">
                            Email
                          </label>
                          <div className="flex items-center mt-1">
                            <Mail className="h-4 w-4 text-gray-400 mr-2" />
                            <p className="text-gray-900">{employee.email}</p>
                          </div>
                        </div>
                      )}

                      {employee.phone && (
                        <div>
                          <label className="text-sm font-semibold text-gray-600">
                            Teléfono
                          </label>
                          <div className="flex items-center mt-1">
                            <Phone className="h-4 w-4 text-gray-400 mr-2" />
                            <p className="text-gray-900">{employee.phone}</p>
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="text-sm font-semibold text-gray-600">
                          Fecha de Registro
                        </label>
                        <div className="flex items-center mt-1">
                          <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                          <p className="text-gray-900">
                            {format(new Date(employee.createdAt), "d 'de' MMMM 'de' yyyy", { locale: es })}
                          </p>
                        </div>
                      </div>

                      {employee.schedule && (
                        <div>
                          <label className="text-sm font-semibold text-gray-600">
                            Horario Laboral
                          </label>
                          <div className="flex items-center mt-1">
                            <Clock className="h-4 w-4 text-gray-400 mr-2" />
                            <p className="text-gray-900">
                              {employee.schedule.name}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Barcode Card */}
          <div>
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Código de Barras
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="mb-3">
                    <div className="text-xs font-mono mb-2">
                      ||||| |||| ||||| |||| |||||
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {employee.barcode || employee.employeeId}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500">
                    Code-128
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Schedule Details */}
            {employee.schedule && (
              <Card className="mt-6">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Detalles del Horario
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-semibold text-gray-600">
                        Nombre del Horario
                      </label>
                      <p className="text-gray-900">{employee.schedule.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-600">
                        Hora de Entrada
                      </label>
                      <p className="text-gray-900">{employee.schedule.entryTime}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-600">
                        Hora de Salida
                      </label>
                      <p className="text-gray-900">{employee.schedule.exitTime}</p>
                    </div>
                    {employee.schedule.description && (
                      <div>
                        <label className="text-sm font-semibold text-gray-600">
                          Descripción
                        </label>
                        <p className="text-gray-900 text-sm">
                          {employee.schedule.description}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
