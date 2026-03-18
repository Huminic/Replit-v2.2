import type { Express } from "express";
import { authenticateToken } from "../auth";
import { storage } from "../storage";
import { billingService } from "../services/billingService";

export function registerBillingRoutes(app: Express) {
  app.get("/api/billing/summary", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const org = await storage.getOrganization(req.user.organizationId);
      if (!org || !org.billingCustomerId) {
        return res.json({ configured: false, message: "Billing not configured" });
      }

      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const endDate = now.toISOString();

      const [usage, walletBalance, planDetails] = await Promise.all([
        billingService.getUsageSummary(org.billingCustomerId, startDate, endDate),
        org.billingWalletId ? billingService.getWalletBalance(org.billingWalletId) : Promise.resolve({ balance: 0, currency: "USD" }),
        org.billingPlanId ? billingService.getPlanDetails(org.billingPlanId) : Promise.resolve(null),
      ]);

      return res.json({
        configured: true,
        plan: planDetails ? { name: planDetails.name, id: planDetails.id } : null,
        tier: org.billingTier || null,
        creditBalance: walletBalance,
        usage,
      });
    } catch (err: any) {
      console.log(`[Billing] summary error: ${err.message}`);
      return res.status(500).json({ message: "Failed to fetch billing summary" });
    }
  });

  app.get("/api/billing/usage", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const org = await storage.getOrganization(req.user.organizationId);
      if (!org || !org.billingCustomerId) {
        return res.json({ configured: false, message: "Billing not configured" });
      }

      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const endDate = now.toISOString();

      const usage = await billingService.getUsageSummary(org.billingCustomerId, startDate, endDate);
      return res.json({ configured: true, billingPeriod: { start: startDate, end: endDate }, usage });
    } catch (err: any) {
      console.log(`[Billing] usage error: ${err.message}`);
      return res.status(500).json({ message: "Failed to fetch usage data" });
    }
  });

  app.get("/api/billing/invoices", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const org = await storage.getOrganization(req.user.organizationId);
      if (!org || !org.billingCustomerId) {
        return res.json({ configured: false, message: "Billing not configured" });
      }

      const invoices = await billingService.getInvoices(org.billingCustomerId);
      return res.json({ configured: true, invoices });
    } catch (err: any) {
      console.log(`[Billing] invoices error: ${err.message}`);
      return res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  app.get("/api/billing/plan", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const org = await storage.getOrganization(req.user.organizationId);
      if (!org || !org.billingCustomerId) {
        return res.json({ configured: false, message: "Billing not configured" });
      }

      if (!org.billingPlanId) {
        return res.json({ configured: true, plan: null, entitlements: [] });
      }

      const [planDetails, entitlements] = await Promise.all([
        billingService.getPlanDetails(org.billingPlanId),
        billingService.getEntitlements(org.billingPlanId),
      ]);

      return res.json({ configured: true, plan: planDetails, entitlements });
    } catch (err: any) {
      console.log(`[Billing] plan error: ${err.message}`);
      return res.status(500).json({ message: "Failed to fetch plan details" });
    }
  });

  app.get("/api/billing/plans", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const plans = await billingService.getPlans();
      return res.json({ plans });
    } catch (err: any) {
      console.log(`[Billing] plans error: ${err.message}`);
      return res.status(500).json({ message: "Failed to fetch plans" });
    }
  });

  app.get("/api/billing/entitlements", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const org = await storage.getOrganization(req.user.organizationId);
      if (!org || !org.billingCustomerId) {
        return res.json({ configured: false, message: "Billing not configured" });
      }

      const allFeatureKeys = [
        ...billingService.getMeters().map(m => ({ key: m.id, name: m.name })),
        { key: "agent_slots", name: "Agent Slots" },
        { key: "widget_slots", name: "Widget Slots" },
        { key: "module_slots", name: "Module Slots" },
        { key: "landing_page_slots", name: "Landing Page Slots" },
        { key: "voice_number_slots", name: "Voice Number Slots" },
        { key: "sms_number_slots", name: "SMS Number Slots" },
        { key: "location_slots", name: "Location Slots" },
        { key: "trigger_slots", name: "Trigger Slots" },
        { key: "campaign_slots", name: "Campaign Slots" },
        { key: "custom_avatar_slots", name: "Custom Avatar Slots" },
        { key: "consulting_hours", name: "Consulting Hours" },
        { key: "crm_integration", name: "CRM Integration" },
        { key: "advanced_analytics", name: "Advanced Analytics" },
        { key: "crm_guru", name: "CRM Guru Agent" },
        { key: "generative_studio", name: "Generative Studio" },
        { key: "competitive_intel", name: "Competitive Intelligence" },
      ];

      const entitlements = await Promise.all(
        allFeatureKeys.map(async (f) => {
          const result = await billingService.checkEntitlement(org.billingCustomerId!, f.key);
          return {
            feature: f.key,
            name: f.name,
            ...result,
          };
        })
      );

      return res.json({ configured: true, entitlements });
    } catch (err: any) {
      console.log(`[Billing] entitlements error: ${err.message}`);
      return res.status(500).json({ message: "Failed to fetch entitlements" });
    }
  });

  // Entitlement check endpoint — used by tests and external callers
  app.post("/api/entitlements/check", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const org = await storage.getOrganization(req.user.organizationId);
      if (!org || !org.billingCustomerId) {
        return res.json({ configured: false, entitled: false, message: "Billing not configured" });
      }

      const { feature_key } = req.body;
      if (!feature_key || typeof feature_key !== "string") {
        return res.status(400).json({ message: "feature_key is required" });
      }

      const result = await billingService.checkEntitlement(org.billingCustomerId, feature_key);
      return res.json({ configured: true, feature: feature_key, ...result });
    } catch (err: any) {
      console.log(`[Billing] entitlement check error: ${err.message}`);
      return res.status(500).json({ message: "Failed to check entitlement" });
    }
  });

  app.post("/api/billing/topup", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const org = await storage.getOrganization(req.user.organizationId);
      if (!org || !org.billingCustomerId) {
        return res.json({ configured: false, message: "Billing not configured" });
      }

      if (!org.billingWalletId) {
        return res.status(400).json({ message: "No wallet configured for this organization" });
      }

      const { amount } = req.body;
      if (!amount || typeof amount !== "number" || amount <= 0) {
        return res.status(400).json({ message: "Valid positive amount is required" });
      }

      await billingService.topUpWallet(org.billingWalletId, amount);
      const balance = await billingService.getWalletBalance(org.billingWalletId);
      return res.json({ success: true, balance });
    } catch (err: any) {
      console.log(`[Billing] topup error: ${err.message}`);
      return res.status(500).json({ message: "Failed to top up wallet" });
    }
  });
}
