import { eq, and, desc, count, sql, gte } from "drizzle-orm";
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
  users, roles, organizations, sessions, agents, conversations, messages, campaigns, integrations, tasks, widgets,
  knowledgeDocuments, campaignRecipients,
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

  getConversations(organizationId: string, filters?: { status?: string; channel?: string }): Promise<Conversation[]>;
  getConversation(id: string): Promise<Conversation | undefined>;
  createConversation(conv: InsertConversation): Promise<Conversation>;
  updateConversation(id: string, data: Partial<InsertConversation>): Promise<Conversation | undefined>;

  getMessages(conversationId: string): Promise<Message[]>;
  createMessage(msg: InsertMessage): Promise<Message>;
  deleteConversation(id: string): Promise<void>;
  deleteMessages(conversationId: string): Promise<void>;

  getCampaigns(organizationId: string, filters?: { department?: string }): Promise<Campaign[]>;
  getCampaign(id: string): Promise<Campaign | undefined>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  updateCampaign(id: string, data: Partial<InsertCampaign>): Promise<Campaign | undefined>;

  getIntegrations(organizationId: string, filters?: { provider?: string }): Promise<Integration[]>;
  getIntegration(id: string): Promise<Integration | undefined>;
  createIntegration(integration: InsertIntegration): Promise<Integration>;
  updateIntegration(id: string, data: Partial<InsertIntegration>): Promise<Integration | undefined>;

  getTasks(organizationId: string, filters?: { status?: string; assignedUserId?: string }): Promise<Task[]>;
  getTask(id: string): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, data: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: string): Promise<void>;

  getWidgets(organizationId: string): Promise<Widget[]>;
  getWidget(id: string): Promise<Widget | undefined>;
  createWidget(widget: InsertWidget): Promise<Widget>;
  updateWidget(id: string, data: Partial<InsertWidget>): Promise<Widget | undefined>;
  deleteWidget(id: string): Promise<void>;

  getDocuments(organizationId: string, agentId?: string): Promise<KnowledgeDocument[]>;
  getDocument(id: string): Promise<KnowledgeDocument | undefined>;
  createDocument(doc: InsertKnowledgeDocument): Promise<KnowledgeDocument>;
  deleteDocument(id: string): Promise<void>;

  getRecipients(campaignId: string): Promise<CampaignRecipient[]>;
  createRecipients(recipients: InsertCampaignRecipient[]): Promise<CampaignRecipient[]>;
  getRecipientCount(campaignId: string): Promise<number>;

  getDashboardMetrics(organizationId: string): Promise<DashboardMetrics>;
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

  async getConversations(organizationId: string, filters?: { status?: string; channel?: string }): Promise<Conversation[]> {
    const conditions = [eq(conversations.organizationId, organizationId)];
    if (filters?.status) conditions.push(eq(conversations.status, filters.status));
    if (filters?.channel) conditions.push(eq(conversations.channel, filters.channel));
    return db.select().from(conversations).where(and(...conditions)).orderBy(desc(conversations.lastMessageAt));
  }

  async getConversation(id: string): Promise<Conversation | undefined> {
    const [conv] = await db.select().from(conversations).where(eq(conversations.id, id));
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

  async getTasks(organizationId: string, filters?: { status?: string; assignedUserId?: string }): Promise<Task[]> {
    const conditions = [eq(tasks.organizationId, organizationId)];
    if (filters?.status) conditions.push(eq(tasks.status, filters.status));
    if (filters?.assignedUserId) conditions.push(eq(tasks.assignedUserId, filters.assignedUserId));
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
    };
  }
}

export const storage = new DatabaseStorage();
