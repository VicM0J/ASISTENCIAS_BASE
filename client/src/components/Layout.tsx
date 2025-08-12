import { useState, useEffect } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Auto-collapse sidebar on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-surface">
      <Header onMenuToggle={toggleSidebar} />
      
      <div className="flex h-screen pt-16">
        <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
        
        <main 
          className={cn(
            "flex-1 transition-all duration-300 page-transition overflow-auto",
            sidebarCollapsed ? "main-expanded" : "lg:ml-64"
          )}
          data-testid="main-content"
        >
          {children}
        </main>
      </div>

      {/* Mobile overlay */}
      {!sidebarCollapsed && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={toggleSidebar}
          data-testid="sidebar-overlay"
        />
      )}
    </div>
  );
}
