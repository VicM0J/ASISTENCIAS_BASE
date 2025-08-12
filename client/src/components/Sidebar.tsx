import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  Clock, 
  Users, 
  UserPlus, 
  Calendar, 
  IdCard, 
  BarChart3, 
  Settings,
  ChevronLeft,
  ChevronRight,
  CheckSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navigation = [
  { href: "/checkin", label: "Check In/Out", icon: Clock },
  { href: "/employees", label: "Empleados", icon: Users },
  { href: "/add-employee", label: "Añadir Empleado", icon: UserPlus },
  { href: "/schedules", label: "Horarios", icon: Calendar },
  { href: "/attendances", label: "Asistencias", icon: CheckSquare },
  { href: "/credentials", label: "Credenciales", icon: IdCard },
  { href: "/reports", label: "Reportes", icon: BarChart3 },
  { href: "/settings", label: "Configuración", icon: Settings },
];

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const [location, navigate] = useLocation();

  return (
    <aside 
      className={cn(
        "fixed top-16 bottom-0 left-0 z-40 bg-white shadow-lg border-r border-gray-200",
        "transform transition-all duration-300 overflow-hidden",
        collapsed ? "w-16" : "w-64",
        "lg:static lg:top-0"
      )}
      data-testid="sidebar"
    >
      {/* Collapse/Expand Button */}
      <div className="flex justify-end p-2 border-b border-gray-200">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="h-8 w-8 p-0"
          data-testid="sidebar-toggle"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      <nav className="p-2 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = location === item.href || (item.href === "/checkin" && location === "/");
          const Icon = item.icon;

          return (
            <button
              key={item.href}
              onClick={() => navigate(item.href)}
              className={cn(
                "flex items-center w-full p-3 rounded-lg transition-colors",
                "hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary",
                "tablet-optimized touch-target",
                isActive && "bg-primary text-white hover:bg-primary/90",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? item.label : undefined}
              data-testid={`nav-${item.href.replace('/', '')}`}
            >
              <Icon className={cn("h-5 w-5 flex-shrink-0", collapsed ? "" : "mr-3")} />
              {!collapsed && <span className="font-medium whitespace-nowrap">{item.label}</span>}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}