import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

interface EmployeeCardProps {
  employee: {
    id: string;
    employeeId: string;
    fullName: string;
    department: string;
    photoUrl?: string;
    isActive: boolean;
  };
  onViewDetails?: (employee: any) => void;
}

export default function EmployeeCard({ employee, onViewDetails }: EmployeeCardProps) {
  const initials = employee.fullName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase();

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="flex items-center space-x-4 mb-4">
          <Avatar className="w-16 h-16">
            <AvatarImage src={employee.photoUrl} alt={employee.fullName} />
            <AvatarFallback className="text-lg font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900 text-lg">
              {employee.fullName}
            </h3>
            <p className="text-sm text-slate-500">ID: {employee.employeeId}</p>
            <p className="text-sm text-slate-600">{employee.department}</p>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <Badge variant={employee.isActive ? "default" : "destructive"}>
            {employee.isActive ? "Activo" : "Inactivo"}
          </Badge>
          
          {onViewDetails && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onViewDetails(employee)}
            >
              <Eye className="w-4 h-4 mr-2" />
              Ver Detalles
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
