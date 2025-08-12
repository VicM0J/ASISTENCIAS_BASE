import { Clock, QrCode, Users, UserPlus, IdCard, FileSpreadsheet, Settings, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const menuItems = [
    { id: "checkin", label: "Check In / Check Out", icon: QrCode },
    { id: "employees", label: "Gestión de Empleados", icon: Users },
    { id: "add-employee", label: "Añadir Empleado", icon: UserPlus },
    { id: "credentials", label: "Generador de Credenciales", icon: IdCard },
    { id: "reports", label: "Reportes Excel", icon: FileSpreadsheet },
    { id: "settings", label: "Configuraciones", icon: Settings },
  ];

  return (
    <aside className={`${isCollapsed ? 'w-20' : 'w-80'} bg-white shadow-lg border-r border-slate-200 flex-shrink-0 transition-all duration-300`}>
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'}`}>
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
            {!isCollapsed && (
              <div>
                <h1 className="text-xl font-bold text-slate-900">TimeCheck Pro</h1>
                <p className="text-sm text-slate-500">Control de Asistencias</p>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 hover:bg-slate-100"
          >
            <Menu className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      <nav className="p-6">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <li key={item.id}>
                <Button
                  variant="ghost"
                  className={`w-full ${isCollapsed ? 'justify-center px-2' : 'justify-start'} p-4 h-auto rounded-xl font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-primary text-white hover:bg-primary/90"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                  onClick={() => onTabChange(item.id)}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className={`w-5 h-5 ${!isCollapsed ? 'mr-3' : ''}`} />
                  {!isCollapsed && item.label}
                </Button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
