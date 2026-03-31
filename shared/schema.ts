import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, uuid, jsonb, index, uniqueIndex, type AnyPgColumn } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const roles = pgTable("roles", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  level: integer("level").notNull(),
});

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  personaName: text("persona_name").notNull().default("Serra"),
  partnerId: uuid("partner_id").references((): AnyPgColumn => organizations.id, { onDelete: "set null" }),
  outboundEnabled: boolean("outbound_enabled").notNull().default(false),
  smsEnabled: boolean("sms_enabled").notNull().default(false),
  phoneEnabled: boolean("phone_enabled").notNull().default(false),
  emailEnabled: boolean("email_enabled").notNull().default(false),
  videoEnabled: boolean("video_enabled").notNull().default(false),
  billingCustomerId: text("billing_customer_id"),
  billingSubscriptionId: text("billing_subscription_id"),
  billingWalletId: text("billing_wallet_id"),
  billingPlanId: text("billing_plan_id"),
  billingTier: text("billing_tier"),
  settings: jsonb("settings").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  roleId: uuid("role_id").notNull().references(() => roles.id, { onDelete: "restrict" }),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  profilePhotoUrl: text("profile_photo_url"),
  isActive: boolean("is_active").notNull().default(true),
  resetToken: text("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry"),
  additionalOrgIds: jsonb("additional_org_ids").$type<string[]>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_users_org").on(table.organizationId),
  index("idx_users_email").on(table.email),
]);

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  refreshToken: text("refresh_token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const agents = pgTable("agents", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  department: text("department").notNull(),
  type: text("type").notNull().default("ai"),
  status: text("status").notNull().default("active"),
  description: text("description"),
  channels: text("channels").array().notNull().default(sql`ARRAY['voice','video']::text[]`),
  dealership: text("dealership"),
  assignedPhone: text("assigned_phone"),
  customerLink: text("customer_link"),
  vapiAssistantId: text("vapi_assistant_id"),
  tavusPersonaId: text("tavus_persona_id"),
  instructions: text("instructions"),
  autoGreeting: text("auto_greeting"),
  settings: jsonb("settings").default({}),
  triggers: jsonb("triggers").default([]),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_agents_org").on(table.organizationId),
  index("idx_agents_dept").on(table.department),
]);

export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email"),
  customerPhone: text("customer_phone"),
  channel: text("channel").notNull().default("chat"),
  status: text("status").notNull().default("open"),
  agentId: uuid("agent_id").references(() => agents.id, { onDelete: "set null" }),
  assignedTo: uuid("assigned_to").references(() => users.id, { onDelete: "set null" }),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  campaignId: uuid("campaign_id").references(() => campaigns.id, { onDelete: "set null" }),
  sourceConversationId: uuid("source_conversation_id"),
  campaignDisconnected: boolean("campaign_disconnected").notNull().default(false),
  unreadCount: integer("unread_count").notNull().default(0),
  lastMessageAt: timestamp("last_message_at"),
  escalationSentAt: timestamp("escalation_sent_at"),
  staleTriggerProcessedAt: timestamp("stale_trigger_processed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_conversations_org").on(table.organizationId),
  index("idx_conversations_channel").on(table.channel),
  index("idx_conversations_phone").on(table.customerPhone),
]);

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: uuid("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  senderName: text("sender_name"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_messages_conversation").on(table.conversationId),
]);

export const campaigns = pgTable("campaigns", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  department: text("department").notNull().default("sales"),
  status: text("status").notNull().default("draft"),
  channel: text("channel").notNull().default("sms"),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  killSwitch: boolean("kill_switch").notNull().default(false),
  recipientCount: integer("recipient_count").notNull().default(0),
  sentCount: integer("sent_count").notNull().default(0),
  repliedCount: integer("replied_count").notNull().default(0),
  csvFilename: text("csv_filename"),
  messageTemplate: text("message_template"),
  sendIntervalSeconds: integer("send_interval_seconds").notNull().default(60),
  executionStatus: text("execution_status").default("idle"),
  executionTotal: integer("execution_total").notNull().default(0),
  executionProcessed: integer("execution_processed").notNull().default(0),
  executionSent: integer("execution_sent").notNull().default(0),
  executionFailed: integer("execution_failed").notNull().default(0),
  executionStartedAt: timestamp("execution_started_at"),
  scheduledAt: timestamp("scheduled_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_campaigns_org").on(table.organizationId),
  index("idx_campaigns_dept").on(table.department),
]);

