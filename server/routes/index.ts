import type { Express } from "express";
import { registerHealthRoutes } from "./health";
import { registerAuthRoutes } from "./auth";
import { registerBillingRoutes } from "./billing";

/**
 * Register all domain route files.
 * Each file exports a registerXxxRoutes(app) function.
 * Add new route files here as they are extracted from routes.ts.
 */
export function registerDomainRoutes(app: Express) {
  registerHealthRoutes(app);
  registerAuthRoutes(app);
  registerBillingRoutes(app);
}
