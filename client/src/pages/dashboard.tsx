import { useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import CheckInOut from "./check-in-out";
import Employees from "./employees";
import AddEmployee from "./add-employee";
import Credentials from "./credentials";
import Reports from "./reports";
import Settings from "./settings";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("checkin");

  const renderContent = () => {
    switch (activeTab) {
      case "checkin":
        return <CheckInOut />;
      case "employees":
        return <Employees />;
      case "add-employee":
        return <AddEmployee />;
      case "credentials":
        return <Credentials />;
      case "reports":
        return <Reports />;
      case "settings":
        return <Settings />;
      default:
        return <CheckInOut />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 overflow-auto">
        {renderContent()}
      </main>
    </div>
  );
}
