import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Save, Database, Download, Cog } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const scheduleSchema = z.object({
  id: z.string().min(1, "ID del horario es requerido"),
  name: z.string().min(1, "Nombre del horario es requerido"),
  entryTime: z.string().min(1, "Hora de entrada es requerida"),
  exitTime: z.string().min(1, "Hora de salida es requerida"),
  breakfastStart: z.string().optional(),
  breakfastEnd: z.string().optional(),
  lunchStart: z.string().optional(),
  lunchEnd: z.string().optional(),
});

type ScheduleFormData = z.infer<typeof scheduleSchema>;

export default function SettingsConfiguration() {
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: schedules } = useQuery({
    queryKey: ["/api/schedules"],
  });

  const { data: settings } = useQuery({
    queryKey: ["/api/settings"],
  });

  const scheduleForm = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      id: "",
      name: "",
      entryTime: "",
      exitTime: "",
      breakfastStart: "",
      breakfastEnd: "",
      lunchStart: "",
      lunchEnd: "",
    },
  });

  const createScheduleMutation = useMutation({
    mutationFn: async (data: ScheduleFormData) => {
      return await apiRequest("POST", "/api/schedules", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
      setIsScheduleModalOpen(false);
      scheduleForm.reset();
      toast({
        title: "Éxito",
        description: "Horario creado correctamente",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Error al crear horario",
        variant: "destructive",
      });
    },
  });

  const updateScheduleMutation = useMutation({
    mutationFn: async (data: ScheduleFormData) => {
      return await apiRequest("PUT", `/api/schedules/${data.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
      setIsScheduleModalOpen(false);
      setEditingSchedule(null);
      scheduleForm.reset();
      toast({
        title: "Éxito",
        description: "Horario actualizado correctamente",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Error al actualizar horario",
        variant: "destructive",
      });
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PUT", "/api/settings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Éxito",
        description: "Configuraciones guardadas correctamente",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Error al guardar configuraciones",
        variant: "destructive",
      });
    },
  });

  const handleAddSchedule = () => {
    setEditingSchedule(null);
    scheduleForm.reset({
      id: "",
      name: "",
      entryTime: "",
      exitTime: "",
      breakfastStart: "",
      breakfastEnd: "",
      lunchStart: "",
      lunchEnd: "",
    });
    setIsScheduleModalOpen(true);
  };

  const handleEditSchedule = (schedule: any) => {
    setEditingSchedule(schedule);
    scheduleForm.reset(schedule);
    setIsScheduleModalOpen(true);
  };

  const onSubmitSchedule = (data: ScheduleFormData) => {
    if (editingSchedule) {
      updateScheduleMutation.mutate(data);
    } else {
      createScheduleMutation.mutate(data);
    }
  };

  const handleSaveSettings = () => {
    const settingsData = {
      blockingTime: 60,
      entryTolerance: 15,
      autoBackup: true,
      cameraAudio: false,
      credentialSettings: {
        colorScheme: "default",
        fontSize: "medium",
        showDepartment: true,
        showPhoto: true,
        showBarcode: true,
        fontFamily: "inter"
      }
    };
    updateSettingsMutation.mutate(settingsData);
  };

  const predefinedSchedules = [
    {
      id: "administrativo",
      name: "Horario Administrativo",
      entryTime: "08:00",
      exitTime: "17:00",
      breakfastStart: "10:30",
      breakfastEnd: "11:00",
      lunchStart: "14:00",
      lunchEnd: "15:00",
    },
    {
      id: "horario1",
      name: "Horario 1",
      entryTime: "07:00",
      exitTime: "16:00",
      breakfastStart: "09:30",
      breakfastEnd: "10:00",
      lunchStart: "13:00",
      lunchEnd: "14:00",
    },
    {
      id: "horario2",
      name: "Horario 2",
      entryTime: "09:00",
      exitTime: "18:00",
      breakfastStart: "11:30",
      breakfastEnd: "12:00",
      lunchStart: "15:00",
      lunchEnd: "16:00",
    },
  ];

  const colorSchemes = [
    { id: "default", name: "Por defecto", primaryColor: "bg-navy" },
    { id: "turquoise", name: "Turquesa", primaryColor: "bg-turquoise" },
    { id: "green", name: "Verde", primaryColor: "bg-green-600" },
    { id: "red", name: "Rojo", primaryColor: "bg-red-600" },
    { id: "purple", name: "Morado", primaryColor: "bg-purple-600" },
  ];

  return (
    <div>
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-8 py-4">
        <div>
          <h2 className="text-2xl font-bold text-navy">Configuraciones</h2>
          <p className="text-slate-600">Administra horarios y configuraciones del sistema</p>
        </div>
      </div>

      <div className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Schedule Management */}
          <div className="space-y-6">
            <Card className="shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-navy">Gestión de Horarios</h3>
                  <Button onClick={handleAddSchedule} className="bg-turquoise hover:bg-cyan-600">
                    <Plus className="mr-1 h-4 w-4" />
                    Nuevo Horario
                  </Button>
                </div>
                
                {/* Schedule List */}
                <div className="space-y-4">
                  {predefinedSchedules.map((schedule) => (
                    <div key={schedule.id} className="border border-slate-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-navy">{schedule.name}</h4>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditSchedule(schedule)}
                          >
                            <Edit className="h-4 w-4 text-turquoise" />
                          </Button>
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Activo</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm text-slate-600">
                        <div>Entrada: <span className="font-medium">{schedule.entryTime}</span></div>
                        <div>Salida: <span className="font-medium">{schedule.exitTime}</span></div>
                        <div>Desayuno: <span className="font-medium">{schedule.breakfastStart}-{schedule.breakfastEnd}</span></div>
                        <div>Comida: <span className="font-medium">{schedule.lunchStart}-{schedule.lunchEnd}</span></div>
                      </div>
                    </div>
                  ))}

                  {/* Custom schedules from database */}
                  {schedules?.map((schedule: any) => (
                    <div key={schedule.id} className="border border-slate-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-navy">{schedule.name}</h4>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditSchedule(schedule)}
                          >
                            <Edit className="h-4 w-4 text-turquoise" />
                          </Button>
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Activo</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm text-slate-600">
                        <div>Entrada: <span className="font-medium">{schedule.entryTime}</span></div>
                        <div>Salida: <span className="font-medium">{schedule.exitTime}</span></div>
                        {schedule.breakfastStart && (
                          <div>Desayuno: <span className="font-medium">{schedule.breakfastStart}-{schedule.breakfastEnd}</span></div>
                        )}
                        {schedule.lunchStart && (
                          <div>Comida: <span className="font-medium">{schedule.lunchStart}-{schedule.lunchEnd}</span></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* System Settings */}
            <Card className="shadow-lg">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-navy mb-6">Configuraciones del Sistema</h3>
                
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-slate-700 mb-2">Tiempo de bloqueo después del check-in</Label>
                    <Select defaultValue="60">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 segundos</SelectItem>
                        <SelectItem value="60">1 minuto</SelectItem>
                        <SelectItem value="120">2 minutos</SelectItem>
                        <SelectItem value="300">5 minutos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-slate-700 mb-2">Tolerancia de entrada (minutos)</Label>
                    <Input type="number" min="0" max="60" defaultValue="15" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="auto-backup" defaultChecked />
                      <Label htmlFor="auto-backup">Respaldo automático diario</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox id="camera-audio" />
                      <Label htmlFor="camera-audio">Sonido de confirmación en escaneo</Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Credential Design */}
          <div className="space-y-6">
            <Card className="shadow-lg">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-navy mb-6">Diseño de Credenciales</h3>
                
                <div className="space-y-6">
                  {/* Color Scheme */}
                  <div>
                    <Label className="text-sm font-medium text-slate-700 mb-3">Esquema de Colores</Label>
                    <div className="grid grid-cols-5 gap-3">
                      {colorSchemes.map((scheme) => (
                        <button
                          key={scheme.id}
                          className={`h-12 rounded-lg border-2 border-turquoise ${scheme.primaryColor} flex items-center justify-center`}
                        >
                          <div className="text-xs text-white font-medium">{scheme.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Logo Upload */}
                  <div>
                    <Label className="text-sm font-medium text-slate-700 mb-2">Logo de la Empresa</Label>
                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center">
                      <div className="flex items-center justify-center space-x-4">
                        <div className="w-12 h-12 bg-navy rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold">J</span>
                        </div>
                        <div className="text-left">
                          <p className="text-sm text-slate-600">Logo actual</p>
                          <Button variant="link" className="text-turquoise p-0 h-auto">
                            Cambiar logo
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Typography */}
                  <div>
                    <Label className="text-sm font-medium text-slate-700 mb-2">Tipografía</Label>
                    <Select defaultValue="inter">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inter">Inter (Moderno)</SelectItem>
                        <SelectItem value="roboto">Roboto (Neutro)</SelectItem>
                        <SelectItem value="arial">Arial (Clásico)</SelectItem>
                        <SelectItem value="helvetica">Helvetica (Profesional)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Layout Options */}
                  <div>
                    <Label className="text-sm font-medium text-slate-700 mb-3">Elementos a Mostrar</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="show-employee-id" defaultChecked />
                        <Label htmlFor="show-employee-id">ID del empleado</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="show-department" defaultChecked />
                        <Label htmlFor="show-department">Departamento</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="show-photo" defaultChecked />
                        <Label htmlFor="show-photo">Fotografía</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="show-barcode" defaultChecked />
                        <Label htmlFor="show-barcode">Código de barras</Label>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Database Configuration */}
            <Card className="shadow-lg">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-navy mb-6">Configuración de Base de Datos</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Database className="text-green-600 h-5 w-5" />
                      <div>
                        <p className="text-sm font-medium text-green-800">PostgreSQL Conectado</p>
                        <p className="text-xs text-green-600">Base de datos activa</p>
                      </div>
                    </div>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Online</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" className="flex flex-col h-16">
                      <Download className="text-turquoise mb-1 h-5 w-5" />
                      <span className="text-sm">Respaldar BD</span>
                    </Button>
                    <Button variant="outline" className="flex flex-col h-16">
                      <Cog className="text-slate-500 mb-1 h-5 w-5" />
                      <span className="text-sm">Optimizar</span>
                    </Button>
                  </div>

                  <div className="text-xs text-slate-500 space-y-1">
                    <div>Tablas: employees, attendance_records, schedules</div>
                    <div>Último respaldo: No disponible</div>
                    <div>Registros totales: Calculando...</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Save Settings */}
        <div className="mt-8 flex justify-end">
          <Button 
            onClick={handleSaveSettings}
            className="bg-green-600 hover:bg-green-700 px-8"
            disabled={updateSettingsMutation.isPending}
          >
            <Save className="mr-2 h-4 w-4" />
            {updateSettingsMutation.isPending ? "Guardando..." : "Guardar Configuraciones"}
          </Button>
        </div>
      </div>

      {/* Schedule Modal */}
      <Dialog open={isScheduleModalOpen} onOpenChange={setIsScheduleModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingSchedule ? "Editar Horario" : "Nuevo Horario"}
            </DialogTitle>
          </DialogHeader>
          
          <Form {...scheduleForm}>
            <form onSubmit={scheduleForm.handleSubmit(onSubmitSchedule)} className="space-y-4">
              <FormField
                control={scheduleForm.control}
                name="id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ID del Horario</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: horario-especial" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={scheduleForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del Horario</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Horario Especial" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={scheduleForm.control}
                  name="entryTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hora de Entrada</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={scheduleForm.control}
                  name="exitTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hora de Salida</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={scheduleForm.control}
                  name="breakfastStart"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Inicio Desayuno</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={scheduleForm.control}
                  name="breakfastEnd"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fin Desayuno</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={scheduleForm.control}
                  name="lunchStart"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Inicio Comida</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={scheduleForm.control}
                  name="lunchEnd"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fin Comida</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsScheduleModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className="bg-turquoise hover:bg-cyan-600"
                  disabled={createScheduleMutation.isPending || updateScheduleMutation.isPending}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {editingSchedule ? "Actualizar" : "Crear"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