export const integrations = pgTable("integrations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(),
  externalDealerId: text("external_dealer_id"),
  externalDealerName: text("external_dealer_name"),
  externalIntegrationId: text("external_integration_id"),
  status: text("status").notNull().default("active"),
  nexxusOrgId: text("nexxus_org_id"),
  defaultVinUserId: integer("default_vin_user_id"),
  smsCampaignNumber: text("sms_campaign_number"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_integrations_org").on(table.organizationId),
]);

export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull().default("task"),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("todo"),
  priority: text("priority").notNull().default("medium"),
  dueDate: timestamp("due_date"),
  assignedUserId: uuid("assigned_user_id").references(() => users.id, { onDelete: "set null" }),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  tags: text("tags").array().default(sql`ARRAY[]::text[]`),
  metadata: text("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_tasks_org").on(table.organizationId),
]);

export const widgets = pgTable("widgets", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull().default("text"),
  status: text("status").notNull().default("draft"),
  description: text("description"),
  widgetCode: text("widget_code").notNull().unique(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  config: jsonb("config").default({}),
  impressions: integer("impressions").notNull().default(0),
  interactions: integer("interactions").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const knowledgeDocuments = pgTable("knowledge_documents", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(),
  size: integer("size").notNull().default(0),
  status: text("status").notNull().default("indexed"),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  agentId: uuid("agent_id").references(() => agents.id, { onDelete: "set null" }),
  content: text("content"),
  mimeType: text("mime_type"),
  sourceDocumentName: text("source_document_name"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_knowledge_documents_org").on(table.organizationId),
]);

export const campaignRecipients = pgTable("campaign_recipients", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: uuid("campaign_id").notNull().references(() => campaigns.id, { onDelete: "cascade" }),
  firstName: text("first_name"),
  lastName: text("last_name"),
  phone: text("phone"),
  email: text("email"),
  vin: text("vin"),
  vehicleModel: text("vehicle_model"),
  vehicleYear: text("vehicle_year"),
  status: text("status").notNull().default("pending"),
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_campaign_recipients_campaign").on(table.campaignId),
]);

export const outboundLog = pgTable("outbound_log", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  campaignId: uuid("campaign_id").references(() => campaigns.id, { onDelete: "set null" }),
  recipientId: uuid("recipient_id").references(() => campaignRecipients.id, { onDelete: "set null" }),
  channel: text("channel").notNull(),
  status: text("status").notNull().default("pending"),
  blockedReason: text("blocked_reason"),
  messageContent: text("message_content"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_outbound_log_org").on(table.organizationId),
]);

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  title: text("title").notNull(),
  message: text("message"),
  read: boolean("read").notNull().default(false),
  relatedEntityType: text("related_entity_type"),
  relatedEntityId: text("related_entity_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_notifications_user").on(table.userId),
]);

export const activityLog = pgTable("activity_log", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  action: text("action").notNull(),
  entityType: text("entity_type"),
  entityId: text("entity_id"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_activity_log_org").on(table.organizationId),
]);

export const hunches = pgTable("hunches", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  type: text("type").notNull().default("pattern"),
  title: text("title").notNull(),
  description: text("description").notNull(),
  confidence: integer("confidence").notNull().default(50),
  status: text("status").notNull().default("new"),
  department: text("department"),
  dataSource: text("data_source"),
  batchId: uuid("batch_id"),
  generatedAt: timestamp("generated_at").notNull().defaultNow(),
  acceptedAt: timestamp("accepted_at"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_hunches_org").on(table.organizationId),
]);

export const warehouseLeads = pgTable("warehouse_leads", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  sourceId: text("source_id"),
  dataSource: text("data_source").notNull().default("vin_solutions"),
  vinStatus: text("vin_status"),
  customerName: text("customer_name"),
  customerEmail: text("customer_email"),
  customerPhone: text("customer_phone"),
  leadSource: text("lead_source"),
  vehicleOfInterest: text("vehicle_of_interest"),
  assignedSalesperson: text("assigned_salesperson"),
  dealerName: text("dealer_name"),
  vinCreatedAt: timestamp("vin_created_at"),
  vinUpdatedAt: timestamp("vin_updated_at"),
  leadScore: integer("lead_score"),
  followupStep: integer("followup_step"),
  followupSentAt: timestamp("followup_sent_at"),
  syncedAt: timestamp("synced_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_warehouse_leads_org").on(table.organizationId),
  uniqueIndex("uq_warehouse_leads_org_source").on(table.organizationId, table.sourceId),
]);

