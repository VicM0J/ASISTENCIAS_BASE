import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, Settings } from "lucide-react";
import { formatDate, formatTime } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

interface HeaderProps {
  onMenuToggle: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  const { data: company } = useQuery({
    queryKey: ["/api/company"],
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuToggle}
            className="lg:hidden p-2 hover:bg-gray-100"
            data-testid="menu-toggle"
          >
            <Menu className="h-6 w-6 text-gray-600" />
          </Button>
          
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">
                {company?.name?.[0] || "J"}
              </span>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900" data-testid="company-name">
                {company?.name || "JASANA"}
              </h1>
              <p className="text-sm text-gray-500">Control de Asistencias</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900" data-testid="current-time">
              {formatTime(currentTime)}
            </p>
            <p className="text-xs text-gray-500" data-testid="current-date">
              {formatDate(currentTime)}
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="p-2 rounded-full hover:bg-gray-100"
            data-testid="settings-button"
          >
            <Settings className="h-5 w-5 text-gray-600" />
          </Button>
        </div>
      </div>
    </header>
  );
}
