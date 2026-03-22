import { storage } from "../storage";
import { startCampaignExecution, processOutboundSend } from "../outbound";
import { generateHunchesForOrg } from "./hunchService";
import { log } from "../index";
import type { Organization, Agent } from "@shared/schema";

const instanceId = `instance-${process.pid}-${Date.now()}`;

async function initDevDefaults() {
  if (process.env.NODE_ENV === 'production') return;
  try {
    const defaultTmPhone = process.env.DEFAULT_TEXTMAGIC_PHONE || "18338096836";
    const orgs = await storage.getOrganizations();
    const serraHonda = orgs.find(o => o.name === "Serra Honda");
    if (serraHonda) {
      const settings = (serraHonda.settings || {}) as Record<string, any>;
      if (!settings.textmagicPhone) {
        await storage.updateOrganization(serraHonda.id, {
          settings: { ...settings, textmagicPhone: defaultTmPhone }
        });
        log(`Set textmagicPhone for Serra Honda: ${defaultTmPhone}`);
      }
    }
  } catch (err) {
    log(`Failed to set default textmagicPhone: ${err}`);
  }
}

async function runActivityLogPurge() {
  try {
    const deleted = await storage.purgeOldActivityLogs(90);
    if (deleted > 0) {
      log(`Purged ${deleted} activity log entries older than 90 days`, "purge");
    }
  } catch (err) {
    log(`Activity log purge failed: ${err}`, "purge");
  }
}

async function checkScheduledCampaigns() {
  try {
    const locked = await storage.acquireSchedulerLock('campaign_scheduler', instanceId, 5);
    if (!locked) {
      log(`Campaign scheduler lock held by another instance, skipping`, "scheduler");
      return;
    }
    try {
      const due = await storage.getScheduledCampaigns();
      for (const campaign of due) {
        log(`Executing scheduled campaign: ${campaign.name} (${campaign.id})`, "scheduler");
        const result = await startCampaignExecution(campaign.id, campaign.organizationId, false);
        if (!result.success) {
          log(`Scheduled campaign ${campaign.id} failed to start: ${result.message}`, "scheduler");
        }
      }
    } finally {
      await storage.releaseSchedulerLock('campaign_scheduler');
    }
  } catch (err) {
    log(`Campaign scheduler check failed: ${err}`, "scheduler");
  }
}

async function processScheduledActions() {
  try {
    const dueActions = await storage.getDueScheduledActions();
    for (const action of dueActions) {
      try {
        if (action.actionType === 'trigger_action') {
          const p = action.payload as any;
          const org = await storage.getOrganization(p.orgId);
          const agent = await storage.getAgent(p.agentId);
          if (org && agent) {
            await executeTriggerAction(p.type, p.phone, p.email, p.customerName, org, agent);
            log(`Executed scheduled trigger action: ${p.type} for ${p.customerName}`, "scheduler");
          }
        }

        if (action.actionType === 'queued_sms') {
          const p = action.payload as any;
          try {
            const { processOutboundSend } = await import("../outbound");
            await processOutboundSend({
              organizationId: action.organizationId,
              channel: p.channel || "sms",
              to: p.to,
              messageContent: `Follow-up: You messaged us after hours. A team member will be reaching out shortly.`,
            });
            log(`Processed queued SMS to ${p.to}`, "scheduler");
          } catch (qErr: any) {
            log(`Queued SMS to ${p.to} failed: ${qErr.message}`, "scheduler");
          }
        }
        await storage.markScheduledActionExecuted(action.id);
      } catch (actErr: any) {
        log(`Scheduled action ${action.id} failed: ${actErr.message}`, "scheduler");
        await storage.markScheduledActionExecuted(action.id);
      }
    }
  } catch (err) {
    log(`Scheduled actions check failed: ${err}`, "scheduler");
  }
}

async function runWeeklyHunches() {
  const now = new Date();
  if (now.getDay() !== 1) return;
  if (now.getHours() !== 6) return;

  try {
    const lockState = await storage.getSchedulerLock('hunch_scheduler');
    const lastRunAt = lockState?.lastRunAt;

    if (lastRunAt) {
      const timeSinceLastRun = now.getTime() - lastRunAt.getTime();
      if (timeSinceLastRun < 6 * 60 * 60 * 1000) return;
    }

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

    await storage.updateSchedulerLastRunAt('hunch_scheduler');
  } catch (err) {
    log(`Weekly hunch scheduler failed: ${err}`, "hunches");
  }
}

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

