import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";

import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import PendingApproval from "@/pages/PendingApproval";

import Dashboard from "@/pages/Dashboard";
import Reports from "@/pages/Reports";
import ReportNew from "@/pages/ReportNew";
import ReportDetail from "@/pages/ReportDetail";
import Members from "@/pages/Members";
import KycQueue from "@/pages/KycQueue";
import Tasks from "@/pages/Tasks";
import Announcements from "@/pages/Announcements";
import Events from "@/pages/Events";
import Analytics from "@/pages/Analytics";
import Notifications from "@/pages/Notifications";
import Delegations from "@/pages/Delegations";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/pending-approval" component={PendingApproval} />

      <Route path="/:rest*">
        <ProtectedRoute>
          <AppLayout>
            <Switch>
              <Route path="/dashboard" component={Dashboard} />
              <Route path="/reports/new" component={ReportNew} />
              <Route path="/reports/:id" component={ReportDetail} />
              <Route path="/reports" component={Reports} />
              <Route path="/members" component={Members} />
              <Route path="/tasks" component={Tasks} />
              <Route path="/announcements" component={Announcements} />
              <Route path="/events" component={Events} />
              <Route path="/kyc-queue" component={KycQueue} />
              <Route path="/delegations" component={Delegations} />
              <Route path="/analytics" component={Analytics} />
              <Route path="/settings" component={Settings} />
              <Route path="/notifications" component={Notifications} />
              <Route component={NotFound} />
            </Switch>
          </AppLayout>
        </ProtectedRoute>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster richColors position="top-right" />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
