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
import AgentCreatePage from "@/pages/agents-create";
import DrivePage from "@/pages/drive";
import InsightsPage from "@/pages/insights";
import WorkCenterPage from "@/pages/work-center";
import ActivityPage from "@/pages/activity";
import SettingsPage from "@/pages/settings";
import ProfilePage from "@/pages/profile";
import WidgetLandingPage from "@/pages/widget-landing";

function Router() {
  return (
    <Switch>
      <Route path="/w/demo" component={WidgetLandingPage} />
      <Route>
        <AppLayout>
          <Switch>
            <Route path="/" component={MainPage} />
            <Route path="/agents" component={AgentsPage} />
            <Route path="/agents/create" component={AgentCreatePage} />
            <Route path="/drive" component={DrivePage} />
            <Route path="/insights" component={InsightsPage} />
            <Route path="/work-center" component={WorkCenterPage} />
            <Route path="/activity" component={ActivityPage} />
            <Route path="/settings/system" component={SettingsPage} />
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
