import { Clock, QrCode, Users, UserPlus, IdCard, FileSpreadsheet, Settings } from "lucide-react";

interface SidebarNavigationProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export default function SidebarNavigation({ activeSection, onSectionChange }: SidebarNavigationProps) {
  const menuItems = [
    { id: "checkin", label: "Check In/Out", icon: QrCode },
    { id: "employees", label: "Gestión de Empleados", icon: Users },
    { id: "add-employee", label: "Añadir Empleado", icon: UserPlus },
    { id: "credentials", label: "Generar Credenciales", icon: IdCard },
    { id: "reports", label: "Reportes Excel", icon: FileSpreadsheet },
    { id: "settings", label: "Configuraciones", icon: Settings },
  ];

  return (
    <div className="w-64 bg-navy text-white shadow-xl">
      <div className="p-6 border-b border-slate-600">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-turquoise rounded-lg flex items-center justify-center">
            <Clock className="text-white text-lg" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">JASANA</h1>
            <p className="text-slate-300 text-sm">Control de Asistencias</p>
          </div>
        </div>
      </div>
      
      <nav className="mt-6">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={`w-full flex items-center px-6 py-3 text-left transition-colors ${
                isActive
                  ? "text-turquoise bg-slate-700 border-r-4 border-turquoise"
                  : "text-slate-300 hover:text-white hover:bg-slate-700"
              }`}
            >
              <Icon className="mr-3 h-5 w-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
