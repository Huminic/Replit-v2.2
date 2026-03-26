import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AppProvider } from "@/contexts/AppContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { SessionTimeoutDialog } from "@/components/auth/SessionTimeoutDialog";
import { ErrorBoundary } from "@/components/ErrorBoundary";
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
import BillingDashboard from "@/pages/BillingDashboard";
import BillingUsagePage from "@/pages/BillingUsage";
import BillingPlanPage from "@/pages/BillingPlan";
import BillingInvoicesPage from "@/pages/BillingInvoices";
import OrgWizardPage from "@/pages/org-wizard";
import LoginPage from "@/pages/login";
import ForgotPasswordPage from "@/pages/forgot-password";
import ResetPasswordPage from "@/pages/reset-password";
import UsagePage from "@/pages/usage";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/reset-password" component={ResetPasswordPage} />
      <Route path="/w/:slug" component={WidgetLandingPage} />
      <Route path="/p/:slug" component={WidgetLandingPage} />
      <Route>
        <ProtectedRoute>
          <AppProvider>
            <SessionTimeoutDialog />
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
                <Route path="/insights" component={() => <InsightsPage />} />
                <Route path="/settings/system" component={SettingsPage} />
                <Route path="/settings/billing/usage" component={BillingUsagePage} />
                <Route path="/settings/billing/plan" component={BillingPlanPage} />
                <Route path="/settings/billing/invoices" component={BillingInvoicesPage} />
                <Route path="/settings/billing" component={BillingDashboard} />
                <Route path="/settings/org-wizard" component={OrgWizardPage} />
                <Route path="/settings" component={SettingsPage} />
                <Route path="/profile" component={ProfilePage} />
                <Route path="/profile/preferences" component={ProfilePage} />
                <Route path="/profile/billing" component={ProfilePage} />
                <Route path="/usage" component={UsagePage} />
                <Route component={NotFound} />
              </Switch>
            </AppLayout>
          </AppProvider>
        </ProtectedRoute>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ThemeProvider>
            <AuthProvider>
              <Toaster />
              <Router />
            </AuthProvider>
          </ThemeProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
