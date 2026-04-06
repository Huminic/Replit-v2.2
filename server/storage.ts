import { eq, and, desc, count, sql, gte, lte, isNull, isNotNull, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import {
  type User, type InsertUser,
  type Role, type InsertRole,
  type Organization, type InsertOrganization,
  type Session, type InsertSession,
  type Agent, type InsertAgent,
  type Conversation, type InsertConversation,
  type Message, type InsertMessage,
  type Campaign, type InsertCampaign,
  type Integration, type InsertIntegration,
  type Task, type InsertTask,
  type Widget, type InsertWidget,
  type KnowledgeDocument, type InsertKnowledgeDocument,
  type CampaignRecipient, type InsertCampaignRecipient,
  type OutboundLog, type InsertOutboundLog,
  type Notification, type InsertNotification,
  type ActivityLog, type InsertActivityLog,
  type Hunch, type InsertHunch,
  type WarehouseLead, type InsertWarehouseLead,
  type WarehouseMetric, type InsertWarehouseMetric,
  type Appointment, type InsertAppointment,
  type SlugRedirect, type InsertSlugRedirect,
  type SyncLog, type InsertSyncLog,
  type UsageEvent, type InsertUsageEvent,
  type Favorite, type InsertFavorite,
  type SmsBlacklist, type InsertSmsBlacklist,
  type ScheduledAction, type InsertScheduledAction,
  type SchedulerLock, type InsertSchedulerLock,
  users, roles, organizations, sessions, agents, conversations, messages, campaigns, integrations, tasks, widgets,
  knowledgeDocuments, campaignRecipients, outboundLog, notifications, activityLog, hunches,
  warehouseLeads, warehouseMetrics, appointments, slugRedirects, syncLog, usageEvents, favorites, smsBlacklist,
  scheduledActions, schedulerLocks,
} from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined>;

  getRole(id: string): Promise<Role | undefined>;
  getRoleByName(name: string): Promise<Role | undefined>;
  getRoles(): Promise<Role[]>;
  createRole(role: InsertRole): Promise<Role>;

  getOrganization(id: string): Promise<Organization | undefined>;
  getOrganizations(): Promise<Organization[]>;
  findOrganizationByPhone(phone: string): Promise<Organization | undefined>;
  getOrganizationByTextmagicPhone(phone: string): Promise<Organization | undefined>;
  createOrganization(org: InsertOrganization): Promise<Organization>;
  updateOrganization(id: string, data: Partial<InsertOrganization>): Promise<Organization | undefined>;

  createSession(session: InsertSession): Promise<Session>;
  getSessionByRefreshToken(token: string): Promise<Session | undefined>;
  deleteSession(id: string): Promise<void>;
  deleteUserSessions(userId: string): Promise<void>;

  getAgents(organizationId: string, filters?: { department?: string }): Promise<Agent[]>;
  getUsers(organizationId: string): Promise<Array<User & { role?: Role }>>;
  getAgent(id: string): Promise<Agent | undefined>;
  createAgent(agent: InsertAgent): Promise<Agent>;
  updateAgent(id: string, data: Partial<InsertAgent>): Promise<Agent | undefined>;
  deleteAgent(id: string): Promise<void>;

  getConversations(organizationId: string, filters?: { status?: string; channel?: string; agentId?: string }): Promise<Conversation[]>;
  getConversation(id: string): Promise<Conversation | undefined>;
  getConversationByPhone(phone: string, channel?: string, organizationId?: string): Promise<Conversation | undefined>;
  createConversation(conv: InsertConversation): Promise<Conversation>;
  updateConversation(id: string, data: Partial<InsertConversation>): Promise<Conversation | undefined>;

  getMessages(conversationId: string): Promise<Message[]>;
  createMessage(msg: InsertMessage): Promise<Message>;
  deleteConversation(id: string): Promise<void>;
  deleteMessages(conversationId: string): Promise<void>;

  getCampaigns(organizationId: string, filters?: { department?: string }): Promise<Campaign[]>;
  getScheduledCampaigns(): Promise<Campaign[]>;
  getCampaign(id: string): Promise<Campaign | undefined>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  updateCampaign(id: string, data: Partial<InsertCampaign>): Promise<Campaign | undefined>;

  getIntegrations(organizationId: string, filters?: { provider?: string }): Promise<Integration[]>;
  getIntegration(id: string): Promise<Integration | undefined>;
  createIntegration(integration: InsertIntegration): Promise<Integration>;
  updateIntegration(id: string, data: Partial<InsertIntegration>): Promise<Integration | undefined>;

  getTasks(organizationId: string, filters?: { status?: string; assignedUserId?: string; type?: string }): Promise<Task[]>;
  getTask(id: string): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, data: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: string): Promise<void>;

  getWidgets(organizationId: string): Promise<Widget[]>;
  getWidget(id: string): Promise<Widget | undefined>;
  getWidgetByCode(widgetCode: string): Promise<Widget | undefined>;
  createWidget(widget: InsertWidget): Promise<Widget>;
  updateWidget(id: string, data: Partial<InsertWidget>): Promise<Widget | undefined>;
  deleteWidget(id: string): Promise<void>;

  getDocuments(organizationId: string, agentId?: string): Promise<KnowledgeDocument[]>;
  getDocument(id: string): Promise<KnowledgeDocument | undefined>;
  getDocumentByNameAndOrg(name: string, organizationId: string): Promise<KnowledgeDocument | undefined>;
  createDocument(doc: InsertKnowledgeDocument): Promise<KnowledgeDocument>;
  deleteDocument(id: string): Promise<void>;
  getDocumentsBySourceName(sourceDocumentName: string, organizationId: string): Promise<KnowledgeDocument[]>;
  deleteDocumentsBySourceName(sourceDocumentName: string, organizationId: string): Promise<void>;

  getRecipients(campaignId: string): Promise<CampaignRecipient[]>;
  getRecipient(id: string): Promise<CampaignRecipient | undefined>;
  createRecipients(recipients: InsertCampaignRecipient[]): Promise<CampaignRecipient[]>;
  getRecipientCount(campaignId: string): Promise<number>;
  getSentCountsByCampaignIds(campaignIds: string[]): Promise<Record<string, number>>;
  updateRecipient(id: string, data: Partial<InsertCampaignRecipient>): Promise<CampaignRecipient | undefined>;
  getPendingRecipients(campaignId: string): Promise<CampaignRecipient[]>;

  createOutboundLog(log: InsertOutboundLog): Promise<OutboundLog>;
  getOutboundLogs(organizationId: string, filters?: { campaignId?: string }): Promise<OutboundLog[]>;
  getRecentOutboundCount(organizationId: string, customerContact: string, hours: number): Promise<number>;
  findLastOutboundForPhone(phone: string, channel?: string): Promise<OutboundLog | undefined>;

  createNotification(notif: InsertNotification): Promise<Notification>;
  getNotifications(userId: string, limit?: number): Promise<Notification[]>;
  getUnreadNotificationCount(userId: string): Promise<number>;
  markNotificationRead(id: string): Promise<void>;
  markAllNotificationsRead(userId: string): Promise<void>;

  createActivityLog(entry: InsertActivityLog): Promise<ActivityLog>;
  getActivityLogs(organizationId: string, limit?: number): Promise<ActivityLog[]>;
  purgeOldActivityLogs(days?: number): Promise<number>;

  getHunches(organizationId: string, filters?: { status?: string; department?: string }): Promise<Hunch[]>;
  getHunch(id: string): Promise<Hunch | undefined>;
  createHunch(hunch: InsertHunch): Promise<Hunch>;
  updateHunch(id: string, data: Partial<Hunch>): Promise<Hunch | undefined>;
  getAcceptedHunches(organizationId: string): Promise<Hunch[]>;

  upsertWarehouseLead(lead: InsertWarehouseLead): Promise<WarehouseLead>;
  getWarehouseLeadBySourceId(organizationId: string, sourceId: string): Promise<WarehouseLead | null>;
  getLeadsDueForFollowup(organizationId: string, delayHours: number, limit?: number): Promise<WarehouseLead[]>;
  getLeadsDueForMultiStepFollowup(organizationId: string, sequenceLength: number, conversionStatuses: string[], limit?: number): Promise<WarehouseLead[]>;
  markFollowupSent(leadId: string): Promise<void>;
  updateFollowupStep(leadId: string, step: number): Promise<void>;
  getWarehouseLeads(organizationId: string, filters?: { status?: string; dataSource?: string; limit?: number; createdAfter?: Date; activityAfter?: Date }): Promise<WarehouseLead[]>;
  getWarehouseLeadCount(organizationId: string, filters?: { status?: string }): Promise<number>;

  upsertWarehouseMetric(metric: InsertWarehouseMetric): Promise<WarehouseMetric>;
  getWarehouseMetrics(organizationId: string, filters?: { metricKey?: string; period?: string }): Promise<WarehouseMetric[]>;

  createSyncLog(entry: InsertSyncLog): Promise<SyncLog>;
  updateSyncLog(id: string, data: Partial<SyncLog>): Promise<SyncLog | undefined>;
  getLatestSync(organizationId: string, syncType?: string): Promise<SyncLog | undefined>;
  getSyncLogs(organizationId: string, limit?: number): Promise<SyncLog[]>;

  getAppointments(organizationId: string, filters?: { department?: string; startDate?: Date; endDate?: Date }): Promise<Appointment[]>;
  getAppointment(id: string): Promise<Appointment | undefined>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: string, data: Partial<InsertAppointment>): Promise<Appointment | undefined>;
  deleteAppointment(id: string): Promise<void>;

  getOrganizationBySlug(slug: string): Promise<Organization | undefined>;
  getSlugRedirect(oldSlug: string): Promise<SlugRedirect | undefined>;
  createSlugRedirect(redirect: InsertSlugRedirect): Promise<SlugRedirect>;
  updateOrganizationSlug(id: string, newSlug: string): Promise<Organization | undefined>;

  getDashboardMetrics(organizationId: string): Promise<DashboardMetrics>;
  getPipelineMetrics(organizationId: string): Promise<PipelineMetrics>;
  getPipelineMetricDetails(organizationId: string, metric: string): Promise<any[]>;

  getFavorites(userId: string): Promise<Favorite[]>;
  addFavorite(fav: InsertFavorite): Promise<Favorite>;
  removeFavorite(id: string, userId: string): Promise<void>;

  createBlacklistEntry(entry: InsertSmsBlacklist): Promise<SmsBlacklist>;
  getBlacklistEntry(phoneNumber: string, organizationId: string): Promise<SmsBlacklist | undefined>;
  getBlacklistByOrg(organizationId: string): Promise<SmsBlacklist[]>;
  removeBlacklistEntry(id: string): Promise<void>;

  updateWarehouseLeadScore(leadId: string, score: number): Promise<void>;

  suppressLeadFollowup(leadId: string, reason: string): Promise<void>;
  findWarehouseLeadsByContact(organizationId: string, phone?: string | null, email?: string | null): Promise<WarehouseLead[]>;

  getUnansweredConversations(thresholdMinutes: number): Promise<Conversation[]>;
  markEscalationSent(conversationId: string): Promise<void>;

  findUserByResetToken(token: string): Promise<User | undefined>;
  clearResetToken(userId: string): Promise<void>;
  countRecentSecurityEvents(action: string, entityId: string, since: Date): Promise<number>;

  createScheduledAction(action: InsertScheduledAction): Promise<ScheduledAction>;
  getDueScheduledActions(): Promise<ScheduledAction[]>;
  markScheduledActionExecuted(id: string): Promise<void>;

  acquireSchedulerLock(lockName: string, lockedBy: string, ttlMinutes?: number): Promise<boolean>;
  releaseSchedulerLock(lockName: string): Promise<void>;
  getSchedulerLock(lockName: string): Promise<SchedulerLock | undefined>;
  updateSchedulerLastRunAt(lockName: string): Promise<void>;
}

