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

/**
 * Register all domain route files.
 * Each file exports a registerXxxRoutes(app) function.
 * Add new route files here as they are extracted from routes.ts.
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
}
