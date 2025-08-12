import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { insertEmployeeSchema } from "@shared/schema";
import { Camera, Save, Barcode } from "lucide-react";
import { generateBarcode } from "@/lib/barcode-utils";

export default function AddEmployee() {
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: workSchedules = [] } = useQuery<any[]>({
    queryKey: ["/api/work-schedules"],
  });

  const { data: departments = [] } = useQuery<any[]>({
    queryKey: ["/api/departments"],
  });

  const form = useForm({
    resolver: zodResolver(insertEmployeeSchema),
    defaultValues: {
      employeeId: "",
      fullName: "",
      department: "",
      workScheduleId: "",
      photoUrl: "",
      barcodeData: "",
      isActive: true,
    },
  });

  const createEmployeeMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch("/api/employees", {
        method: "POST",
        body: data,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Empleado creado",
        description: "El empleado ha sido registrado exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      form.reset();
      setPhotoFile(null);
      setPhotoPreview(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setPhotoPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateBarcode = () => {
    const employeeId = form.getValues("employeeId");
    if (employeeId) {
      const barcodeData = generateBarcode(employeeId);
      form.setValue("barcodeData", barcodeData);
    }
  };

  const onSubmit = (data: any) => {
    const formData = new FormData();
    
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined && data[key] !== null) {
        formData.append(key, data[key]);
      }
    });
    
    if (photoFile) {
      formData.append("photo", photoFile);
    }

    createEmployeeMutation.mutate(formData);
  };



  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Añadir Empleado</h2>
          <p className="text-slate-600">Registra un nuevo empleado en el sistema</p>
        </div>

        <Card>
          <CardContent className="p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="employeeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ID del Empleado</FormLabel>
                        <FormControl>
                          <Input placeholder="EMP001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre Completo</FormLabel>
                        <FormControl>
                          <Input placeholder="Nombre completo del empleado" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Área o Departamento</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar departamento" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {departments.map((dept: any) => (
                              <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="workScheduleId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Horario Laboral</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar horario" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {workSchedules?.map((schedule: any) => (
                              <SelectItem key={schedule.id} value={schedule.id}>
                                {schedule.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Photo Upload */}
                <div>
                  <Label className="block text-sm font-semibold text-slate-900 mb-2">
                    Fotografía del Empleado
                  </Label>
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-primary transition-colors duration-200">
                    {photoPreview ? (
                      <div className="flex flex-col items-center">
                        <img
                          src={photoPreview}
                          alt="Preview"
                          className="w-24 h-24 rounded-full object-cover mb-4"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById('photo-input')?.click()}
                        >
                          Cambiar foto
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <div className="w-24 h-24 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-4">
                          <Camera className="w-8 h-8 text-slate-400" />
                        </div>
                        <p className="text-slate-600 mb-2">Haz clic para subir una fotografía</p>
                        <p className="text-sm text-slate-500">PNG, JPG hasta 5MB</p>
                        <Button
                          type="button"
                          variant="outline"
                          className="mt-4"
                          onClick={() => document.getElementById('photo-input')?.click()}
                        >
                          Seleccionar archivo
                        </Button>
                      </div>
                    )}
                    <input
                      id="photo-input"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Barcode Generation */}
                <FormField
                  control={form.control}
                  name="barcodeData"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código de Barras</FormLabel>
                      <div className="flex items-center space-x-4">
                        <FormControl>
                          <Input placeholder="Se generará automáticamente" {...field} readOnly />
                        </FormControl>
                        <Button type="button" variant="outline" onClick={handleGenerateBarcode}>
                          <Barcode className="w-4 h-4 mr-2" />
                          Generar
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-4 pt-6">
                  <Button type="button" variant="outline">
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createEmployeeMutation.isPending}>
                    <Save className="w-4 h-4 mr-2" />
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
