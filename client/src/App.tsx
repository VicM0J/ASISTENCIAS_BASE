import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/Layout";
import CheckInOut from "@/pages/CheckInOut";
import Employees from "@/pages/Employees";
import AddEmployee from "@/pages/AddEmployee";
import Schedules from "@/pages/Schedules";
import Credentials from "@/pages/Credentials";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/not-found";
import { useEffect } from "react";
import { isTouchDevice } from "@/lib/utils";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={CheckInOut} />
        <Route path="/checkin" component={CheckInOut} />
        <Route path="/employees" component={Employees} />
        <Route path="/add-employee" component={AddEmployee} />
        <Route path="/schedules" component={Schedules} />
        <Route path="/credentials" component={Credentials} />
        <Route path="/reports" component={Reports} />
        <Route path="/settings" component={Settings} />
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