export interface PipelineMetrics {
  activePipeline: number;
  appointmentsToday: number;
  openEscalations: number;
  outboundSent24h: number;
}

export interface DashboardMetrics {
  conversationCounts: {
    total: number;
    open: number;
    closed: number;
    byChannel: Record<string, number>;
  };
  messageCounts: {
    total: number;
    last30Days: number;
  };
  campaignStats: {
    total: number;
    active: number;
    totalSent: number;
    totalReplied: number;
    replyRate: number;
    byDepartment: Record<string, { total: number; active: number; sent: number; replied: number; replyRate: number }>;
  };
  agentCounts: {
    total: number;
    active: number;
    byDepartment: Record<string, number>;
  };
  userCounts: {
    total: number;
    active: number;
  };
  pipeline: PipelineMetrics;
}

import Pool from "pg";

const pool = new Pool.Pool({
  connectionString: process.env.DATABASE_URL!,
  max: parseInt(process.env.DB_POOL_SIZE || '10', 10),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10),
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '5000', 10),
});

export const db = drizzle(pool);

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [created] = await db.insert(users).values(user).returning();
    return created;
  }

  async updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined> {
    const [updated] = await db.update(users).set({ ...data, updatedAt: new Date() }).where(eq(users.id, id)).returning();
    return updated;
  }

  async getRole(id: string): Promise<Role | undefined> {
    const [role] = await db.select().from(roles).where(eq(roles.id, id));
    return role;
  }

  async getRoleByName(name: string): Promise<Role | undefined> {
    const [role] = await db.select().from(roles).where(eq(roles.name, name));
    return role;
  }

  async getRoles(): Promise<Role[]> {
    return db.select().from(roles);
  }

  async createRole(role: InsertRole): Promise<Role> {
    const [created] = await db.insert(roles).values(role).returning();
    return created;
  }

  async getOrganization(id: string): Promise<Organization | undefined> {
    const [org] = await db.select().from(organizations).where(eq(organizations.id, id));
    return org;
  }

  async getOrganizations(): Promise<Organization[]> {
    return db.select().from(organizations);
  }

  async findOrganizationByPhone(phone: string): Promise<Organization | undefined> {
    const variants = this.phoneVariants(phone);
    const phoneSql = sql`(${conversations.customerPhone} IN (${sql.join(variants.map(v => sql`${v}`), sql`, `)}))`;
    const conv = await db.select({ organizationId: conversations.organizationId })
      .from(conversations)
      .where(phoneSql)
      .limit(1);
    if (conv.length > 0) {
      return this.getOrganization(conv[0].organizationId);
    }
    const recip = await db.select({ orgId: campaigns.organizationId })
      .from(campaignRecipients)
      .innerJoin(campaigns, eq(campaignRecipients.campaignId, campaigns.id))
      .where(sql`(${campaignRecipients.phone} IN (${sql.join(variants.map(v => sql`${v}`), sql`, `)}))`)
      .orderBy(desc(campaignRecipients.createdAt))
      .limit(1);
    if (recip.length > 0) {
      return this.getOrganization(recip[0].orgId);
    }
    return undefined;
  }

  async getOrganizationByTextmagicPhone(phone: string): Promise<Organization | undefined> {
    const variants = this.phoneVariants(phone);
    const allOrgs = await this.getOrganizations();
    for (const org of allOrgs) {
      const settings = (org.settings || {}) as Record<string, any>;
      const tmPhone = settings.textmagicPhone;
      if (!tmPhone) continue;
      const tmNormalized = String(tmPhone).replace(/[^0-9+]/g, "");
      const tmVariants = this.phoneVariants(tmNormalized);
      if (variants.some(v => tmVariants.includes(v))) {
        return org;
      }
    }
    return undefined;
  }

  private phoneVariants(phone: string): string[] {
    const normalizedPhone = phone.replace(/[^0-9+]/g, "");
    const digitsOnly = normalizedPhone.replace(/\+/g, "");
    const without1 = digitsOnly.startsWith("1") && digitsOnly.length === 11 ? digitsOnly.substring(1) : digitsOnly;
    const with1 = digitsOnly.length === 10 ? "1" + digitsOnly : digitsOnly;
    const variants = new Set([normalizedPhone, digitsOnly, without1, with1, "+" + with1]);
    return [...variants];
  }

  async createOrganization(org: InsertOrganization): Promise<Organization> {
    const [created] = await db.insert(organizations).values(org).returning();
    return created;
  }

  async updateOrganization(id: string, data: Partial<InsertOrganization>): Promise<Organization | undefined> {
    const [updated] = await db.update(organizations).set({ ...data, updatedAt: new Date() }).where(eq(organizations.id, id)).returning();
    return updated;
  }

  async createSession(session: InsertSession): Promise<Session> {
    const [created] = await db.insert(sessions).values(session).returning();
    return created;
  }

  async getSessionByRefreshToken(token: string): Promise<Session | undefined> {
    const [session] = await db.select().from(sessions).where(eq(sessions.refreshToken, token));
    return session;
  }

  async deleteSession(id: string): Promise<void> {
    await db.delete(sessions).where(eq(sessions.id, id));
  }

  async deleteUserSessions(userId: string): Promise<void> {
    await db.delete(sessions).where(eq(sessions.userId, userId));
  }

  async getAgents(organizationId: string, filters?: { department?: string }): Promise<Agent[]> {
    const conditions = [eq(agents.organizationId, organizationId)];
    if (filters?.department) conditions.push(eq(agents.department, filters.department));
    return db.select().from(agents).where(and(...conditions));
  }

  async getUsers(organizationId: string): Promise<Array<User & { role?: Role }>> {
    const result = await db
      .select()
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .where(eq(users.organizationId, organizationId));
    return result.map(r => ({ ...r.users, role: r.roles ?? undefined }));
  }

  async getAgent(id: string): Promise<Agent | undefined> {
    const [agent] = await db.select().from(agents).where(eq(agents.id, id));
    return agent;
  }

  async createAgent(agent: InsertAgent): Promise<Agent> {
    const [created] = await db.insert(agents).values(agent).returning();
    return created;
  }

  async updateAgent(id: string, data: Partial<InsertAgent>): Promise<Agent | undefined> {
    const [updated] = await db.update(agents).set({ ...data, updatedAt: new Date() }).where(eq(agents.id, id)).returning();
    return updated;
  }

  async deleteAgent(id: string): Promise<void> {
    await db.delete(agents).where(eq(agents.id, id));
  }

  async getConversations(organizationId: string, filters?: { status?: string; channel?: string; agentId?: string }): Promise<Conversation[]> {
    const conditions = [eq(conversations.organizationId, organizationId)];
    if (filters?.status) conditions.push(eq(conversations.status, filters.status));
    if (filters?.channel) conditions.push(eq(conversations.channel, filters.channel));
    if (filters?.agentId) conditions.push(eq(conversations.agentId, filters.agentId));
    return db.select().from(conversations).where(and(...conditions)).orderBy(desc(conversations.lastMessageAt));
  }

  async getConversation(id: string): Promise<Conversation | undefined> {
    const [conv] = await db.select().from(conversations).where(eq(conversations.id, id));
    return conv;
  }

  async getConversationByPhone(phone: string, channel?: string, organizationId?: string): Promise<Conversation | undefined> {
    const normalizedPhone = phone.replace(/[^0-9+]/g, "");
    const digitsOnly = normalizedPhone.replace(/\+/g, "");
    const without1 = digitsOnly.startsWith("1") && digitsOnly.length === 11 ? digitsOnly.substring(1) : digitsOnly;
    const with1 = digitsOnly.length === 10 ? "1" + digitsOnly : digitsOnly;
    const conditions = [
      sql`(${conversations.customerPhone} = ${normalizedPhone} OR ${conversations.customerPhone} = ${digitsOnly} OR ${conversations.customerPhone} = ${without1} OR ${conversations.customerPhone} = ${with1} OR ${conversations.customerPhone} = ${'+' + with1})`,
      eq(conversations.status, "open"),
    ];
    if (channel) conditions.push(eq(conversations.channel, channel));
    if (organizationId) conditions.push(eq(conversations.organizationId, organizationId));
    const [conv] = await db.select().from(conversations)
      .where(and(...conditions))
      .orderBy(desc(conversations.lastMessageAt))
      .limit(1);
    return conv;
  }

  async createConversation(conv: InsertConversation): Promise<Conversation> {
    const [created] = await db.insert(conversations).values(conv).returning();
    return created;
  }

  async updateConversation(id: string, data: Partial<InsertConversation>): Promise<Conversation | undefined> {
    const [updated] = await db.update(conversations).set({ ...data, updatedAt: new Date() }).where(eq(conversations.id, id)).returning();
    return updated;
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    return db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(messages.createdAt);
  }

  async createMessage(msg: InsertMessage): Promise<Message> {
    const [created] = await db.insert(messages).values(msg).returning();
    return created;
  }

  async deleteMessages(conversationId: string): Promise<void> {
    await db.delete(messages).where(eq(messages.conversationId, conversationId));
  }

  async deleteConversation(id: string): Promise<void> {
    await db.delete(messages).where(eq(messages.conversationId, id));
    await db.delete(conversations).where(eq(conversations.id, id));
  }

  async getCampaigns(organizationId: string, filters?: { department?: string }): Promise<Campaign[]> {
    const conditions = [eq(campaigns.organizationId, organizationId)];
    if (filters?.department) conditions.push(eq(campaigns.department, filters.department));
    return db.select().from(campaigns).where(and(...conditions));
  }

  async getScheduledCampaigns(): Promise<Campaign[]> {
    return db.select().from(campaigns).where(
      and(
        eq(campaigns.executionStatus, "scheduled"),
        lte(campaigns.scheduledAt, new Date())
      )
    );
  }

  async getCampaign(id: string): Promise<Campaign | undefined> {
    const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, id));
    return campaign;
  }

  async createCampaign(campaign: InsertCampaign): Promise<Campaign> {
    const [created] = await db.insert(campaigns).values(campaign).returning();
    return created;
  }

  async updateCampaign(id: string, data: Partial<InsertCampaign>): Promise<Campaign | undefined> {
    const [updated] = await db.update(campaigns).set({ ...data, updatedAt: new Date() }).where(eq(campaigns.id, id)).returning();
    return updated;
  }

  async getIntegrations(organizationId: string, filters?: { provider?: string }): Promise<Integration[]> {
    const conditions = [eq(integrations.organizationId, organizationId)];
    if (filters?.provider) conditions.push(eq(integrations.provider, filters.provider));
    return db.select().from(integrations).where(and(...conditions));
  }

  async getIntegration(id: string): Promise<Integration | undefined> {
    const [integration] = await db.select().from(integrations).where(eq(integrations.id, id));
    return integration;
  }

  async createIntegration(integration: InsertIntegration): Promise<Integration> {
    const [created] = await db.insert(integrations).values(integration).returning();
    return created;
  }

  async updateIntegration(id: string, data: Partial<InsertIntegration>): Promise<Integration | undefined> {
    const [updated] = await db.update(integrations).set({ ...data, updatedAt: new Date() }).where(eq(integrations.id, id)).returning();
    return updated;
  }

  async getTasks(organizationId: string, filters?: { status?: string; assignedUserId?: string; type?: string }): Promise<Task[]> {
    const conditions = [eq(tasks.organizationId, organizationId)];
    if (filters?.status) conditions.push(eq(tasks.status, filters.status));
    if (filters?.assignedUserId) conditions.push(eq(tasks.assignedUserId, filters.assignedUserId));
    if (filters?.type) conditions.push(eq(tasks.type, filters.type));
    return db.select().from(tasks).where(and(...conditions)).orderBy(desc(tasks.createdAt));
  }

  async getTask(id: string): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }

  async createTask(task: InsertTask): Promise<Task> {
    const [created] = await db.insert(tasks).values(task).returning();
    return created;
  }

  async updateTask(id: string, data: Partial<InsertTask>): Promise<Task | undefined> {
    const [updated] = await db.update(tasks).set({ ...data, updatedAt: new Date() }).where(eq(tasks.id, id)).returning();
    return updated;
  }

  async deleteTask(id: string): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  async getWidgets(organizationId: string): Promise<Widget[]> {
    return db.select().from(widgets).where(eq(widgets.organizationId, organizationId)).orderBy(desc(widgets.createdAt));
  }

  async getWidget(id: string): Promise<Widget | undefined> {
    const [widget] = await db.select().from(widgets).where(eq(widgets.id, id));
    return widget;
  }

  async getWidgetByCode(widgetCode: string): Promise<Widget | undefined> {
    const [widget] = await db.select().from(widgets).where(eq(widgets.widgetCode, widgetCode));
    return widget;
  }

  async createWidget(widget: InsertWidget): Promise<Widget> {
    const [created] = await db.insert(widgets).values(widget).returning();
    return created;
  }

  async updateWidget(id: string, data: Partial<InsertWidget>): Promise<Widget | undefined> {
    const [updated] = await db.update(widgets).set({ ...data, updatedAt: new Date() }).where(eq(widgets.id, id)).returning();
    return updated;
  }

  async deleteWidget(id: string): Promise<void> {
    await db.delete(widgets).where(eq(widgets.id, id));
  }

  async getDocuments(organizationId: string, agentId?: string): Promise<KnowledgeDocument[]> {
    const conditions = [eq(knowledgeDocuments.organizationId, organizationId)];
    if (agentId) {
      conditions.push(eq(knowledgeDocuments.agentId, agentId));
    }
    return db.select().from(knowledgeDocuments).where(and(...conditions)).orderBy(desc(knowledgeDocuments.createdAt));
  }

  async getDocument(id: string): Promise<KnowledgeDocument | undefined> {
    const [doc] = await db.select().from(knowledgeDocuments).where(eq(knowledgeDocuments.id, id));
    return doc;
  }

  async createDocument(doc: InsertKnowledgeDocument): Promise<KnowledgeDocument> {
    const [created] = await db.insert(knowledgeDocuments).values(doc).returning();
    return created;
  }

  async getDocumentByNameAndOrg(name: string, organizationId: string): Promise<KnowledgeDocument | undefined> {
    const [doc] = await db.select().from(knowledgeDocuments).where(
      and(eq(knowledgeDocuments.name, name), eq(knowledgeDocuments.organizationId, organizationId))
    );
    return doc;
  }

  async deleteDocument(id: string): Promise<void> {
    await db.delete(knowledgeDocuments).where(eq(knowledgeDocuments.id, id));
  }

  async getDocumentsBySourceName(sourceDocumentName: string, organizationId: string): Promise<KnowledgeDocument[]> {
    return db.select().from(knowledgeDocuments).where(
      and(eq(knowledgeDocuments.sourceDocumentName, sourceDocumentName), eq(knowledgeDocuments.organizationId, organizationId))
    ).orderBy(knowledgeDocuments.createdAt);
  }

  async deleteDocumentsBySourceName(sourceDocumentName: string, organizationId: string): Promise<void> {
    await db.delete(knowledgeDocuments).where(
      and(eq(knowledgeDocuments.sourceDocumentName, sourceDocumentName), eq(knowledgeDocuments.organizationId, organizationId))
    );
  }

  async getRecipients(campaignId: string): Promise<CampaignRecipient[]> {
    return db.select().from(campaignRecipients).where(eq(campaignRecipients.campaignId, campaignId)).orderBy(desc(campaignRecipients.createdAt));
  }

  async createRecipients(recipients: InsertCampaignRecipient[]): Promise<CampaignRecipient[]> {
    if (recipients.length === 0) return [];
    return db.insert(campaignRecipients).values(recipients).returning();
  }

  async getRecipientCount(campaignId: string): Promise<number> {
    const [result] = await db.select({ cnt: count() }).from(campaignRecipients).where(eq(campaignRecipients.campaignId, campaignId));
    return Number(result?.cnt || 0);
  }

  async getSentCountsByCampaignIds(campaignIds: string[]): Promise<Record<string, number>> {
    if (campaignIds.length === 0) return {};
    const rows = await db
      .select({
        campaignId: campaignRecipients.campaignId,
        cnt: count(),
      })
      .from(campaignRecipients)
      .where(
        and(
          inArray(campaignRecipients.campaignId, campaignIds),
          inArray(campaignRecipients.status, ['sent', 'delivered'])
        )
      )
      .groupBy(campaignRecipients.campaignId);
    const result: Record<string, number> = {};
    for (const row of rows) {
      result[row.campaignId] = Number(row.cnt);
    }
    return result;
  }

  async getDashboardMetrics(organizationId: string): Promise<DashboardMetrics> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [convRows, msgTotal, msgRecent, campaignRows, agentRows, userRows] = await Promise.all([
      db.select({
        status: conversations.status,
        channel: conversations.channel,
        cnt: count(),
      }).from(conversations).where(eq(conversations.organizationId, organizationId)).groupBy(conversations.status, conversations.channel),

      db.select({ cnt: count() }).from(messages)
        .innerJoin(conversations, eq(messages.conversationId, conversations.id))
        .where(eq(conversations.organizationId, organizationId)),

      db.select({ cnt: count() }).from(messages)
        .innerJoin(conversations, eq(messages.conversationId, conversations.id))
        .where(and(eq(conversations.organizationId, organizationId), gte(messages.createdAt, thirtyDaysAgo))),

      db.select({
        id: campaigns.id,
        department: campaigns.department,
        status: campaigns.status,
      }).from(campaigns).where(eq(campaigns.organizationId, organizationId)),

      db.select({
        department: agents.department,
        status: agents.status,
        cnt: count(),
      }).from(agents).where(eq(agents.organizationId, organizationId)).groupBy(agents.department, agents.status),

      db.select({
        isActive: users.isActive,
        cnt: count(),
      }).from(users).where(eq(users.organizationId, organizationId)).groupBy(users.isActive),
    ]);

    const conversationCounts = { total: 0, open: 0, closed: 0, byChannel: {} as Record<string, number> };
    for (const row of convRows) {
      const c = Number(row.cnt);
      conversationCounts.total += c;
      if (row.status === "open") conversationCounts.open += c;
      if (row.status === "closed") conversationCounts.closed += c;
      conversationCounts.byChannel[row.channel] = (conversationCounts.byChannel[row.channel] || 0) + c;
    }

    const messageCounts = {
      total: Number(msgTotal[0]?.cnt || 0),
      last30Days: Number(msgRecent[0]?.cnt || 0),
    };

    const campaignIds = campaignRows.map(r => r.id);
    const campaignDeptMap = new Map(campaignRows.map(r => [r.id, r.department]));

    let realSentCounts = new Map<string, number>();
    let realRepliedCounts = new Map<string, number>();

    if (campaignIds.length > 0) {
      const [sentRows, repliedRows] = await Promise.all([
        db.select({
          campaignId: campaignRecipients.campaignId,
          cnt: count(),
        }).from(campaignRecipients)
          .where(and(
            sql`${campaignRecipients.campaignId} IN (${sql.join(campaignIds.map(id => sql`${id}`), sql`, `)})`,
            sql`${campaignRecipients.status} IN ('sent', 'delivered')`
          ))
          .groupBy(campaignRecipients.campaignId),

        db.select({
          campaignId: conversations.campaignId,
          cnt: count(),
        }).from(conversations)
          .where(and(
            eq(conversations.organizationId, organizationId),
            isNotNull(conversations.campaignId),
            sql`${conversations.campaignId} IN (${sql.join(campaignIds.map(id => sql`${id}`), sql`, `)})`
          ))
          .groupBy(conversations.campaignId),
      ]);

      for (const row of sentRows) {
        if (row.campaignId) realSentCounts.set(row.campaignId, Number(row.cnt));
      }
      for (const row of repliedRows) {
        if (row.campaignId) realRepliedCounts.set(row.campaignId, Number(row.cnt));
      }
    }

    const byDepartment: Record<string, { total: number; active: number; sent: number; replied: number; replyRate: number }> = {};
    let totalCampaigns = 0, activeCampaigns = 0, totalSent = 0, totalReplied = 0;
    for (const row of campaignRows) {
      totalCampaigns++;
      if (row.status === "active") activeCampaigns++;
      const sent = realSentCounts.get(row.id) || 0;
      const replied = realRepliedCounts.get(row.id) || 0;
      totalSent += sent;
      totalReplied += replied;
      if (!byDepartment[row.department]) byDepartment[row.department] = { total: 0, active: 0, sent: 0, replied: 0, replyRate: 0 };
      byDepartment[row.department].total++;
      if (row.status === "active") byDepartment[row.department].active++;
      byDepartment[row.department].sent += sent;
      byDepartment[row.department].replied += replied;
    }
    for (const dept of Object.keys(byDepartment)) {
      byDepartment[dept].replyRate = byDepartment[dept].sent > 0 ? Math.round((byDepartment[dept].replied / byDepartment[dept].sent) * 100) : 0;
    }

    const agentCounts = { total: 0, active: 0, byDepartment: {} as Record<string, number> };
    for (const row of agentRows) {
      const c = Number(row.cnt);
      agentCounts.total += c;
      if (row.status === "active") agentCounts.active += c;
      agentCounts.byDepartment[row.department] = (agentCounts.byDepartment[row.department] || 0) + c;
    }

    const userCounts = { total: 0, active: 0 };
    for (const row of userRows) {
      const c = Number(row.cnt);
      userCounts.total += c;
      if (row.isActive) userCounts.active += c;
    }

    const pipeline = await this.getPipelineMetrics(organizationId);

    return {
      conversationCounts,
      messageCounts,
      campaignStats: {
        total: totalCampaigns,
        active: activeCampaigns,
        totalSent,
        totalReplied,
        replyRate: totalSent > 0 ? Math.round((totalReplied / totalSent) * 100) : 0,
        byDepartment,
      },
      agentCounts,
      userCounts,
      pipeline,
    };
  }

  async getPipelineMetrics(organizationId: string): Promise<PipelineMetrics> {
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [pipelineResult, appointmentResult, escalationResult, outboundResult] = await Promise.all([
      db.select({ cnt: count() }).from(warehouseLeads).where(and(
        eq(warehouseLeads.organizationId, organizationId),
        sql`COALESCE(${warehouseLeads.vinCreatedAt}, ${warehouseLeads.syncedAt}) >= ${fourteenDaysAgo}`,
        sql`${warehouseLeads.vinStatus} IS NOT NULL`,
        sql`${warehouseLeads.vinStatus} NOT LIKE 'LOST%'`,
        sql`${warehouseLeads.vinStatus} != 'lost'`,
        sql`${warehouseLeads.vinStatus} NOT LIKE 'SOLD%'`,
        sql`${warehouseLeads.vinStatus} != 'sold'`,
        sql`${warehouseLeads.vinStatus} != 'closed-won'`,
        sql`${warehouseLeads.vinStatus} NOT LIKE 'BAD%'`,
        sql`${warehouseLeads.vinStatus} NOT LIKE '%DUPLICATE%'`,
        sql`${warehouseLeads.vinStatus} NOT LIKE 'SERVICE%'`,
        sql`${warehouseLeads.vinStatus} != 'NON_CUSTOMER_INITIATED_LEAD'`,
      )),

      db.select({ cnt: count() }).from(appointments).where(and(
        eq(appointments.organizationId, organizationId),
        eq(appointments.status, "scheduled"),
        gte(appointments.startTime, todayStart),
        sql`${appointments.startTime} < ${todayStart}::date + interval '1 day'`,
      )),

      db.select({ cnt: count() }).from(tasks).where(and(
        eq(tasks.organizationId, organizationId),
        eq(tasks.status, "todo"),
        sql`(${tasks.type} = 'escalation' OR ${tasks.type} = 'unsent_message')`,
      )),

      db.select({ cnt: count() }).from(outboundLog).where(and(
        eq(outboundLog.organizationId, organizationId),
        eq(outboundLog.status, "sent"),
        gte(outboundLog.createdAt, twentyFourHoursAgo),
      )),
    ]);

    return {
      activePipeline: Number(pipelineResult[0]?.cnt || 0),
      appointmentsToday: Number(appointmentResult[0]?.cnt || 0),
      openEscalations: Number(escalationResult[0]?.cnt || 0),
      outboundSent24h: Number(outboundResult[0]?.cnt || 0),
    };
  }

  async getPipelineMetricDetails(organizationId: string, metric: string): Promise<any[]> {
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const limit = 100;

    switch (metric) {
      case 'active_pipeline': {
        const rows = await db.select({
          id: warehouseLeads.id,
          sourceId: warehouseLeads.sourceId,
          customerName: warehouseLeads.customerName,
          customerEmail: warehouseLeads.customerEmail,
          customerPhone: warehouseLeads.customerPhone,
          vinStatus: warehouseLeads.vinStatus,
          vehicleOfInterest: warehouseLeads.vehicleOfInterest,
          leadSource: warehouseLeads.leadSource,
          syncedAt: warehouseLeads.syncedAt,
        }).from(warehouseLeads).where(and(
          eq(warehouseLeads.organizationId, organizationId),
          sql`COALESCE(${warehouseLeads.vinCreatedAt}, ${warehouseLeads.syncedAt}) >= ${fourteenDaysAgo}`,
          sql`${warehouseLeads.vinStatus} IS NOT NULL`,
          sql`${warehouseLeads.vinStatus} NOT LIKE 'LOST%'`,
          sql`${warehouseLeads.vinStatus} != 'lost'`,
          sql`${warehouseLeads.vinStatus} NOT LIKE 'SOLD%'`,
          sql`${warehouseLeads.vinStatus} != 'sold'`,
          sql`${warehouseLeads.vinStatus} != 'closed-won'`,
          sql`${warehouseLeads.vinStatus} NOT LIKE 'BAD%'`,
          sql`${warehouseLeads.vinStatus} NOT LIKE '%DUPLICATE%'`,
          sql`${warehouseLeads.vinStatus} NOT LIKE 'SERVICE%'`,
          sql`${warehouseLeads.vinStatus} != 'NON_CUSTOMER_INITIATED_LEAD'`,
        )).orderBy(desc(warehouseLeads.syncedAt)).limit(limit);
        return rows;
      }
      case 'appointments_today': {
        const rows = await db.select({
          id: appointments.id,
          customerName: appointments.customerName,
          customerPhone: appointments.customerPhone,
          customerEmail: appointments.customerEmail,
          appointmentType: appointments.appointmentType,
          department: appointments.department,
          startTime: appointments.startTime,
          status: appointments.status,
        }).from(appointments).where(and(
          eq(appointments.organizationId, organizationId),
          eq(appointments.status, "scheduled"),
          gte(appointments.startTime, todayStart),
          sql`${appointments.startTime} < ${todayStart}::date + interval '1 day'`,
        )).orderBy(appointments.startTime).limit(limit);
        return rows;
      }
      case 'open_escalations': {
        const rows = await db.select({
          id: tasks.id,
          title: tasks.title,
          type: tasks.type,
          status: tasks.status,
          priority: tasks.priority,
          description: tasks.description,
          createdAt: tasks.createdAt,
        }).from(tasks).where(and(
          eq(tasks.organizationId, organizationId),
          eq(tasks.status, "todo"),
          sql`(${tasks.type} = 'escalation' OR ${tasks.type} = 'unsent_message')`,
        )).orderBy(desc(tasks.createdAt)).limit(limit);
        return rows;
      }
      case 'outbound_sent': {
        const rows = await db.select({
          id: outboundLog.id,
          channel: outboundLog.channel,
          status: outboundLog.status,
          messageContent: outboundLog.messageContent,
          sentAt: outboundLog.sentAt,
          createdAt: outboundLog.createdAt,
          recipientId: outboundLog.recipientId,
          campaignId: outboundLog.campaignId,
        }).from(outboundLog).where(and(
          eq(outboundLog.organizationId, organizationId),
          eq(outboundLog.status, "sent"),
          gte(outboundLog.createdAt, twentyFourHoursAgo),
        )).orderBy(desc(outboundLog.createdAt)).limit(limit);

        // BUG-PE01-003 fix: resolve recipient data from campaignRecipients for campaign sends
        const recipientIds = rows.filter(r => r.recipientId).map(r => r.recipientId!);
        const recipientMap = new Map<string, { name: string; phone: string | null; email: string | null }>();
        if (recipientIds.length > 0) {
          const recipients = await db.select({
            id: campaignRecipients.id,
            firstName: campaignRecipients.firstName,
            lastName: campaignRecipients.lastName,
            phone: campaignRecipients.phone,
            email: campaignRecipients.email,
          }).from(campaignRecipients)
            .innerJoin(campaigns, eq(campaignRecipients.campaignId, campaigns.id))
            .where(and(
              eq(campaigns.organizationId, organizationId),
              sql`${campaignRecipients.id} IN (${sql.join(recipientIds.map(id => sql`${id}`), sql`, `)})`
            ));
          for (const r of recipients) {
            recipientMap.set(r.id, { name: [r.firstName, r.lastName].filter(Boolean).join(' '), phone: r.phone, email: r.email });
          }
        }

        return rows.map(row => {
          const r = row.recipientId ? recipientMap.get(row.recipientId) : undefined;
          if (r) {
            return { ...row, recipientName: r.name || null, recipientPhone: r.phone || null, recipientEmail: r.email || null };
          }
          // BUG-PE01-003: For non-campaign sends, extract phone from messageContent
          let extractedPhone: string | null = null;
          let extractedName: string | null = null;
          if (row.messageContent) {
            const phoneMatch = row.messageContent.match(/(?:to |confirmation to |sent to )(\+?[\d\-()\s]{7,})/i);
            if (phoneMatch) extractedPhone = phoneMatch[1].trim();
          }
          return { ...row, recipientName: extractedName, recipientPhone: extractedPhone, recipientEmail: null };
        });
      }
      case 'total_leads': {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const rows = await db.select({
          id: warehouseLeads.id,
          sourceId: warehouseLeads.sourceId,
          customerName: warehouseLeads.customerName,
          customerEmail: warehouseLeads.customerEmail,
          customerPhone: warehouseLeads.customerPhone,
          vinStatus: warehouseLeads.vinStatus,
          vehicleOfInterest: warehouseLeads.vehicleOfInterest,
          leadSource: warehouseLeads.leadSource,
          syncedAt: warehouseLeads.syncedAt,
        }).from(warehouseLeads).where(and(
          eq(warehouseLeads.organizationId, organizationId),
          sql`COALESCE(${warehouseLeads.vinCreatedAt}, ${warehouseLeads.syncedAt}) >= ${thirtyDaysAgo}`,
          sql`${warehouseLeads.vinStatus} IS NOT NULL`,
        )).orderBy(desc(warehouseLeads.syncedAt)).limit(limit);
        return rows;
      }
      case 'new_leads': {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const rows = await db.select({
          id: warehouseLeads.id,
          sourceId: warehouseLeads.sourceId,
          customerName: warehouseLeads.customerName,
          customerEmail: warehouseLeads.customerEmail,
          customerPhone: warehouseLeads.customerPhone,
          vinStatus: warehouseLeads.vinStatus,
          vehicleOfInterest: warehouseLeads.vehicleOfInterest,
          leadSource: warehouseLeads.leadSource,
          syncedAt: warehouseLeads.syncedAt,
        }).from(warehouseLeads).where(and(
          eq(warehouseLeads.organizationId, organizationId),
          sql`COALESCE(${warehouseLeads.vinCreatedAt}, ${warehouseLeads.syncedAt}) >= ${thirtyDaysAgo}`,
          sql`${warehouseLeads.vinStatus} IS NOT NULL`,
          sql`(${warehouseLeads.vinStatus} = 'ACTIVE_NEW_LEAD' OR ${warehouseLeads.vinStatus} = 'new' OR ${warehouseLeads.vinStatus} = 'uncontacted')`,
        )).orderBy(desc(warehouseLeads.syncedAt)).limit(limit);
        return rows;
      }
      default:
        return [];
    }
  }

  async getRecipient(id: string): Promise<CampaignRecipient | undefined> {
    const [r] = await db.select().from(campaignRecipients).where(eq(campaignRecipients.id, id));
    return r;
  }

  async updateRecipient(id: string, data: Partial<InsertCampaignRecipient>): Promise<CampaignRecipient | undefined> {
    const [updated] = await db.update(campaignRecipients).set(data).where(eq(campaignRecipients.id, id)).returning();
    return updated;
  }

  async getPendingRecipients(campaignId: string): Promise<CampaignRecipient[]> {
    return db.select().from(campaignRecipients)
      .where(and(eq(campaignRecipients.campaignId, campaignId), eq(campaignRecipients.status, "pending")))
      .orderBy(campaignRecipients.createdAt);
  }

  async createOutboundLog(log: InsertOutboundLog): Promise<OutboundLog> {
    const [created] = await db.insert(outboundLog).values(log).returning();
    return created;
  }

  async getOutboundLogs(organizationId: string, filters?: { campaignId?: string }): Promise<OutboundLog[]> {
    const conditions = [eq(outboundLog.organizationId, organizationId)];
    if (filters?.campaignId) conditions.push(eq(outboundLog.campaignId, filters.campaignId));
    return db.select().from(outboundLog).where(and(...conditions)).orderBy(desc(outboundLog.createdAt));
  }

  async getRecentOutboundCount(organizationId: string, customerContact: string, hours: number): Promise<number> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    const [result] = await db.select({ cnt: count() }).from(outboundLog)
      .innerJoin(campaignRecipients, eq(outboundLog.recipientId, campaignRecipients.id))
      .where(and(
        eq(outboundLog.organizationId, organizationId),
        eq(outboundLog.status, "sent"),
        gte(outboundLog.createdAt, since),
        sql`(${campaignRecipients.phone} = ${customerContact} OR ${campaignRecipients.email} = ${customerContact})`
      ));
    return Number(result?.cnt || 0);
  }

  async findLastOutboundForPhone(phone: string, channel?: string): Promise<OutboundLog | undefined> {
    const normalizedPhone = phone.replace(/[^0-9+]/g, "");
    const digitsOnly = normalizedPhone.replace(/\+/g, "");
    const without1 = digitsOnly.startsWith("1") && digitsOnly.length === 11 ? digitsOnly.substring(1) : digitsOnly;
    const with1 = digitsOnly.length === 10 ? "1" + digitsOnly : digitsOnly;
    const conditions = [
      eq(outboundLog.status, "sent"),
      sql`(${campaignRecipients.phone} = ${normalizedPhone} OR ${campaignRecipients.phone} = ${digitsOnly} OR ${campaignRecipients.phone} = ${without1} OR ${campaignRecipients.phone} = ${with1} OR ${campaignRecipients.phone} = ${'+' + with1})`,
    ];
    if (channel) conditions.push(eq(outboundLog.channel, channel));
    const [result] = await db.select({ outboundLog })
      .from(outboundLog)
      .innerJoin(campaignRecipients, eq(outboundLog.recipientId, campaignRecipients.id))
      .where(and(...conditions))
      .orderBy(desc(outboundLog.createdAt))
      .limit(1);
    return result?.outboundLog;
  }

  async createNotification(notif: InsertNotification): Promise<Notification> {
    const [created] = await db.insert(notifications).values(notif).returning();
    return created;
  }

  async getNotifications(userId: string, limit = 50): Promise<Notification[]> {
    return db.select().from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const [result] = await db.select({ cnt: count() }).from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
    return Number(result?.cnt || 0);
  }

  async markNotificationRead(id: string): Promise<void> {
    await db.update(notifications).set({ read: true }).where(eq(notifications.id, id));
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    await db.update(notifications).set({ read: true }).where(eq(notifications.userId, userId));
  }

  async createActivityLog(entry: InsertActivityLog): Promise<ActivityLog> {
    const [created] = await db.insert(activityLog).values(entry).returning();
    return created;
  }

  async getActivityLogs(organizationId: string, limit = 50): Promise<ActivityLog[]> {
    return db.select().from(activityLog)
      .where(eq(activityLog.organizationId, organizationId))
      .orderBy(desc(activityLog.createdAt))
      .limit(limit);
  }

  async purgeOldActivityLogs(days = 90): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const deleted = await db.delete(activityLog).where(lte(activityLog.createdAt, cutoff)).returning({ id: activityLog.id });
    return deleted.length;
  }

  async getHunches(organizationId: string, filters?: { status?: string; department?: string }): Promise<Hunch[]> {
    const conditions = [eq(hunches.organizationId, organizationId)];
    if (filters?.status) conditions.push(eq(hunches.status, filters.status));
    if (filters?.department) conditions.push(eq(hunches.department, filters.department));
    return db.select().from(hunches).where(and(...conditions)).orderBy(desc(hunches.createdAt));
  }

  async getHunch(id: string): Promise<Hunch | undefined> {
    const [h] = await db.select().from(hunches).where(eq(hunches.id, id));
    return h;
  }

  async createHunch(hunch: InsertHunch): Promise<Hunch> {
    const [created] = await db.insert(hunches).values(hunch).returning();
    return created;
  }

  async updateHunch(id: string, data: Partial<Hunch>): Promise<Hunch | undefined> {
    const [updated] = await db.update(hunches).set(data).where(eq(hunches.id, id)).returning();
    return updated;
  }

  async getAcceptedHunches(organizationId: string): Promise<Hunch[]> {
    return db.select().from(hunches)
      .where(and(eq(hunches.organizationId, organizationId), eq(hunches.status, "accepted")))
      .orderBy(desc(hunches.createdAt));
  }

  async upsertWarehouseLead(lead: InsertWarehouseLead): Promise<WarehouseLead> {
    const conversionStatuses = ['SOLD', 'sold', 'SOLD_DELIVERED', 'SOLD_PENDING_FINANCE'];
    if (lead.sourceId) {
      const [existing] = await db.select().from(warehouseLeads)
        .where(and(
          eq(warehouseLeads.organizationId, lead.organizationId),
          eq(warehouseLeads.sourceId, lead.sourceId)
        ));
      if (existing) {
        const [updated] = await db.update(warehouseLeads)
          .set({ ...lead, syncedAt: new Date() })
          .where(eq(warehouseLeads.id, existing.id))
          .returning();
        if (lead.vinStatus && conversionStatuses.includes(lead.vinStatus) && (existing.followupStep || 0) < 999) {
          await this.suppressLeadFollowup(updated.id, `VIN status changed to ${lead.vinStatus}`);
          console.log(`[Conversion] VIN status ${lead.vinStatus} — suppressed follow-up for lead ${updated.id} (${updated.customerName})`);
        }
        return updated;
      }
    }
    const [created] = await db.insert(warehouseLeads).values(lead).returning();
    if (lead.vinStatus && conversionStatuses.includes(lead.vinStatus)) {
      await this.suppressLeadFollowup(created.id, `VIN status set to ${lead.vinStatus} on creation`);
      console.log(`[Conversion] New lead with VIN status ${lead.vinStatus} — suppressed follow-up for lead ${created.id} (${created.customerName})`);
    }
    return created;
  }

  async getWarehouseLeadBySourceId(organizationId: string, sourceId: string): Promise<WarehouseLead | null> {
    const [row] = await db.select().from(warehouseLeads)
      .where(and(
        eq(warehouseLeads.organizationId, organizationId),
        eq(warehouseLeads.sourceId, sourceId)
      ))
      .limit(1);
    return row || null;
  }

  async getLeadsDueForFollowup(organizationId: string, delayHours: number, limit: number = 20): Promise<WarehouseLead[]> {
    const cutoff = new Date(Date.now() - delayHours * 60 * 60 * 1000);
    const defaultConversionStatuses = ['SOLD', 'sold', 'SOLD_DELIVERED', 'SOLD_PENDING_FINANCE'];
    return db.select().from(warehouseLeads)
      .where(and(
        eq(warehouseLeads.organizationId, organizationId),
        isNull(warehouseLeads.followupSentAt),
        isNotNull(warehouseLeads.customerPhone),
        sql`COALESCE(${warehouseLeads.vinCreatedAt}, ${warehouseLeads.createdAt}) <= ${cutoff}`,
        sql`(${warehouseLeads.vinStatus} IS NULL OR ${warehouseLeads.vinStatus} NOT IN (${sql.join(defaultConversionStatuses.map(s => sql`${s}`), sql`, `)}))`,
        sql`COALESCE(${warehouseLeads.followupStep}, 0) < 999`
      ))
      .orderBy(desc(warehouseLeads.createdAt))
      .limit(limit);
  }

  async getLeadsDueForMultiStepFollowup(organizationId: string, sequenceLength: number, conversionStatuses: string[], limit: number = 20): Promise<WarehouseLead[]> {
    const effectiveMax = Math.min(sequenceLength, 998);
    const conditions = [
      eq(warehouseLeads.organizationId, organizationId),
      sql`(${warehouseLeads.customerPhone} IS NOT NULL OR ${warehouseLeads.customerEmail} IS NOT NULL)`,
      sql`COALESCE(${warehouseLeads.followupStep}, 0) < ${effectiveMax}`,
    ];
    if (conversionStatuses.length > 0) {
      conditions.push(
        sql`(${warehouseLeads.vinStatus} IS NULL OR ${warehouseLeads.vinStatus} NOT IN (${sql.join(conversionStatuses.map(s => sql`${s}`), sql`, `)}))`
      );
    }
    return db.select().from(warehouseLeads)
      .where(and(...conditions))
      .orderBy(desc(warehouseLeads.createdAt))
      .limit(limit);
  }

  async markFollowupSent(leadId: string): Promise<void> {
    await db.update(warehouseLeads)
      .set({ followupSentAt: new Date() })
      .where(eq(warehouseLeads.id, leadId));
  }

  async updateFollowupStep(leadId: string, step: number): Promise<void> {
    await db.update(warehouseLeads)
      .set({ followupStep: step, followupSentAt: new Date() })
      .where(eq(warehouseLeads.id, leadId));
  }

  async getWarehouseLeads(organizationId: string, filters?: { status?: string; dataSource?: string; limit?: number; createdAfter?: Date; activityAfter?: Date }): Promise<WarehouseLead[]> {
    const conditions = [eq(warehouseLeads.organizationId, organizationId)];
    if (filters?.status) conditions.push(eq(warehouseLeads.vinStatus, filters.status));
    if (filters?.dataSource) conditions.push(eq(warehouseLeads.dataSource, filters.dataSource));
    if (filters?.createdAfter) conditions.push(sql`COALESCE(${warehouseLeads.vinCreatedAt}, ${warehouseLeads.syncedAt}) >= ${filters.createdAfter}`);
    if (filters?.activityAfter) conditions.push(sql`COALESCE(${warehouseLeads.vinUpdatedAt}, ${warehouseLeads.syncedAt}) >= ${filters.activityAfter}`);
    const query = db.select().from(warehouseLeads).where(and(...conditions)).orderBy(desc(warehouseLeads.syncedAt));
    if (filters?.limit) return query.limit(filters.limit);
    return query;
  }

  async getWarehouseLeadCount(organizationId: string, filters?: { status?: string }): Promise<number> {
    const conditions = [eq(warehouseLeads.organizationId, organizationId)];
    if (filters?.status) conditions.push(eq(warehouseLeads.vinStatus, filters.status));
    const [result] = await db.select({ cnt: count() }).from(warehouseLeads).where(and(...conditions));
    return Number(result?.cnt || 0);
  }

  async upsertWarehouseMetric(metric: InsertWarehouseMetric): Promise<WarehouseMetric> {
    const conditions = [
      eq(warehouseMetrics.organizationId, metric.organizationId),
      eq(warehouseMetrics.metricKey, metric.metricKey),
    ];
    if (metric.period) conditions.push(eq(warehouseMetrics.period, metric.period));
    const [existing] = await db.select().from(warehouseMetrics).where(and(...conditions));
    if (existing) {
      const [updated] = await db.update(warehouseMetrics)
        .set({ ...metric, syncedAt: new Date() })
        .where(eq(warehouseMetrics.id, existing.id))
        .returning();
      return updated;
    }
    const [created] = await db.insert(warehouseMetrics).values(metric).returning();
    return created;
  }

  async getWarehouseMetrics(organizationId: string, filters?: { metricKey?: string; period?: string }): Promise<WarehouseMetric[]> {
    const conditions = [eq(warehouseMetrics.organizationId, organizationId)];
    if (filters?.metricKey) conditions.push(eq(warehouseMetrics.metricKey, filters.metricKey));
    if (filters?.period) conditions.push(eq(warehouseMetrics.period, filters.period));
    return db.select().from(warehouseMetrics).where(and(...conditions)).orderBy(desc(warehouseMetrics.syncedAt));
  }

  async createSyncLog(entry: InsertSyncLog): Promise<SyncLog> {
    const [created] = await db.insert(syncLog).values(entry).returning();
    return created;
  }

  async updateSyncLog(id: string, data: Partial<SyncLog>): Promise<SyncLog | undefined> {
    const [updated] = await db.update(syncLog).set(data).where(eq(syncLog.id, id)).returning();
    return updated;
  }

  async getLatestSync(organizationId: string, syncType?: string): Promise<SyncLog | undefined> {
    const conditions = [eq(syncLog.organizationId, organizationId)];
    if (syncType) conditions.push(eq(syncLog.syncType, syncType));
    const [latest] = await db.select().from(syncLog)
      .where(and(...conditions))
      .orderBy(desc(syncLog.startedAt))
      .limit(1);
    return latest;
  }

  async getSyncLogs(organizationId: string, limit = 20): Promise<SyncLog[]> {
    return db.select().from(syncLog)
      .where(eq(syncLog.organizationId, organizationId))
      .orderBy(desc(syncLog.startedAt))
      .limit(limit);
  }

  async getAppointments(organizationId: string, filters?: { department?: string; startDate?: Date; endDate?: Date }): Promise<Appointment[]> {
    const conditions = [eq(appointments.organizationId, organizationId)];
    if (filters?.department) conditions.push(eq(appointments.department, filters.department));
    if (filters?.startDate) conditions.push(gte(appointments.startTime, filters.startDate));
    if (filters?.endDate) conditions.push(lte(appointments.startTime, filters.endDate));
    return db.select().from(appointments).where(and(...conditions)).orderBy(appointments.startTime);
  }

  async getAppointment(id: string): Promise<Appointment | undefined> {
    const [result] = await db.select().from(appointments).where(eq(appointments.id, id));
    return result;
  }

  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const [created] = await db.insert(appointments).values(appointment).returning();
    return created;
  }

  async updateAppointment(id: string, data: Partial<InsertAppointment>): Promise<Appointment | undefined> {
    const [updated] = await db.update(appointments).set({ ...data, updatedAt: new Date() }).where(eq(appointments.id, id)).returning();
    return updated;
  }

  async deleteAppointment(id: string): Promise<void> {
    await db.delete(appointments).where(eq(appointments.id, id));
  }

  async getOrganizationBySlug(slug: string): Promise<Organization | undefined> {
    const [result] = await db.select().from(organizations).where(eq(organizations.slug, slug));
    return result;
  }

  async getSlugRedirect(oldSlug: string): Promise<SlugRedirect | undefined> {
    const [result] = await db.select().from(slugRedirects)
      .where(and(eq(slugRedirects.oldSlug, oldSlug), gte(slugRedirects.expiresAt, new Date())));
    return result;
  }

  async createSlugRedirect(redirect: InsertSlugRedirect): Promise<SlugRedirect> {
    const [created] = await db.insert(slugRedirects).values(redirect).returning();
    return created;
  }

  async updateOrganizationSlug(id: string, newSlug: string): Promise<Organization | undefined> {
    const [updated] = await db.update(organizations)
      .set({ slug: newSlug, updatedAt: new Date() })
      .where(eq(organizations.id, id))
      .returning();
    return updated;
  }

  async logUsageEvent(event: InsertUsageEvent): Promise<UsageEvent> {
    const [created] = await db.insert(usageEvents).values(event).returning();
    return created;
  }

  async getUsageEvents(organizationId: string, filters?: { startDate?: Date; endDate?: Date; eventType?: string }): Promise<UsageEvent[]> {
    const conditions = [eq(usageEvents.organizationId, organizationId)];
    if (filters?.startDate) conditions.push(gte(usageEvents.createdAt, filters.startDate));
    if (filters?.endDate) conditions.push(lte(usageEvents.createdAt, filters.endDate));
    if (filters?.eventType) conditions.push(eq(usageEvents.eventType, filters.eventType));
    return db.select().from(usageEvents).where(and(...conditions)).orderBy(desc(usageEvents.createdAt));
  }

  async getUsageSummary(organizationId: string, startDate: Date, endDate: Date): Promise<{ eventType: string; total: number }[]> {
    const rows = await db.select({
      eventType: usageEvents.eventType,
      total: count(),
    })
      .from(usageEvents)
      .where(and(
        eq(usageEvents.organizationId, organizationId),
        gte(usageEvents.createdAt, startDate),
        lte(usageEvents.createdAt, endDate)
      ))
      .groupBy(usageEvents.eventType);
    return rows.map(r => ({ eventType: r.eventType, total: Number(r.total) }));
  }
  async getFavorites(userId: string): Promise<Favorite[]> {
    return db.select().from(favorites).where(eq(favorites.userId, userId)).orderBy(favorites.createdAt);
  }

  async addFavorite(fav: InsertFavorite): Promise<Favorite> {
    const [created] = await db.insert(favorites).values(fav).returning();
    return created;
  }

  async removeFavorite(id: string, userId: string): Promise<void> {
    await db.delete(favorites).where(and(eq(favorites.id, id), eq(favorites.userId, userId)));
  }

  async createBlacklistEntry(entry: InsertSmsBlacklist): Promise<SmsBlacklist> {
    const existing = await this.getBlacklistEntry(entry.phoneNumber, entry.organizationId);
    if (existing) return existing;
    const [created] = await db.insert(smsBlacklist).values(entry).returning();
    return created;
  }

  async getBlacklistEntry(phoneNumber: string, organizationId: string): Promise<SmsBlacklist | undefined> {
    const normalizedPhone = phoneNumber.replace(/[^0-9+]/g, "");
    const digitsOnly = normalizedPhone.replace(/\+/g, "");
    const without1 = digitsOnly.startsWith("1") && digitsOnly.length === 11 ? digitsOnly.substring(1) : digitsOnly;
    const with1 = digitsOnly.length === 10 ? "1" + digitsOnly : digitsOnly;
    const variants = Array.from(new Set([normalizedPhone, digitsOnly, without1, with1, "+" + with1]));
    const phoneSql = sql`(${smsBlacklist.phoneNumber} IN (${sql.join(variants.map(v => sql`${v}`), sql`, `)}))`;
    const [entry] = await db.select().from(smsBlacklist)
      .where(and(phoneSql, eq(smsBlacklist.organizationId, organizationId)))
      .limit(1);
    return entry;
  }

  async getBlacklistByOrg(organizationId: string): Promise<SmsBlacklist[]> {
    return db.select().from(smsBlacklist)
      .where(eq(smsBlacklist.organizationId, organizationId))
      .orderBy(desc(smsBlacklist.createdAt));
  }

  async removeBlacklistEntry(id: string): Promise<void> {
    await db.delete(smsBlacklist).where(eq(smsBlacklist.id, id));
  }

  async updateWarehouseLeadScore(leadId: string, score: number): Promise<void> {
    await db.update(warehouseLeads)
      .set({ leadScore: score })
      .where(eq(warehouseLeads.id, leadId));
  }

  async suppressLeadFollowup(leadId: string, reason: string): Promise<void> {
    await db.update(warehouseLeads)
      .set({ followupSentAt: new Date(), followupStep: 999 })
      .where(eq(warehouseLeads.id, leadId));
    console.log(`[Conversion] Lead ${leadId} suppressed from follow-up queue: ${reason}`);
  }

  async findWarehouseLeadsByContact(organizationId: string, phone?: string | null, email?: string | null): Promise<WarehouseLead[]> {
    if (!phone && !email) return [];
    const conditions = [eq(warehouseLeads.organizationId, organizationId)];
    const contactConditions: any[] = [];
    if (phone) {
      const normalizedPhone = phone.replace(/[^0-9]/g, "");
      const last10 = normalizedPhone.slice(-10);
      contactConditions.push(
        sql`REPLACE(REPLACE(REPLACE(REPLACE(${warehouseLeads.customerPhone}, '-', ''), ' ', ''), '(', ''), ')', '') LIKE ${'%' + last10}`
      );
    }
    if (email) {
      contactConditions.push(sql`LOWER(${warehouseLeads.customerEmail}) = ${email.toLowerCase()}`);
    }
    if (contactConditions.length === 1) {
      conditions.push(contactConditions[0]);
    } else {
      conditions.push(sql`(${sql.join(contactConditions, sql` OR `)})`);
    }
    return db.select().from(warehouseLeads).where(and(...conditions));
  }

  async getUnansweredConversations(thresholdMinutes: number): Promise<Conversation[]> {
    const cutoff = new Date(Date.now() - thresholdMinutes * 60 * 1000);
    return db.select().from(conversations)
      .where(and(
        sql`(${conversations.status} = 'active' OR ${conversations.status} = 'open')`,
        sql`(${conversations.channel} IN ('sms', 'chat', 'widget'))`,
        isNull(conversations.escalationSentAt),
        isNotNull(conversations.lastMessageAt),
        lte(conversations.lastMessageAt, cutoff),
        sql`EXISTS (SELECT 1 FROM ${messages} WHERE ${messages.conversationId} = ${conversations.id} AND ${messages.role} IN ('user', 'customer'))`,
        sql`NOT EXISTS (SELECT 1 FROM ${messages} WHERE ${messages.conversationId} = ${conversations.id} AND ${messages.role} IN ('agent', 'system', 'assistant') AND ${messages.createdAt} >= (SELECT MAX(m2."created_at") FROM ${messages} m2 WHERE m2."conversation_id" = ${conversations.id} AND m2."role" IN ('user', 'customer')))`
      ))
      .orderBy(conversations.lastMessageAt);
  }

  async markEscalationSent(conversationId: string): Promise<void> {
    await db.update(conversations)
      .set({ escalationSentAt: new Date() } as any)
      .where(eq(conversations.id, conversationId));
  }

  async findUserByResetToken(token: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.resetToken, token));
    return user;
  }

  async clearResetToken(userId: string): Promise<void> {
    await db.update(users)
      .set({ resetToken: sql`NULL`, resetTokenExpiry: sql`NULL`, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async countRecentSecurityEvents(action: string, entityId: string, since: Date): Promise<number> {
    const [result] = await db.select({ cnt: count() })
      .from(activityLog)
      .where(and(
        eq(activityLog.action, action),
        eq(activityLog.entityId, entityId),
        gte(activityLog.createdAt, since)
      ));
    return Number(result?.cnt || 0);
  }

  async createScheduledAction(action: InsertScheduledAction): Promise<ScheduledAction> {
    const [row] = await db.insert(scheduledActions).values(action).returning();
    return row;
  }

  async getDueScheduledActions(): Promise<ScheduledAction[]> {
    return db.select().from(scheduledActions)
      .where(and(
        lte(scheduledActions.executeAt, new Date()),
        isNull(scheduledActions.executedAt)
      ))
      .orderBy(scheduledActions.executeAt);
  }

  async markScheduledActionExecuted(id: string): Promise<void> {
    await db.update(scheduledActions)
      .set({ executedAt: new Date() })
      .where(eq(scheduledActions.id, id));
  }

  async acquireSchedulerLock(lockName: string, lockedBy: string, ttlMinutes = 5): Promise<boolean> {
    const cutoff = new Date(Date.now() - ttlMinutes * 60 * 1000);
    const existing = await db.select().from(schedulerLocks)
      .where(eq(schedulerLocks.lockName, lockName));

    if (existing.length === 0) {
      try {
        await db.insert(schedulerLocks).values({
          lockName,
          lockedAt: new Date(),
          lockedBy,
        });
        return true;
      } catch {
        return false;
      }
    }

    const lock = existing[0];
    if (lock.lockedAt && lock.lockedAt > cutoff) {
      return false;
    }

    const [updated] = await db.update(schedulerLocks)
      .set({ lockedAt: new Date(), lockedBy })
      .where(and(
        eq(schedulerLocks.lockName, lockName),
        sql`(${schedulerLocks.lockedAt} IS NULL OR ${schedulerLocks.lockedAt} <= ${cutoff})`
      ))
      .returning();

    return !!updated;
  }

  async releaseSchedulerLock(lockName: string): Promise<void> {
    await db.update(schedulerLocks)
      .set({ lockedAt: null, lockedBy: null })
      .where(eq(schedulerLocks.lockName, lockName));
  }

  async getSchedulerLock(lockName: string): Promise<SchedulerLock | undefined> {
    const [row] = await db.select().from(schedulerLocks)
      .where(eq(schedulerLocks.lockName, lockName));
    return row;
  }

  async updateSchedulerLastRunAt(lockName: string): Promise<void> {
    const existing = await db.select().from(schedulerLocks)
      .where(eq(schedulerLocks.lockName, lockName));

    if (existing.length === 0) {
      await db.insert(schedulerLocks).values({
        lockName,
        lastRunAt: new Date(),
      });
    } else {
      await db.update(schedulerLocks)
        .set({ lastRunAt: new Date() })
        .where(eq(schedulerLocks.lockName, lockName));
    }
  }
}

export const storage = new DatabaseStorage();
