import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, Clock } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertScheduleSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type ScheduleFormData = {
  name: string;
  entryTime: string;
  breakfastStart?: string;
  breakfastEnd?: string;
  lunchStart?: string;
  lunchEnd?: string;
  exitTime: string;
  overtimeAllowed: boolean;
};

export default function Schedules() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: schedules, isLoading } = useQuery({
    queryKey: ["/api/schedules"],
  });

  const form = useForm<ScheduleFormData>({
    resolver: zodResolver(insertScheduleSchema),
    defaultValues: {
      name: "",
      entryTime: "",
      breakfastStart: "",
      breakfastEnd: "",
      lunchStart: "",
      lunchEnd: "",
      exitTime: "",
      overtimeAllowed: false,
    },
  });

  const createScheduleMutation = useMutation({
    mutationFn: async (data: ScheduleFormData) => {
      const response = await apiRequest("POST", "/api/schedules", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Horario Creado",
        description: "El horario ha sido registrado exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo crear el horario. Intenta nuevamente.",
        variant: "destructive",
      });
    },
  });

  const updateScheduleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<ScheduleFormData> }) => {
      const response = await apiRequest("PUT", `/api/schedules/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Horario Actualizado",
        description: "El horario ha sido actualizado exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
      setIsDialogOpen(false);
      setEditingSchedule(null);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el horario. Intenta nuevamente.",
        variant: "destructive",
      });
    },
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/schedules/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Horario Eliminado",
        description: "El horario ha sido eliminado exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el horario. Puede estar en uso.",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (schedule: any) => {
    setEditingSchedule(schedule);
    form.reset({
      name: schedule.name,
      entryTime: schedule.entryTime,
      breakfastStart: schedule.breakfastStart || "",
      breakfastEnd: schedule.breakfastEnd || "",
      lunchStart: schedule.lunchStart || "",
      lunchEnd: schedule.lunchEnd || "",
      exitTime: schedule.exitTime,
      overtimeAllowed: schedule.overtimeAllowed,
    });
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingSchedule(null);
    form.reset();
    setIsDialogOpen(true);
  };

  const onSubmit = (data: ScheduleFormData) => {
    if (editingSchedule) {
      updateScheduleMutation.mutate({ id: editingSchedule.id, data });
    } else {
      createScheduleMutation.mutate(data);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("¿Estás seguro de que deseas eliminar este horario?")) {
      deleteScheduleMutation.mutate(id);
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Horarios Laborales
          </h2>
          <Button onClick={handleCreate} className="tablet-button" data-testid="add-schedule">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Horario
          </Button>
        </div>

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="loading-spinner" />
            </div>
          ) : schedules && schedules.length > 0 ? (
            schedules.map((schedule: any) => (
              <Card key={schedule.id} className="shadow-sm border border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <Clock className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold text-gray-900">
                        {schedule.name}
                      </h3>
                      {schedule.overtimeAllowed && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          Horas extra permitidas
                        </span>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(schedule)}
                        data-testid={`edit-schedule-${schedule.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(schedule.id)}
                        className="text-red-600 hover:text-red-700"
                        data-testid={`delete-schedule-${schedule.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Entrada:</span>
                      <span className="ml-2 font-medium">{schedule.entryTime}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Salida:</span>
                      <span className="ml-2 font-medium">{schedule.exitTime}</span>
                    </div>
                    {schedule.breakfastStart && schedule.breakfastEnd && (
                      <div>
                        <span className="text-gray-600">Desayuno:</span>
                        <span className="ml-2 font-medium">
                          {schedule.breakfastStart}-{schedule.breakfastEnd}
                        </span>
                      </div>
                    )}
                    {schedule.lunchStart && schedule.lunchEnd && (
                      <div>
                        <span className="text-gray-600">Comida:</span>
                        <span className="ml-2 font-medium">
                          {schedule.lunchStart}-{schedule.lunchEnd}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="shadow-sm border border-gray-200">
              <CardContent className="p-12 text-center">
                <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">No hay horarios configurados</p>
                <Button 
                  onClick={handleCreate} 
                  className="mt-4 tablet-button"
                  data-testid="create-first-schedule"
                >
                  Crear primer horario
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingSchedule ? "Editar Horario" : "Nuevo Horario"}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <Label htmlFor="name">Nombre del Horario *</Label>
                <Input
                  id="name"
                  placeholder="Horario Administrativo"
                  {...form.register("name")}
                  className="tablet-input"
                  data-testid="input-schedule-name"
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="entryTime">Hora de Entrada *</Label>
                  <Input
                    id="entryTime"
                    type="time"
                    {...form.register("entryTime")}
                    className="tablet-input"
                    data-testid="input-entry-time"
                  />
                  {form.formState.errors.entryTime && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.entryTime.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="exitTime">Hora de Salida *</Label>
                  <Input
                    id="exitTime"
                    type="time"
                    {...form.register("exitTime")}
                    className="tablet-input"
                    data-testid="input-exit-time"
                  />
                  {form.formState.errors.exitTime && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.exitTime.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="breakfastStart">Inicio Desayuno</Label>
                  <Input
                    id="breakfastStart"
                    type="time"
                    {...form.register("breakfastStart")}
                    className="tablet-input"
                    data-testid="input-breakfast-start"
                  />
                </div>

                <div>
                  <Label htmlFor="breakfastEnd">Fin Desayuno</Label>
                  <Input
                    id="breakfastEnd"
                    type="time"
                    {...form.register("breakfastEnd")}
                    className="tablet-input"
                    data-testid="input-breakfast-end"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="lunchStart">Inicio Comida</Label>
                  <Input
                    id="lunchStart"
                    type="time"
                    {...form.register("lunchStart")}
                    className="tablet-input"
                    data-testid="input-lunch-start"
                  />
                </div>

                <div>
                  <Label htmlFor="lunchEnd">Fin Comida</Label>
                  <Input
                    id="lunchEnd"
                    type="time"
                    {...form.register("lunchEnd")}
                    className="tablet-input"
                    data-testid="input-lunch-end"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="overtimeAllowed"
                  checked={form.watch("overtimeAllowed")}
                  onCheckedChange={(checked) => form.setValue("overtimeAllowed", checked)}
                  data-testid="switch-overtime"
                />
                <Label htmlFor="overtimeAllowed">Permitir horas extra</Label>
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  data-testid="cancel-schedule"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createScheduleMutation.isPending || updateScheduleMutation.isPending}
                  data-testid="save-schedule"
                >
                  {createScheduleMutation.isPending || updateScheduleMutation.isPending
                    ? "Guardando..."
                    : editingSchedule
                    ? "Actualizar"
                    : "Crear Horario"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
