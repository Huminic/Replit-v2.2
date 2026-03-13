import type { Express } from "express";
import { registerHealthRoutes } from "./health";
import { registerAuthRoutes } from "./auth";
import { registerBillingRoutes } from "./billing";
import { registerUserRoutes } from "./users";
import { registerRoleRoutes } from "./roles";
import { registerOrganizationRoutes } from "./organizations";
import { registerNotificationRoutes } from "./notifications";
import { registerSmsRoutes } from "./sms";
import { registerCampaignRoutes } from "./campaigns";
import { registerConversationRoutes } from "./conversations";
import { registerAgentRoutes } from "./agents";
import { registerChatRoutes } from "./chat";
import { registerDocumentRoutes } from "./documents";
import { registerWidgetRoutes } from "./widgets";
import { registerHunchRoutes } from "./hunches";
import { registerSettingsRoutes } from "./settings";
import { registerWebhookRoutes } from "./webhooks";
import { registerPublicRoutes } from "./public";
import { registerProxyRoutes } from "./proxy";
import { registerUsageRoutes } from "./usage";
import { registerTaskRoutes } from "./tasks";
import { registerAppointmentRoutes } from "./appointments";
import { registerFavoriteRoutes } from "./favorites";
import { registerMetricsRoutes } from "./metrics";
import { registerIntegrationRoutes } from "./integrations";
import { registerSyncRoutes } from "./sync";
import { registerInsightRoutes } from "./insights";

/**
 * Register all domain route files.
 * Each file exports a registerXxxRoutes(app) function.
 */
export function registerDomainRoutes(app: Express) {
  registerHealthRoutes(app);
  registerAuthRoutes(app);
  registerUserRoutes(app);
  registerRoleRoutes(app);
  registerOrganizationRoutes(app);
  registerBillingRoutes(app);
  registerNotificationRoutes(app);
  registerSmsRoutes(app);
  registerCampaignRoutes(app);
  registerConversationRoutes(app);
  registerAgentRoutes(app);
  registerChatRoutes(app);
  registerDocumentRoutes(app);
  registerWidgetRoutes(app);
  registerHunchRoutes(app);
  registerSettingsRoutes(app);
  registerWebhookRoutes(app);
  registerPublicRoutes(app);
  registerProxyRoutes(app);
  registerUsageRoutes(app);
  registerTaskRoutes(app);
  registerAppointmentRoutes(app);
  registerFavoriteRoutes(app);
  registerMetricsRoutes(app);
  registerIntegrationRoutes(app);
  registerSyncRoutes(app);
  registerInsightRoutes(app);
}
