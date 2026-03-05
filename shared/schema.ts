import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, uuid, jsonb } from "drizzle-orm/pg-core";
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
  partnerId: uuid("partner_id"),
  outboundEnabled: boolean("outbound_enabled").notNull().default(true),
  smsEnabled: boolean("sms_enabled").notNull().default(true),
  phoneEnabled: boolean("phone_enabled").notNull().default(true),
  emailEnabled: boolean("email_enabled").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  roleId: uuid("role_id").notNull().references(() => roles.id),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id),
  locationId: text("location_id"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id),
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
  organizationId: uuid("organization_id").notNull().references(() => organizations.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email"),
  customerPhone: text("customer_phone"),
  channel: text("channel").notNull().default("chat"),
  status: text("status").notNull().default("open"),
  agentId: uuid("agent_id").references(() => agents.id),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id),
  campaignId: uuid("campaign_id").references(() => campaigns.id),
  campaignDisconnected: boolean("campaign_disconnected").notNull().default(false),
  unreadCount: integer("unread_count").notNull().default(0),
  lastMessageAt: timestamp("last_message_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: uuid("conversation_id").notNull().references(() => conversations.id),
  role: text("role").notNull(),
  content: text("content").notNull(),
  senderName: text("sender_name"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const campaigns = pgTable("campaigns", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  department: text("department").notNull().default("sales"),
  status: text("status").notNull().default("draft"),
  channel: text("channel").notNull().default("sms"),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id),
  killSwitch: boolean("kill_switch").notNull().default(false),
  recipientCount: integer("recipient_count").notNull().default(0),
  sentCount: integer("sent_count").notNull().default(0),
  repliedCount: integer("replied_count").notNull().default(0),
  csvFilename: text("csv_filename"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const integrations = pgTable("integrations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id),
  provider: text("provider").notNull(),
  externalDealerId: text("external_dealer_id"),
  externalDealerName: text("external_dealer_name"),
  externalIntegrationId: text("external_integration_id"),
  status: text("status").notNull().default("active"),
  nexxusOrgId: text("nexxus_org_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("todo"),
  priority: text("priority").notNull().default("medium"),
  dueDate: timestamp("due_date"),
  assignedUserId: uuid("assigned_user_id").references(() => users.id),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id),
  tags: text("tags").array().default(sql`ARRAY[]::text[]`),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const widgets = pgTable("widgets", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull().default("text"),
  status: text("status").notNull().default("draft"),
  description: text("description"),
  widgetCode: text("widget_code").notNull().unique(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id),
  config: jsonb("config").default({}),
  impressions: integer("impressions").notNull().default(0),
  interactions: integer("interactions").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
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

export const updateAgentSchema = createInsertSchema(agents).omit({ id: true, organizationId: true, createdAt: true, updatedAt: true }).partial();
export const updateOrganizationSchema = createInsertSchema(organizations).omit({ id: true, createdAt: true, updatedAt: true }).partial();
export const updateUserProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  locationId: z.string().nullable().optional(),
});
export const updateCampaignSchema = z.object({
  name: z.string().min(1).optional(),
  status: z.string().optional(),
  killSwitch: z.boolean().optional(),
});
export const updateTaskSchema = createInsertSchema(tasks).omit({ id: true, organizationId: true, createdAt: true, updatedAt: true }).partial();
export const updateWidgetSchema = createInsertSchema(widgets).omit({ id: true, organizationId: true, createdAt: true, updatedAt: true }).partial();