export const warehouseMetrics = pgTable("warehouse_metrics", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  metricKey: text("metric_key").notNull(),
  metricValue: text("metric_value").notNull(),
  period: text("period"),
  dataSource: text("data_source").notNull().default("vin_solutions"),
  metadata: jsonb("metadata").default({}),
  syncedAt: timestamp("synced_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("uq_warehouse_metrics_org_key_period").on(table.organizationId, table.metricKey, table.period),
]);

export const appointments = pgTable("appointments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone"),
  customerEmail: text("customer_email"),
  appointmentType: text("appointment_type").notNull().default("general"),
  department: text("department").notNull().default("sales"),
  assignedUserId: uuid("assigned_user_id").references(() => users.id, { onDelete: "set null" }),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  status: text("status").notNull().default("scheduled"),
  notes: text("notes"),
  source: text("source").notNull().default("manual"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_appointments_org").on(table.organizationId),
]);

export const slugRedirects = pgTable("slug_redirects", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  oldSlug: text("old_slug").notNull(),
  newSlug: text("new_slug").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const syncLog = pgTable("sync_log", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  syncType: text("sync_type").notNull(),
  status: text("status").notNull().default("running"),
  recordsProcessed: integer("records_processed").notNull().default(0),
  recordsFailed: integer("records_failed").notNull().default(0),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const favorites = pgTable("favorites", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  path: text("path").notNull(),
  label: text("label").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_favorites_user").on(table.userId),
]);

export const usageEvents = pgTable("usage_events", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  eventType: text("event_type").notNull(),
  channel: text("channel"),
  quantity: integer("quantity").notNull().default(1),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertRoleSchema = createInsertSchema(roles).omit({ id: true });
export const insertOrganizationSchema = createInsertSchema(organizations).omit({ id: true, createdAt: true, updatedAt: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSessionSchema = createInsertSchema(sessions).omit({ id: true, createdAt: true });
export const insertAgentSchema = createInsertSchema(agents).omit({ id: true, createdAt: true, updatedAt: true });
export const insertConversationSchema = createInsertSchema(conversations).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });
export const insertCampaignSchema = createInsertSchema(campaigns).omit({ id: true, createdAt: true, updatedAt: true });
export const insertIntegrationSchema = createInsertSchema(integrations).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true, createdAt: true, updatedAt: true });
export const insertWidgetSchema = createInsertSchema(widgets).omit({ id: true, createdAt: true, updatedAt: true });
export const insertKnowledgeDocumentSchema = createInsertSchema(knowledgeDocuments).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCampaignRecipientSchema = createInsertSchema(campaignRecipients).omit({ id: true, createdAt: true });
export const insertOutboundLogSchema = createInsertSchema(outboundLog).omit({ id: true, createdAt: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });
export const insertActivityLogSchema = createInsertSchema(activityLog).omit({ id: true, createdAt: true });
export const insertHunchSchema = createInsertSchema(hunches).omit({ id: true, createdAt: true });
export const insertWarehouseLeadSchema = createInsertSchema(warehouseLeads).omit({ id: true, createdAt: true });
export const insertWarehouseMetricSchema = createInsertSchema(warehouseMetrics).omit({ id: true, createdAt: true });
export const insertAppointmentSchema = createInsertSchema(appointments).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSlugRedirectSchema = createInsertSchema(slugRedirects).omit({ id: true, createdAt: true });
export const insertSyncLogSchema = createInsertSchema(syncLog).omit({ id: true, createdAt: true });

export type InsertRole = z.infer<typeof insertRoleSchema>;
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type InsertAgent = z.infer<typeof insertAgentSchema>;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type InsertIntegration = z.infer<typeof insertIntegrationSchema>;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type InsertWidget = z.infer<typeof insertWidgetSchema>;
export type InsertKnowledgeDocument = z.infer<typeof insertKnowledgeDocumentSchema>;
export type InsertCampaignRecipient = z.infer<typeof insertCampaignRecipientSchema>;
export type InsertOutboundLog = z.infer<typeof insertOutboundLogSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type InsertHunch = z.infer<typeof insertHunchSchema>;
export type InsertWarehouseLead = z.infer<typeof insertWarehouseLeadSchema>;
export type InsertWarehouseMetric = z.infer<typeof insertWarehouseMetricSchema>;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type InsertSlugRedirect = z.infer<typeof insertSlugRedirectSchema>;
export type InsertSyncLog = z.infer<typeof insertSyncLogSchema>;
export const smsBlacklist = pgTable("sms_blacklist", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  phoneNumber: text("phone_number").notNull(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  reason: text("reason").notNull().default("STOP"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_sms_blacklist_phone_org").on(table.phoneNumber, table.organizationId),
]);

export const scheduledActions = pgTable("scheduled_actions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  actionType: text("action_type").notNull(),
  payload: jsonb("payload").notNull().default({}),
  executeAt: timestamp("execute_at").notNull(),
  executedAt: timestamp("executed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_scheduled_actions_execute").on(table.executeAt),
]);

