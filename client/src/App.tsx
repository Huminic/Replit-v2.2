import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AppProvider } from "@/contexts/AppContext";
import { AppLayout } from "@/components/layout/AppLayout";
import NotFound from "@/pages/not-found";
import MainPage from "@/pages/main";
import AgentsPage from "@/pages/agents";
import InsightsPage from "@/pages/insights";
import TeamboxPage from "@/pages/teambox";
import MyWorkPage from "@/pages/my-work";
import SalesPage from "@/pages/sales";
import ServicePage from "@/pages/service";
import MarketingPage from "@/pages/marketing";
import ManagementPage from "@/pages/management";
import SettingsPage from "@/pages/settings";
import ProfilePage from "@/pages/profile";
import WidgetLandingPage from "@/pages/widget-landing";
import BillingManagementPage from "@/pages/billing-management";
import OrgWizardPage from "@/pages/org-wizard";

function Router() {
  return (
    <Switch>
      <Route path="/w/demo" component={WidgetLandingPage} />
      <Route>
        <AppLayout>
          <Switch>
            <Route path="/" component={MainPage} />
            <Route path="/teambox" component={TeamboxPage} />
            <Route path="/my-work" component={MyWorkPage} />
            <Route path="/sales" component={SalesPage} />
            <Route path="/service" component={ServicePage} />
            <Route path="/marketing" component={MarketingPage} />
            <Route path="/management" component={ManagementPage} />
            <Route path="/agents" component={AgentsPage} />
            <Route path="/insights" component={InsightsPage} />
            <Route path="/settings/system" component={SettingsPage} />
            <Route path="/settings/billing" component={BillingManagementPage} />
            <Route path="/settings/org-wizard" component={OrgWizardPage} />
            <Route path="/settings" component={SettingsPage} />
            <Route path="/profile" component={ProfilePage} />
            <Route path="/profile/preferences" component={ProfilePage} />
            <Route path="/profile/billing" component={ProfilePage} />
            <Route component={NotFound} />
          </Switch>
        </AppLayout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <AppProvider>
            <Toaster />
            <Router />
          </AppProvider>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
