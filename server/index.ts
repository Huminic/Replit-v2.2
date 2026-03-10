import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { storage } from "./storage";
import { startCampaignExecution, processOutboundSend } from "./outbound";
import { generateHunchesForOrg } from "./routes";
import type { Organization, Agent } from "@shared/schema";

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

      (async () => {
        try {
          const orgs = await storage.getOrganizations();
          const serraHonda = orgs.find(o => o.name === "Serra Honda");
          if (serraHonda) {
            const settings = (serraHonda.settings || {}) as Record<string, any>;
            if (!settings.textmagicPhone) {
              await storage.updateOrganization(serraHonda.id, {
                settings: { ...settings, textmagicPhone: "18338096836" }
              });
              log("Set textmagicPhone for Serra Honda: 18338096836");
            }
          }
        } catch (err) {
          log(`Failed to set default textmagicPhone: ${err}`);
        }
      })();

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

      async function executeTriggerAction(actionType: string, phone: string | null, email: string | null, customerName: string, org: Organization, agent: Agent) {
        const agentName = agent.name;
        const dealershipName = org.name;

        if (actionType === 'sms' && phone) {
          const msg = `Hi ${customerName}, this is ${agentName} from ${dealershipName}. We noticed you might still be looking — is there anything we can help with? Reply or call us anytime!`;
          log(`Trigger action: sending SMS to ${phone} for ${customerName}`, "triggers");
          await processOutboundSend({
            organizationId: org.id,
            channel: 'sms',
            to: phone,
            messageContent: msg,
          });
        } else if (actionType === 'call' && phone) {
          log(`Trigger action: initiating call to ${phone} for ${customerName}`, "triggers");
          await processOutboundSend({
            organizationId: org.id,
            channel: 'phone',
            to: phone,
            messageContent: `Follow-up call for ${customerName} from ${dealershipName}`,
          });
        } else if (actionType === 'email' && email) {
          const msg = `Subject: Following up from ${dealershipName}\n\nHi ${customerName},\n\nThis is ${agentName} from ${dealershipName}. I wanted to follow up and see if you're still interested. We'd love to help you find what you're looking for.\n\nFeel free to reply to this email or give us a call anytime.\n\nBest regards,\n${agentName}\n${dealershipName}`;
          log(`Trigger action: sending email to ${email} for ${customerName}`, "triggers");
          await processOutboundSend({
            organizationId: org.id,
            channel: 'email',
            to: email,
            messageContent: msg,
          });
        } else {
          log(`Trigger action: skipping ${actionType} — no ${actionType === 'email' ? 'email' : 'phone'} for ${customerName}`, "triggers");
        }
      }

      const checkTriggerConditions = async () => {
        try {
          const orgs = await storage.getOrganizations();
          for (const org of orgs) {
            const orgAgents = await storage.getAgents(org.id);
            const orgUsers = await storage.getUsers(org.id);
            const adminUser = orgUsers.find(u => (u.role as any)?.name === 'org_admin' || (u.role as any)?.name === 'partner_admin' || (u.role as any)?.name === 'super_admin') || orgUsers[0];

            for (const agent of orgAgents) {
              const triggers = (agent.triggers as any[]) || [];
              const enabledTriggers = triggers.filter((t: any) => t.enabled);
              if (enabledTriggers.length === 0) continue;

              for (const trigger of enabledTriggers) {
                if (trigger.type === 'new_lead_followup') {
                  const delayHours = trigger.config?.delayHours || 48;
                  const messageTemplate = trigger.config?.messageTemplate || 'Hi {customerFirstName}, this is {agentName} from {dealerStoreName}. I just wanted to follow up with you to see if you had any questions and if your experience with our dealer so far has been a good one. Please let me know if I can be of any assistance or if you have any feedback.';
                  const dueLeads = await storage.getLeadsDueForFollowup(org.id, delayHours, 10);
                  if (dueLeads.length > 0) {
                    log(`Trigger "${trigger.name}": ${dueLeads.length} leads due for ${delayHours}h follow-up for agent ${agent.name}`, "triggers");
                    for (const lead of dueLeads) {
                      const customerFirstName = (lead.customerName || 'there').split(' ')[0];
                      const msg = messageTemplate
                        .replace(/\{customerFirstName\}/g, customerFirstName)
                        .replace(/\{agentName\}/g, agent.name)
                        .replace(/\{dealerStoreName\}/g, org.name);

                      log(`Trigger "${trigger.name}": sending follow-up SMS to ${lead.customerPhone} for ${lead.customerName || 'Unknown'}`, "triggers");
                      try {
                        await processOutboundSend({
                          organizationId: org.id,
                          channel: 'sms',
                          to: lead.customerPhone!,
                          messageContent: msg,
                        });
                        await storage.markFollowupSent(lead.id);
                        log(`Trigger "${trigger.name}": follow-up sent and marked for lead ${lead.sourceId || lead.id}`, "triggers");

                        if (adminUser) {
                          await storage.createNotification({
                            userId: adminUser.id,
                            organizationId: org.id,
                            type: 'trigger_alert',
                            title: `Follow-up Sent: ${lead.customerName || 'Customer'}`,
                            message: `${trigger.name} — Follow-up SMS sent to ${lead.customerPhone} for ${lead.customerName || 'Unknown'} (${delayHours}h after lead created)`,
                            relatedEntityId: lead.id,
                          });
                        }
                      } catch (sendErr: any) {
                        log(`Trigger "${trigger.name}": failed to send follow-up for ${lead.customerName}: ${sendErr.message}`, "triggers");
                      }
                    }
                  }
                }

                if (trigger.type === 'stale_lead') {
                  const thresholdHours = trigger.config?.thresholdHours || 24;
                  const cutoff = new Date(Date.now() - thresholdHours * 60 * 60 * 1000);
                  const convs = await storage.getConversations(org.id, { agentId: agent.id });
                  const staleConvs = convs.filter(c =>
                    c.status === 'open' && c.lastMessageAt && new Date(c.lastMessageAt) < cutoff
                  );
                  if (staleConvs.length > 0) {
                    log(`Trigger "${trigger.name}": ${staleConvs.length} stale leads for agent ${agent.name}`, "triggers");
                    const actions = trigger.config?.actions || [];

                    for (const conv of staleConvs.slice(0, 5)) {
                      if (adminUser) {
                        await storage.createNotification({
                          userId: adminUser.id,
                          organizationId: org.id,
                          type: 'trigger_alert',
                          title: `Stale Lead: ${conv.customerName}`,
                          message: `${trigger.name} — ${conv.customerName} has had no activity for ${thresholdHours}+ hours. Actions: ${actions.map((a: any) => a.type).join(' → ')}`,
                          relatedEntityId: conv.id,
                        });
                      }

                      const customerPhone = conv.customerPhone;
                      const customerEmail = conv.customerEmail;
                      const customerName = conv.customerName || 'Customer';

                      for (const action of actions) {
                        const waitMs = (action.waitMinutes || 0) * 60 * 1000;
                        if (waitMs > 0) {
                          log(`Trigger "${trigger.name}": scheduling ${action.type} for ${customerName} in ${action.waitMinutes}m`, "triggers");
                          setTimeout(async () => {
                            try {
                              await executeTriggerAction(action.type, customerPhone, customerEmail, customerName, org, agent);
                            } catch (actErr: any) {
                              log(`Trigger action ${action.type} failed for ${customerName}: ${actErr.message}`, "triggers");
                            }
                          }, waitMs);
                        } else {
                          try {
                            await executeTriggerAction(action.type, customerPhone, customerEmail, customerName, org, agent);
                          } catch (actErr: any) {
                            log(`Trigger action ${action.type} failed for ${customerName}: ${actErr.message}`, "triggers");
                          }
                        }
                      }
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
