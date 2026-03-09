import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { storage } from "./storage";
import { startCampaignExecution } from "./outbound";
import { generateHunchesForOrg } from "./routes";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);

      const runActivityLogPurge = async () => {
        try {
          const deleted = await storage.purgeOldActivityLogs(90);
          if (deleted > 0) {
            log(`Purged ${deleted} activity log entries older than 90 days`, "purge");
          }
        } catch (err) {
          log(`Activity log purge failed: ${err}`, "purge");
        }
      };

      runActivityLogPurge();

      const ONE_DAY_MS = 24 * 60 * 60 * 1000;
      setInterval(runActivityLogPurge, ONE_DAY_MS);

      const checkScheduledCampaigns = async () => {
        try {
          const due = await storage.getScheduledCampaigns();
          for (const campaign of due) {
            log(`Executing scheduled campaign: ${campaign.name} (${campaign.id})`, "scheduler");
            const result = await startCampaignExecution(campaign.id, campaign.organizationId, false);
            if (!result.success) {
              log(`Scheduled campaign ${campaign.id} failed to start: ${result.message}`, "scheduler");
            }
          }
        } catch (err) {
          log(`Campaign scheduler check failed: ${err}`, "scheduler");
        }
      };

      setInterval(checkScheduledCampaigns, 60000);

      const runWeeklyHunches = async () => {
        const now = new Date();
        if (now.getDay() !== 1) return; // Monday only
        if (now.getHours() !== 6 || now.getMinutes() > 5) return; // 6:00-6:05 AM window
        try {
          const orgs = await storage.getOrganizations();
          for (const org of orgs) {
            const settings = (org.settings as Record<string, any>) || {};
            if (settings.hunchesEnabled === false) continue;
            log(`Generating weekly hunches for org: ${org.name} (${org.id})`, "hunches");
            try {
              const hunches = await generateHunchesForOrg(org.id);
              log(`Generated ${hunches.length} hunches for ${org.name}`, "hunches");
            } catch (err) {
              log(`Hunch generation failed for ${org.name}: ${err}`, "hunches");
            }
          }
        } catch (err) {
          log(`Weekly hunch scheduler failed: ${err}`, "hunches");
        }
      };

      setInterval(runWeeklyHunches, 5 * 60 * 1000);

      const checkTriggerConditions = async () => {
        try {
          const orgs = await storage.getOrganizations();
          for (const org of orgs) {
            const orgAgents = await storage.getAgents(org.id);
            for (const agent of orgAgents) {
              const triggers = (agent.triggers as any[]) || [];
              const enabledTriggers = triggers.filter((t: any) => t.enabled);
              if (enabledTriggers.length === 0) continue;

              for (const trigger of enabledTriggers) {
                if (trigger.type === 'stale_lead') {
                  const thresholdHours = trigger.config?.thresholdHours || 24;
                  const cutoff = new Date(Date.now() - thresholdHours * 60 * 60 * 1000);
                  const convs = await storage.getConversations(org.id, { agentId: agent.id });
                  const staleConvs = convs.filter(c =>
                    c.status === 'open' && c.lastMessageAt && new Date(c.lastMessageAt) < cutoff
                  );
                  if (staleConvs.length > 0) {
                    log(`Trigger "${trigger.name}": ${staleConvs.length} stale leads for agent ${agent.name}`, "triggers");
                    for (const conv of staleConvs.slice(0, 5)) {
                      await storage.createNotification({
                        userId: null as any,
                        organizationId: org.id,
                        type: 'trigger_alert',
                        title: `Stale Lead: ${conv.customerName}`,
                        message: `${trigger.name} — ${conv.customerName} has had no activity for ${thresholdHours}+ hours. Actions: ${trigger.config.actions.map((a: any) => a.type).join(' → ')}`,
                        relatedEntityId: conv.id,
                      });
                    }
                  }
                }
              }
            }
          }
        } catch (err) {
          log(`Trigger condition check failed: ${err}`, "triggers");
        }
      };

      setInterval(checkTriggerConditions, 15 * 60 * 1000);
    },
  );
})();
