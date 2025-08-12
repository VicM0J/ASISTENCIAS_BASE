import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/Layout";
import CheckInOut from "./pages/CheckInOut";
import Employees from "./pages/employees";
import AddEmployee from "./pages/AddEmployee";
import EditEmployee from "./pages/EditEmployee";
import EmployeeDetails from "./pages/EmployeeDetails";
import Schedules from "./pages/Schedules";
import Reports from "./pages/reports";
import Attendances from "./pages/Attendances";
import Settings from "./pages/settings";
import Credentials from "./pages/credentials";
import NotFound from "./pages/not-found";
import { useEffect } from "react";
import { isTouchDevice } from "@/lib/utils";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={CheckInOut} />
        <Route path="/checkin" component={CheckInOut} />
        <Route path="/employees" component={Employees} />
        <Route path="/employees/:id" component={EmployeeDetails} />
        <Route path="/employees/edit/:id" component={EditEmployee} />
        <Route path="/add-employee" component={AddEmployee} />
        <Route path="/schedules" component={Schedules} />
        <Route path="/reports" component={Reports} />
        <Route path="/attendances" component={Attendances} />
        <Route path="/settings" component={Settings} />
        <Route path="/credentials" component={Credentials} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  useEffect(() => {
    // Add touch device class for CSS optimizations
    if (isTouchDevice()) {
      document.body.classList.add('touch-device');
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;