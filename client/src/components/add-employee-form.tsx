import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Camera, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const addEmployeeSchema = z.object({
  id: z.string().min(1, "ID del empleado es requerido"),
  fullName: z.string().min(1, "Nombre completo es requerido"),
  department: z.string().min(1, "Departamento es requerido"),
  schedule: z.string().min(1, "Horario es requerido"),
  barcode: z.string().optional(),
});

type AddEmployeeFormData = z.infer<typeof addEmployeeSchema>;

interface AddEmployeeFormProps {
  onSuccess: () => void;
}

export default function AddEmployeeForm({ onSuccess }: AddEmployeeFormProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<AddEmployeeFormData>({
    resolver: zodResolver(addEmployeeSchema),
    defaultValues: {
      id: "",
      fullName: "",
      department: "",
      schedule: "",
      barcode: "",
    },
  });

  const { data: schedules } = useQuery({
    queryKey: ["/api/schedules"],
  });

  const createEmployeeMutation = useMutation({
    mutationFn: async (data: AddEmployeeFormData & { photo?: File }) => {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (key !== 'photo' && value) {
          formData.append(key, value);
        }
      });
      
      if (data.photo) {
        formData.append('photo', data.photo);
      }

      const response = await fetch('/api/employees', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear empleado');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({
        title: "Éxito",
        description: "Empleado creado correctamente",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al crear empleado",
        variant: "destructive",
      });
    },
  });

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedPhoto(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setSelectedPhoto(null);
    setPhotoPreview(null);
  };

  const onSubmit = (data: AddEmployeeFormData) => {
    // Auto-generate barcode if not provided
    const employeeData = {
      ...data,
      barcode: data.barcode || data.id, // Use ID as barcode if barcode is empty
      photo: selectedPhoto || undefined,
    };
    
    createEmployeeMutation.mutate(employeeData);
  };

  const departments = [
    { value: "sistemas", label: "Sistemas" },
    { value: "recursos-humanos", label: "Recursos Humanos" },
    { value: "ventas", label: "Ventas" },
    { value: "administracion", label: "Administración" },
    { value: "marketing", label: "Marketing" },
    { value: "finanzas", label: "Finanzas" },
  ];

  const scheduleOptions = [
    { value: "administrativo", label: "Horario Administrativo (8:00 - 17:00)" },
    { value: "horario1", label: "Horario 1 (7:00 - 16:00)" },
    { value: "horario2", label: "Horario 2 (9:00 - 18:00)" },
    { value: "personalizado", label: "Personalizado" },
  ];

  return (
    <div>
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-8 py-4">
        <div>
          <h2 className="text-2xl font-bold text-navy">Añadir Nuevo Empleado</h2>
          <p className="text-slate-600">Completa la información del empleado</p>
        </div>
      </div>

      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-lg">
            <CardContent className="p-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-6">
                      <FormField
                        control={form.control}
                        name="id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ID del Empleado *</FormLabel>
                            <FormControl>
                              <Input placeholder="Ej: MOJV040815" {...field} />
                            </FormControl>
                            <p className="text-xs text-slate-500">Debe ser único en el sistema</p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre Completo *</FormLabel>
                            <FormControl>
                              <Input placeholder="Nombre completo del empleado" {...field} />
                            </FormControl>
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
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecciona un departamento" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {departments.map((dept) => (
                                  <SelectItem key={dept.value} value={dept.value}>
                                    {dept.label}
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
                        name="schedule"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Horario Laboral *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecciona un horario" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {scheduleOptions.map((schedule) => (
                                  <SelectItem key={schedule.value} value={schedule.value}>
                                    {schedule.label}
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
                        name="barcode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Código de Barras</FormLabel>
                            <FormControl>
                              <Input placeholder="Se generará automáticamente si se deja vacío" {...field} />
                            </FormControl>
                            <p className="text-xs text-slate-500">Si no se especifica, se usará el ID del empleado</p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                      {/* Photo Upload */}
                      <div>
                        <Label className="block text-sm font-medium text-slate-700 mb-2">Fotografía del Empleado *</Label>
                        <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-turquoise transition-colors">
                          {photoPreview ? (
                            <div>
                              <img 
                                src={photoPreview} 
                                alt="Vista previa" 
                                className="w-32 h-32 rounded-full mx-auto object-cover mb-4" 
                              />
                              <Button 
                                type="button" 
                                variant="destructive" 
                                size="sm"
                                onClick={removePhoto}
                              >
                                <X className="mr-1 h-4 w-4" />
                                Eliminar foto
                              </Button>
                            </div>
                          ) : (
                            <div>
                              <Camera className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                              <p className="text-slate-600 mb-2">Arrastra una imagen aquí o</p>
                              <input
                                type="file"
                                id="photo-input"
                                accept="image/*"
                                onChange={handlePhotoChange}
                                className="hidden"
                              />
                              <label
                                htmlFor="photo-input"
                                className="bg-turquoise text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-cyan-600 transition-colors inline-block"
                              >
                                Seleccionar Archivo
                              </label>
                              <p className="text-xs text-slate-500 mt-2">JPG, PNG o GIF hasta 5MB</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Preview Card */}
                      <div className="bg-slate-50 rounded-lg p-6">
                        <h4 className="font-semibold text-navy mb-4">Vista Previa de Credencial</h4>
                        <div 
                          className="bg-white rounded-lg p-4 border-2 border-slate-200 mx-auto relative"
                          style={{ width: '340px', height: '216px' }}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="text-xs font-bold text-navy">
                              ID: {form.watch('id') || 'XXXXXXX'}
                            </div>
                            <div className="w-8 h-8 bg-navy rounded text-white text-xs flex items-center justify-center">
                              J
                            </div>
                          </div>
                          <div className="flex items-start space-x-3">
                            <div className="w-16 h-16 bg-slate-200 rounded-lg flex items-center justify-center">
                              {photoPreview ? (
                                <img 
                                  src={photoPreview} 
                                  alt="Preview" 
                                  className="w-full h-full object-cover rounded-lg" 
                                />
                              ) : (
                                <span className="text-slate-400">👤</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className="text-sm font-bold text-navy truncate">
                                {form.watch('fullName') || 'NOMBRE DEL EMPLEADO'}
                              </h5>
                              <p className="text-xs text-slate-600">
                                {departments.find(d => d.value === form.watch('department'))?.label || 'DEPARTAMENTO'}
                              </p>
                            </div>
                          </div>
                          <div className="absolute bottom-4 left-4 right-4">
                            <div className="h-6 bg-slate-200 rounded flex items-center justify-center">
                              <div className="text-xs font-mono">||||| ||| || |||||</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="flex justify-end space-x-4 pt-6 border-t border-slate-200">
                    <Button type="button" variant="outline">
                      Cancelar
                    </Button>
                    <Button 
                      type="submit" 
                      className="bg-turquoise hover:bg-cyan-600"
                      disabled={createEmployeeMutation.isPending}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {createEmployeeMutation.isPending ? "Guardando..." : "Guardar Empleado"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
