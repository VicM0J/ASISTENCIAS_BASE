import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Camera, Upload } from "lucide-react";
import { insertEmployeeSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { generateEmployeeId } from "@/lib/utils";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

type FormData = {
  fullName: string;
  employeeId: string;
  department: string;
  scheduleId: string;
  email?: string;
  phone?: string;
  barcode: string;
};

export default function AddEmployee() {
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  const { data: schedules = [] } = useQuery({
    queryKey: ["/api/schedules"],
  });

  const form = useForm<FormData>({
    resolver: zodResolver(insertEmployeeSchema.omit({ photo: true }).extend({
      scheduleId: z.string().optional()
    })),
    defaultValues: {
      fullName: "",
      employeeId: "",
      department: "",
      scheduleId: "",
      email: "",
      phone: "",
      barcode: "",
    },
  });

  const createEmployeeMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value) {
          // Convert scheduleId to number
          if (key === 'scheduleId' && value) {
            formData.append(key, value.toString());
          } else {
            formData.append(key, value.toString());
          }
        }
      });
      
      if (photo) {
        formData.append("photo", photo);
      }

      const response = await fetch("/api/employees", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to create employee");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Empleado Creado",
        description: "El empleado ha sido registrado exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      navigate("/employees");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo crear el empleado. Intenta nuevamente.",
        variant: "destructive",
      });
    },
  });

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Archivo muy grande",
          description: "La imagen debe ser menor a 5MB.",
          variant: "destructive",
        });
        return;
      }

      setPhoto(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateBarcode = () => {
    const employeeId = form.getValues("employeeId");
    if (employeeId) {
      form.setValue("barcode", employeeId);
    }
  };

  const generateId = () => {
    const fullName = form.getValues("fullName");
    if (fullName) {
      const generatedId = generateEmployeeId(fullName);
      form.setValue("employeeId", generatedId);
      form.setValue("barcode", generatedId);
    }
  };

  const onSubmit = (data: FormData) => {
    if (!data.scheduleId) {
      toast({
        title: "Error",
        description: "Por favor selecciona un horario laboral.",
        variant: "destructive",
      });
      return;
    }

    createEmployeeMutation.mutate({
      ...data,
      scheduleId: parseInt(data.scheduleId),
    } as any);
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <Card className="tablet-card shadow-sm border border-gray-200">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Añadir Nuevo Empleado
            </h2>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Photo Upload */}
                <div className="flex justify-center">
                  <div className="text-center">
                    <div className="w-32 h-32 bg-gray-100 rounded-full border-4 border-dashed border-gray-300 flex items-center justify-center mx-auto mb-4 overflow-hidden">
                      {photoPreview ? (
                        <img 
                          src={photoPreview} 
                          alt="Preview" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Camera className="h-12 w-12 text-gray-400" />
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      id="photo-upload"
                    />
                    <Label htmlFor="photo-upload" className="cursor-pointer">
                      <Button 
                        type="button" 
                        className="tablet-button"
                        data-testid="upload-photo"
                        asChild
                      >
                        <span>
                          <Upload className="h-4 w-4 mr-2" />
                          Subir Fotografía
                        </span>
                      </Button>
                    </Label>
                    <p className="text-sm text-gray-600 mt-2">JPG, PNG hasta 5MB</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre Completo *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Victor Manuel Montaño Juanpedro" 
                            className="tablet-input"
                            data-testid="input-fullname"
                            {...field}
                            onBlur={(e) => {
                              field.onBlur();
                              if (e.target.value && !form.getValues("employeeId")) {
                                generateId();
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="employeeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ID del Empleado *</FormLabel>
                        <div className="flex space-x-2">
                          <FormControl>
                            <Input 
                              placeholder="MOJV040815" 
                              className="tablet-input"
                              data-testid="input-employee-id"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e.target.value.toUpperCase());
                                form.setValue("barcode", e.target.value.toUpperCase());
                              }}
                            />
                          </FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={generateId}
                            data-testid="generate-id"
                          >
                            Generar
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Área o Departamento *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="tablet-input" data-testid="select-department">
                              <SelectValue placeholder="Seleccionar departamento" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Sistemas">Sistemas</SelectItem>
                            <SelectItem value="Recursos Humanos">Recursos Humanos</SelectItem>
                            <SelectItem value="Contabilidad">Contabilidad</SelectItem>
                            <SelectItem value="Ventas">Ventas</SelectItem>
                            <SelectItem value="Marketing">Marketing</SelectItem>
                            <SelectItem value="Operaciones">Operaciones</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="scheduleId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Horario Laboral *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="tablet-input" data-testid="select-schedule">
                              <SelectValue placeholder="Seleccionar horario" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {schedules?.map((schedule: any) => (
                              <SelectItem key={schedule.id} value={schedule.id.toString()}>
                                {schedule.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input 
                            type="email"
                            placeholder="victor.montano@jasana.com" 
                            className="tablet-input"
                            data-testid="input-email"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono</FormLabel>
                        <FormControl>
                          <Input 
                            type="tel"
                            placeholder="+52 555 123 4567" 
                            className="tablet-input"
                            data-testid="input-phone"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Barcode Section */}
                <div className="pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Código de Barras
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-2">
                          Se generará automáticamente basado en el ID del empleado
                        </p>
                        <div className="barcode-container">
                          <div className="text-center">
                            <div className="text-xs font-mono mb-1">
                              ||||| |||| ||||| |||| |||||
                            </div>
                            <div className="text-xs">
                              {form.watch("barcode") || "CÓDIGO"}
                            </div>
                          </div>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={generateBarcode}
                        disabled={!form.watch("employeeId")}
                        data-testid="generate-barcode"
                      >
                        Generar Código
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/employees")}
                    className="tablet-button"
                    data-testid="cancel-button"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createEmployeeMutation.isPending}
                    className="tablet-button"
                    data-testid="save-employee"
                  >
                    {createEmployeeMutation.isPending ? "Guardando..." : "Guardar Empleado"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