export const schedulerLocks = pgTable("scheduler_locks", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  lockName: text("lock_name").notNull().unique(),
  lockedAt: timestamp("locked_at"),
  lastRunAt: timestamp("last_run_at"),
  lockedBy: text("locked_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertScheduledActionSchema = createInsertSchema(scheduledActions).omit({ id: true, createdAt: true });
export const insertSchedulerLockSchema = createInsertSchema(schedulerLocks).omit({ id: true, createdAt: true });

export const insertFavoriteSchema = createInsertSchema(favorites).omit({ id: true, createdAt: true });
export const insertUsageEventSchema = createInsertSchema(usageEvents).omit({ id: true, createdAt: true });
export const insertSmsBlacklistSchema = createInsertSchema(smsBlacklist).omit({ id: true, createdAt: true });
export type InsertScheduledAction = z.infer<typeof insertScheduledActionSchema>;
export type InsertSchedulerLock = z.infer<typeof insertSchedulerLockSchema>;
export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
export type InsertUsageEvent = z.infer<typeof insertUsageEventSchema>;
export type InsertSmsBlacklist = z.infer<typeof insertSmsBlacklistSchema>;

export type Role = typeof roles.$inferSelect;
export type Organization = typeof organizations.$inferSelect;
export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type Agent = typeof agents.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Campaign = typeof campaigns.$inferSelect;
export type Integration = typeof integrations.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type Widget = typeof widgets.$inferSelect;
export type KnowledgeDocument = typeof knowledgeDocuments.$inferSelect;
export type CampaignRecipient = typeof campaignRecipients.$inferSelect;
export type OutboundLog = typeof outboundLog.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type ActivityLog = typeof activityLog.$inferSelect;
export type Hunch = typeof hunches.$inferSelect;
export type WarehouseLead = typeof warehouseLeads.$inferSelect;
export type WarehouseMetric = typeof warehouseMetrics.$inferSelect;
export type Appointment = typeof appointments.$inferSelect;
export type SlugRedirect = typeof slugRedirects.$inferSelect;
export type SyncLog = typeof syncLog.$inferSelect;
export type Favorite = typeof favorites.$inferSelect;
export type UsageEvent = typeof usageEvents.$inferSelect;
export type SmsBlacklist = typeof smsBlacklist.$inferSelect;
export type ScheduledAction = typeof scheduledActions.$inferSelect;
export type SchedulerLock = typeof schedulerLocks.$inferSelect;

export const updateAgentSchema = createInsertSchema(agents).omit({ id: true, organizationId: true, createdAt: true, updatedAt: true }).partial();
export const updateOrganizationSchema = createInsertSchema(organizations).omit({ id: true, createdAt: true, updatedAt: true }).partial();
export const updateUserProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  profilePhotoUrl: z.string().nullable().optional(),
});
export const updateCampaignSchema = z.object({
  name: z.string().min(1).optional(),
  status: z.string().optional(),
  killSwitch: z.boolean().optional(),
  messageTemplate: z.string().nullable().optional(),
  sendIntervalSeconds: z.number().min(10).optional(),
});
export const updateHunchSchema = z.object({
  status: z.enum(["new", "accepted", "dismissed", "resolved"]),
  acceptedAt: z.date().nullable().optional(),
  resolvedAt: z.date().nullable().optional(),
});
export const updateTaskSchema = createInsertSchema(tasks).omit({ id: true, organizationId: true, createdAt: true, updatedAt: true }).partial();
export const updateWidgetSchema = createInsertSchema(widgets).omit({ id: true, organizationId: true, createdAt: true, updatedAt: true }).partial();
export const updateAppointmentSchema = createInsertSchema(appointments).omit({ id: true, organizationId: true, createdAt: true, updatedAt: true }).partial();