async function checkTriggerConditions() {
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
            const conversionStatuses: string[] = trigger.config?.conversionStatuses || ['SOLD'];

            const businessHoursSeq: Array<{ channel: string; waitMinutes: number; messageTemplate?: string }> = trigger.config?.businessHoursSequence || [];
            const afterHoursSeq: Array<{ channel: string; waitMinutes: number; messageTemplate?: string }> = trigger.config?.afterHoursSequence || [];
            const storeHours = trigger.config?.storeHours as { openTime?: string; closeTime?: string; closedDays?: number[] } | undefined;

            const hasMultiStep = businessHoursSeq.length > 0 || afterHoursSeq.length > 0;

            const isWithinBusinessHours = (): boolean => {
              if (!storeHours?.openTime || !storeHours?.closeTime) return true;
              const now = new Date();
              const dayOfWeek = now.getDay();
              if (storeHours.closedDays && storeHours.closedDays.includes(dayOfWeek)) return false;
              const [openH, openM] = storeHours.openTime.split(':').map(Number);
              const [closeH, closeM] = storeHours.closeTime.split(':').map(Number);
              const currentMinutes = now.getHours() * 60 + now.getMinutes();
              const openMinutes = (openH || 0) * 60 + (openM || 0);
              const closeMinutes = (closeH || 0) * 60 + (closeM || 0);
              return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
            };

            if (!hasMultiStep) {
              const dueLeads = await storage.getLeadsDueForFollowup(org.id, delayHours, 10);
              if (dueLeads.length > 0) {
                log(`Trigger "${trigger.name}": ${dueLeads.length} leads due for ${delayHours}h follow-up for agent ${agent.name}`, "triggers");
                for (const lead of dueLeads) {
                  if (conversionStatuses.includes(lead.vinStatus || '')) continue;
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
            } else {
              const duringBusiness = isWithinBusinessHours();
              const activeSequence = duringBusiness
                ? (businessHoursSeq.length > 0 ? businessHoursSeq : afterHoursSeq)
                : (afterHoursSeq.length > 0 ? afterHoursSeq : businessHoursSeq);

              if (activeSequence.length === 0) continue;

              const dueLeads = await storage.getLeadsDueForMultiStepFollowup(org.id, activeSequence.length, conversionStatuses, 20);
              if (dueLeads.length > 0) {
                log(`Trigger "${trigger.name}": ${dueLeads.length} leads in multi-step pipeline (${duringBusiness ? 'business' : 'after'} hours, ${activeSequence.length} steps) for agent ${agent.name}`, "triggers");
              }

              for (const lead of dueLeads) {
                const currentStep = lead.followupStep ?? 0;
                if (currentStep >= activeSequence.length) continue;

                const step = activeSequence[currentStep];
                const now = Date.now();

                let referenceTime: number;
                if (currentStep === 0) {
                  referenceTime = (lead.vinCreatedAt || lead.createdAt).getTime();
                  const firstWait = step.waitMinutes > 0 ? step.waitMinutes : delayHours * 60;
                  if (now - referenceTime < firstWait * 60 * 1000) continue;
                } else {
                  if (!lead.followupSentAt) continue;
                  referenceTime = lead.followupSentAt.getTime();
                  if (now - referenceTime < step.waitMinutes * 60 * 1000) continue;
                }

                const customerFirstName = (lead.customerName || 'there').split(' ')[0];
                const stepTemplate = step.messageTemplate || messageTemplate;
                const msg = stepTemplate
                  .replace(/\{customerFirstName\}/g, customerFirstName)
                  .replace(/\{agentName\}/g, agent.name)
                  .replace(/\{dealerStoreName\}/g, org.name);

                const channel = step.channel as 'sms' | 'phone' | 'email';
                let to: string | null = null;
                let effectiveMsg = msg;

                if (channel === 'sms') {
                  to = lead.customerPhone;
                } else if (channel === 'phone') {
                  to = lead.customerPhone;
                  if (!step.messageTemplate) effectiveMsg = 'Automated follow-up call';
                } else if (channel === 'email') {
                  to = lead.customerEmail;
                }

                if (!to) {
                  log(`Trigger "${trigger.name}": advancing past step ${currentStep} (${channel}) for ${lead.customerName || 'Unknown'} — no ${channel === 'email' ? 'email' : 'phone'} available`, "triggers");
                  await storage.updateFollowupStep(lead.id, currentStep + 1);
                  continue;
                }

                log(`Trigger "${trigger.name}": executing step ${currentStep + 1}/${activeSequence.length} (${channel}) for ${lead.customerName || 'Unknown'}`, "triggers");
                try {
                  await processOutboundSend({
                    organizationId: org.id,
                    channel,
                    to,
                    messageContent: effectiveMsg,
                  });
                  await storage.updateFollowupStep(lead.id, currentStep + 1);
                  log(`Trigger "${trigger.name}": step ${currentStep + 1} complete for lead ${lead.sourceId || lead.id}`, "triggers");

                  if (adminUser) {
                    await storage.createNotification({
                      userId: adminUser.id,
                      organizationId: org.id,
                      type: 'trigger_alert',
                      title: `Follow-up Step ${currentStep + 1}: ${lead.customerName || 'Customer'}`,
                      message: `${trigger.name} — Step ${currentStep + 1}/${activeSequence.length} (${channel.toUpperCase()}) sent to ${to} for ${lead.customerName || 'Unknown'}`,
                      relatedEntityId: lead.id,
                    });
                  }
                } catch (sendErr: any) {
                  log(`Trigger "${trigger.name}": step ${currentStep + 1} failed for ${lead.customerName}: ${sendErr.message}`, "triggers");
                }
              }
            }
          }

          if (trigger.type === 'stale_lead') {
            const thresholdHours = trigger.config?.thresholdHours || 24;
            const cutoff = new Date(Date.now() - thresholdHours * 60 * 60 * 1000);
            const triggerCooldownMs = 15 * 60 * 1000;
            const convs = await storage.getConversations(org.id, { agentId: agent.id });
            const staleConvs = convs.filter(c => {
              if (c.status !== 'open' || !c.lastMessageAt || new Date(c.lastMessageAt) >= cutoff) return false;
              if ((c as any).staleTriggerProcessedAt) {
                const processedAt = new Date((c as any).staleTriggerProcessedAt).getTime();
                if (Date.now() - processedAt < triggerCooldownMs) return false;
              }
              return true;
            });
            if (staleConvs.length > 0) {
              log(`Trigger "${trigger.name}": ${staleConvs.length} stale leads for agent ${agent.name}`, "triggers");
              const actions = trigger.config?.actions || [];

              for (const conv of staleConvs.slice(0, 5)) {
                await storage.updateConversation(conv.id, { staleTriggerProcessedAt: new Date() } as any);
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
                    await storage.createScheduledAction({
                      organizationId: org.id,
                      actionType: 'trigger_action',
                      payload: {
                        type: action.type,
                        phone: customerPhone,
                        email: customerEmail,
                        customerName,
                        orgId: org.id,
                        agentId: agent.id,
                        triggerName: trigger.name,
                      },
                      executeAt: new Date(Date.now() + waitMs),
                    });
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
}

/**
 * Start all scheduler tasks. Call once after server is listening.
 */
export function startSchedulers() {
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;

  // Dev-only defaults
  initDevDefaults();

  // Activity log purge (daily)
  runActivityLogPurge();
  setInterval(runActivityLogPurge, ONE_DAY_MS);

  // Campaign scheduler (every 60s)
  setInterval(checkScheduledCampaigns, 60000);

  // Scheduled actions (every 30s)
  setInterval(processScheduledActions, 30000);

  // Weekly hunches (check every 5min, runs Monday at 6am)
  setInterval(runWeeklyHunches, 5 * 60 * 1000);

  // Trigger conditions (every 15min)
  setInterval(checkTriggerConditions, 15 * 60 * 1000);

  // Escalation scheduler: check for unanswered conversations every 5 minutes
  setInterval(checkUnansweredEscalations, 5 * 60 * 1000);

  log("All schedulers started", "scheduler");
}

async function checkUnansweredEscalations() {
  try {
    const unanswered = await storage.getUnansweredConversations(30);
    if (unanswered.length === 0) return;

    for (const conv of unanswered) {
      try {
        const org = await storage.getOrganization(conv.organizationId);
        if (!org || !org.emailEnabled) continue;

        const orgAdminRole = await storage.getRoleByName("org_admin");
        if (!orgAdminRole) continue;

        const orgUsers = await storage.getUsers(conv.organizationId);
        const orgAdmin = orgUsers.find(u => u.roleId === orgAdminRole.id && u.isActive);
        if (!orgAdmin) continue;

        const msgs = await storage.getMessages(conv.id);
        const latestMessage = msgs.length > 0 ? msgs[msgs.length - 1] : null;
        const messagePreview = latestMessage ? latestMessage.content.substring(0, 200) : "No message content";

        const contactName = conv.customerName || "Unknown";
        const contactPhone = conv.customerPhone || "Unknown";
        const waitingMinutes = conv.lastMessageAt
          ? Math.round((Date.now() - new Date(conv.lastMessageAt).getTime()) / 60000)
          : 0;

        const escapeHtml = (str: string): string =>
          str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');

        if (process.env.RESEND_API_KEY) {
          const { Resend } = await import("resend");
          const resend = new Resend(process.env.RESEND_API_KEY);
          await resend.emails.send({
            from: "Nexxus Connect <no-reply@huminic.app>",
            to: orgAdmin.email,
            subject: `Unanswered message from ${contactName !== "Unknown" ? contactName : contactPhone} — ${org.name}`,
            html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1a1a1a;">Unanswered Message Alert</h2>
              <p>A customer message has been waiting for a response.</p>
              <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                <tr><td style="padding: 8px; font-weight: bold; color: #555;">Contact Name</td><td style="padding: 8px;">${escapeHtml(contactName)}</td></tr>
                <tr><td style="padding: 8px; font-weight: bold; color: #555;">Phone</td><td style="padding: 8px;">${escapeHtml(contactPhone)}</td></tr>
                <tr><td style="padding: 8px; font-weight: bold; color: #555;">Channel</td><td style="padding: 8px;">${escapeHtml(conv.channel)}</td></tr>
                <tr><td style="padding: 8px; font-weight: bold; color: #555;">Waiting</td><td style="padding: 8px;">${waitingMinutes} minutes</td></tr>
              </table>
              <div style="background: #f5f5f5; padding: 12px; border-radius: 6px; margin: 16px 0;">
                <p style="margin: 0 0 4px 0; font-weight: bold; color: #555;">Latest Message:</p>
                <p style="margin: 0; color: #333;">${escapeHtml(messagePreview)}${latestMessage && latestMessage.content.length > 200 ? "..." : ""}</p>
              </div>
              <p><a href="${process.env.APP_BASE_URL || "https://app.nexxusconnect.com"}/teambox" style="display: inline-block; background: #2563eb; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none;">Open TeamBox</a></p>
              <p style="color: #888; font-size: 12px;">This is an automated escalation from Nexxus Connect for ${escapeHtml(org.name)}.</p>
            </div>`,
          });
          log(`Escalation email sent to ${orgAdmin.email} for conversation ${conv.id} (${contactName})`, "escalation");
        } else {
          log(`No RESEND_API_KEY — would email ${orgAdmin.email} for conversation ${conv.id}`, "escalation");
        }

        await storage.markEscalationSent(conv.id);

        await storage.createNotification({
          userId: orgAdmin.id,
          organizationId: conv.organizationId,
          type: "escalation",
          title: `Unanswered message from ${contactName}`,
          message: `${contactName} (${contactPhone}) has been waiting ${waitingMinutes} minutes for a response on ${conv.channel}.`,
          relatedEntityType: "conversation",
          relatedEntityId: conv.id,
        });

        await storage.createActivityLog({
          userId: orgAdmin.id,
          organizationId: conv.organizationId,
          action: "escalation_email_sent",
          entityType: "conversation",
          entityId: conv.id,
          metadata: { contactName, contactPhone, waitingMinutes, channel: conv.channel },
        });
      } catch (convErr) {
        log(`Error processing escalation for conversation ${conv.id}: ${convErr}`, "escalation");
      }
    }
  } catch (err) {
    log(`Escalation scheduler error: ${err}`, "escalation");
  }
}
