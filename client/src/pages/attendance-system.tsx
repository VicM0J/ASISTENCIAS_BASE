import { useState } from "react";
import SidebarNavigation from "@/components/sidebar-navigation";
import CheckInInterface from "@/components/check-in-interface";
import EmployeeManagement from "@/components/employee-management";
import AddEmployeeForm from "@/components/add-employee-form";
import CredentialGenerator from "@/components/credential-generator";
import ReportsGeneration from "@/components/reports-generation";
import SettingsConfiguration from "@/components/settings-configuration";
import EmployeeDetailsModal from "@/components/employee-details-modal";

export default function AttendanceSystem() {
  const [activeSection, setActiveSection] = useState("checkin");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleViewEmployeeDetails = (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
    setIsModalOpen(true);
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case "checkin":
        return <CheckInInterface />;
      case "employees":
        return <EmployeeManagement onViewDetails={handleViewEmployeeDetails} />;
      case "add-employee":
        return <AddEmployeeForm onSuccess={() => setActiveSection("employees")} />;
      case "credentials":
        return <CredentialGenerator />;
      case "reports":
        return <ReportsGeneration />;
      case "settings":
        return <SettingsConfiguration />;
      default:
        return <CheckInInterface />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <SidebarNavigation 
        activeSection={activeSection} 
        onSectionChange={setActiveSection} 
      />
      
      <div className="flex-1 overflow-auto">
        {renderActiveSection()}
      </div>

      {isModalOpen && selectedEmployeeId && (
        <EmployeeDetailsModal
          employeeId={selectedEmployeeId}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedEmployeeId(null);
          }}
        />
      )}
    </div>
  );
}
