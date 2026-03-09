import { eq, and, desc, count, sql, gte, lte } from "drizzle-orm";
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
  users, roles, organizations, sessions, agents, conversations, messages, campaigns, integrations, tasks, widgets,
  knowledgeDocuments, campaignRecipients, outboundLog, notifications, activityLog, hunches,
  warehouseLeads, warehouseMetrics, appointments, slugRedirects, syncLog, usageEvents, favorites,
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
  getConversationByPhone(phone: string, channel?: string): Promise<Conversation | undefined>;
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
  createDocument(doc: InsertKnowledgeDocument): Promise<KnowledgeDocument>;
  deleteDocument(id: string): Promise<void>;

  getRecipients(campaignId: string): Promise<CampaignRecipient[]>;
  getRecipient(id: string): Promise<CampaignRecipient | undefined>;
  createRecipients(recipients: InsertCampaignRecipient[]): Promise<CampaignRecipient[]>;
  getRecipientCount(campaignId: string): Promise<number>;
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

  getFavorites(userId: string): Promise<Favorite[]>;
  addFavorite(fav: InsertFavorite): Promise<Favorite>;
  removeFavorite(id: string, userId: string): Promise<void>;
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

const db = drizzle(process.env.DATABASE_URL!);

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
    const normalizedPhone = phone.replace(/[^0-9+]/g, "");
    const conv = await db.select({ organizationId: conversations.organizationId })
      .from(conversations)
      .where(eq(conversations.customerPhone, normalizedPhone))
      .limit(1);
    if (conv.length > 0) {
      return this.getOrganization(conv[0].organizationId);
    }
    return undefined;
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

  async getConversationByPhone(phone: string, channel?: string): Promise<Conversation | undefined> {
    const normalizedPhone = phone.replace(/[^0-9+]/g, "");
    const conditions = [
      eq(conversations.customerPhone, normalizedPhone),
      eq(conversations.status, "open"),
    ];
    if (channel) conditions.push(eq(conversations.channel, channel));
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

  async deleteDocument(id: string): Promise<void> {
    await db.delete(knowledgeDocuments).where(eq(knowledgeDocuments.id, id));
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
        department: campaigns.department,
        status: campaigns.status,
        sentCount: campaigns.sentCount,
        repliedCount: campaigns.repliedCount,
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

    const byDepartment: Record<string, { total: number; active: number; sent: number; replied: number; replyRate: number }> = {};
    let totalCampaigns = 0, activeCampaigns = 0, totalSent = 0, totalReplied = 0;
    for (const row of campaignRows) {
      totalCampaigns++;
      if (row.status === "active") activeCampaigns++;
      totalSent += row.sentCount;
      totalReplied += row.repliedCount;
      if (!byDepartment[row.department]) byDepartment[row.department] = { total: 0, active: 0, sent: 0, replied: 0, replyRate: 0 };
      byDepartment[row.department].total++;
      if (row.status === "active") byDepartment[row.department].active++;
      byDepartment[row.department].sent += row.sentCount;
      byDepartment[row.department].replied += row.repliedCount;
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
    const conditions = [
      eq(outboundLog.status, "sent"),
      sql`${campaignRecipients.phone} = ${normalizedPhone}`,
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
        return updated;
      }
    }
    const [created] = await db.insert(warehouseLeads).values(lead).returning();
    return created;
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
}

export const storage = new DatabaseStorage();
