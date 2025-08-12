import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { insertDepartmentSchema } from "@shared/schema";
import { Plus, Edit, Trash2, Save, Clock, Building2 } from "lucide-react";
import { z } from "zod";

type InsertDepartment = z.infer<typeof insertDepartmentSchema>;

export default function Settings() {
  const [editingSchedule, setEditingSchedule] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState("system");
  const [selectedDepartment, setSelectedDepartment] = useState<any>(null);
  const [isDepartmentDialogOpen, setIsDepartmentDialogOpen] = useState(false);
  const { toast } = useToast();

  // Departments queries
  const { data: departments = [] } = useQuery({
    queryKey: ["/api/departments"],
  });

  const departmentForm = useForm<InsertDepartment>({
    resolver: zodResolver(insertDepartmentSchema),
    defaultValues: {
      name: "",
      description: "",
      isActive: true,
    },
  });

  const createDepartmentMutation = useMutation({
    mutationFn: async (data: InsertDepartment) => {
      const response = await fetch("/api/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create department");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Departamento creado exitosamente" });
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      setIsDepartmentDialogOpen(false);
      departmentForm.reset();
    },
  });

  const updateDepartmentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertDepartment> }) => {
      const response = await fetch(`/api/departments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update department");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Departamento actualizado exitosamente" });
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      setIsDepartmentDialogOpen(false);
      departmentForm.reset();
      setSelectedDepartment(null);
    },
  });

  const deleteDepartmentMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/departments/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete department");
    },
    onSuccess: () => {
      toast({ title: "Departamento eliminado exitosamente" });
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
    },
  });

  const onDepartmentSubmit = (data: InsertDepartment) => {
    if (selectedDepartment) {
      updateDepartmentMutation.mutate({ id: selectedDepartment.id, data });
    } else {
      createDepartmentMutation.mutate(data);
    }
  };

  const openDepartmentDialog = (department?: any) => {
    if (department) {
      setSelectedDepartment(department);
      departmentForm.reset({
        name: department.name,
        description: department.description || "",
        isActive: department.isActive,
      });
    } else {
      setSelectedDepartment(null);
      departmentForm.reset({
        name: "",
        description: "",
        isActive: true,
      });
    }
    setIsDepartmentDialogOpen(true);
  };

  const { data: workSchedules, isLoading: schedulesLoading } = useQuery({
    queryKey: ["/api/work-schedules"],
  });

  const { data: systemSettings } = useQuery({
    queryKey: ["/api/system-settings"],
  });

  const form = useForm({
    defaultValues: {
      companyName: systemSettings?.companyName || "TimeCheck Pro",
      timezone: systemSettings?.timezone || "America/Mexico_City",
      emailNotifications: systemSettings?.emailNotifications || false,
      darkMode: systemSettings?.darkMode || false,
    },
  });

  const updateSystemSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/system-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update settings");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Configuración actualizada",
        description: "Los cambios se han guardado exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/system-settings"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios",
        variant: "destructive",
      });
    },
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/work-schedules/${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete schedule");
      }
    },
    onSuccess: () => {
      toast({
        title: "Horario eliminado",
        description: "El horario se ha eliminado exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/work-schedules"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el horario",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    updateSystemSettingsMutation.mutate(data);
  };

  const timezones = [
    { value: "America/Mexico_City", label: "GMT-6 (México Central)" },
    { value: "America/Cancun", label: "GMT-5 (México Oriental)" },
    { value: "America/Mazatlan", label: "GMT-7 (México Pacífico)" },
  ];

  const sectionTabs = [
    { id: "system", label: "Sistema", icon: Clock },
    { id: "departments", label: "Departamentos", icon: Building2 },
    { id: "schedules", label: "Horarios", icon: Clock },
  ];

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Configuraciones</h2>
          <p className="text-slate-600">Administra horarios laborales y configuraciones del sistema</p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-8 bg-slate-100 p-1 rounded-lg w-fit">
          {sectionTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.id}
                variant={activeSection === tab.id ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveSection(tab.id)}
                className={`px-4 py-2 ${
                  activeSection === tab.id
                    ? "bg-white shadow-sm"
                    : "hover:bg-slate-200"
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.label}
              </Button>
            );
          })}
        </div>

        {/* Departments Section */}
        {activeSection === "departments" && (
          <Card className="mb-8">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-slate-900">Departamentos/Áreas</h3>
                <Dialog open={isDepartmentDialogOpen} onOpenChange={setIsDepartmentDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => openDepartmentDialog()}>
                      <Plus className="w-4 h-4 mr-2" />
                      Nuevo Departamento
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {selectedDepartment ? "Editar Departamento" : "Nuevo Departamento"}
                      </DialogTitle>
                    </DialogHeader>
                    <Form {...departmentForm}>
                      <form onSubmit={departmentForm.handleSubmit(onDepartmentSubmit)} className="space-y-4">
                        <FormField
                          control={departmentForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nombre del Departamento</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Ej: Administración" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={departmentForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Descripción</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Descripción del departamento" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={departmentForm.control}
                          name="isActive"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between">
                              <FormLabel>Departamento Activo</FormLabel>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <div className="flex justify-end space-x-2">
                          <Button type="button" variant="outline" onClick={() => setIsDepartmentDialogOpen(false)}>
                            Cancelar
                          </Button>
                          <Button type="submit" disabled={createDepartmentMutation.isPending || updateDepartmentMutation.isPending}>
                            {selectedDepartment ? "Actualizar" : "Crear"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {departments.map((department: any) => (
                  <div key={department.id} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-slate-900">{department.name}</h4>
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openDepartmentDialog(department)}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteDepartmentMutation.mutate(department.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    {department.description && (
                      <p className="text-sm text-slate-600 mb-2">{department.description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        department.isActive 
                          ? "bg-green-100 text-green-800" 
                          : "bg-red-100 text-red-800"
                      }`}>
                        {department.isActive ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Work Schedules */}
        {activeSection === "schedules" && (
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-slate-900">Horarios Laborales</h3>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Horario
              </Button>
            </div>

            {schedulesLoading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="border border-slate-200 rounded-xl p-6 animate-pulse">
                    <div className="h-6 bg-slate-300 rounded mb-4"></div>
                    <div className="space-y-3">
                      {[...Array(6)].map((_, j) => (
                        <div key={j} className="flex justify-between">
                          <div className="h-4 bg-slate-300 rounded w-24"></div>
                          <div className="h-4 bg-slate-300 rounded w-16"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {workSchedules?.map((schedule: any) => (
                  <div key={schedule.id} className="border border-slate-200 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-slate-900">{schedule.name}</h4>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingSchedule(schedule.id)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteScheduleMutation.mutate(schedule.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Entrada:</span>
                        <span className="font-medium">{schedule.entryTime}</span>
                      </div>
                      {schedule.breakfastOutTime && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Salida desayuno:</span>
                            <span className="font-medium">{schedule.breakfastOutTime}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Regreso desayuno:</span>
                            <span className="font-medium">{schedule.breakfastInTime}</span>
                          </div>
                        </>
                      )}
                      {schedule.lunchOutTime && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Salida comida:</span>
                            <span className="font-medium">{schedule.lunchOutTime}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Regreso comida:</span>
                            <span className="font-medium">{schedule.lunchInTime}</span>
                          </div>
                        </>
                      )}
                      <div className="flex justify-between">
                        <span className="text-slate-600">Salida:</span>
                        <span className="font-medium">{schedule.exitTime}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        )}

        {/* System Settings */}
        {activeSection === "system" && (
        <Card>
          <CardContent className="p-8">
            <h3 className="text-xl font-semibold text-slate-900 mb-6">Configuraciones del Sistema</h3>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre de la Empresa</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="timezone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Zona Horaria</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {timezones.map((tz) => (
                              <SelectItem key={tz.value} value={tz.value}>
                                {tz.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                <FormField
                  control={form.control}
                  name="emailNotifications"
                  render={({ field }) => (
                    <div className="flex items-center justify-between py-4">
                      <div>
                        <h4 className="font-semibold text-slate-900">Notificaciones por Email</h4>
                        <p className="text-sm text-slate-600">Enviar alertas de asistencias por correo</p>
                      </div>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </div>
                  )}
                />

                <FormField
                  control={form.control}
                  name="darkMode"
                  render={({ field }) => (
                    <div className="flex items-center justify-between py-4 border-t border-slate-200">
                      <div>
                        <h4 className="font-semibold text-slate-900">Modo Oscuro</h4>
                        <p className="text-sm text-slate-600">Cambiar apariencia del sistema</p>
                      </div>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </div>
                  )}
                />

                <div className="flex justify-end pt-6">
                  <Button 
                    type="submit" 
                    disabled={updateSystemSettingsMutation.isPending}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {updateSystemSettingsMutation.isPending ? "Guardando..." : "Guardar Cambios"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
        )}
      </div>
    </div>
  );
}
