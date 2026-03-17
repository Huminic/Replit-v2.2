import bcrypt from "bcrypt";
import crypto from "crypto";
import { storage } from "./storage";
import { billingService } from "./services/billingService";

const SALT_ROUNDS = 10;

const seedPassword = process.env.SEED_DEFAULT_PASSWORD || (process.env.NODE_ENV === 'development' ? 'password123' : crypto.randomUUID());
if (!process.env.SEED_DEFAULT_PASSWORD && process.env.NODE_ENV === 'production') {
  console.log("Generated seed admin password:", seedPassword);
}

const BILLING_CUSTOMER_MAP: Record<string, string> = process.env.BILLING_CUSTOMER_MAP ? JSON.parse(process.env.BILLING_CUSTOMER_MAP) : {};

async function seedTasksAndWidgets() {
  const orgs = await storage.getOrganizations();
  const serraHonda = orgs.find(o => o.slug === "serra-honda");
  if (!serraHonda) return;

  const existingTasks = await storage.getTasks(serraHonda.id);
  if (existingTasks.length > 0) return;

  const orgUsers = await storage.getUsers(serraHonda.id);
  const adminUser = orgUsers.find(u => u.email === "admin@nexxus.com");
  const salesUser = orgUsers.find(u => u.email === "sales@serrahonda.com");
  const serviceUser = orgUsers.find(u => u.email === "service@serrahonda.com");
  const allAgents = await storage.getAgents(serraHonda.id);
  const carolineAgent = allAgents.find(a => a.name === "Caroline");

  const taskData = [
    { title: "Follow up with Michael Clark", description: "Customer asked about trade-in value for 2026 Camry. Need to send KBB estimate and schedule test drive.", status: "in_progress", priority: "high", dueDate: new Date("2026-03-06"), assignedUserId: salesUser?.id || adminUser?.id, tags: ["sales", "follow-up"] },
    { title: "Complete sales report for February", description: "Monthly sales performance report including lead conversion rates and pipeline analysis.", status: "in_progress", priority: "medium", dueDate: new Date("2026-03-07"), assignedUserId: adminUser?.id, tags: ["reports", "sales"] },
    { title: "Review lead qualification criteria", description: "Update lead scoring model based on Q1 conversion data. Focus on BAD_DUPLICATE reduction.", status: "todo", priority: "low", dueDate: new Date("2026-03-10"), assignedUserId: adminUser?.id, tags: ["leads", "quality"] },
    { title: "Respond to service inquiry - Joshua T.", description: "Customer has questions about special pricing on service campaign.", status: "todo", priority: "high", dueDate: new Date("2026-03-05"), assignedUserId: serviceUser?.id || adminUser?.id, tags: ["service", "customer"] },
    { title: "Update CRM contact records", description: "Sync VinSolutions contact data with Nexxus records. 24 records need manual review.", status: "todo", priority: "medium", dueDate: new Date("2026-03-12"), assignedUserId: adminUser?.id, tags: ["crm", "data"] },
    { title: "Prepare weekly team standup notes", description: "Compile key metrics and action items for Monday standup meeting.", status: "done", priority: "low", dueDate: new Date("2026-03-03"), assignedUserId: adminUser?.id, tags: ["team", "meetings"] },
  ];

  for (const t of taskData) {
    await storage.createTask({
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate,
      assignedUserId: t.assignedUserId!,
      organizationId: serraHonda.id,
      tags: t.tags,
    });
  }

  const widgetData = [
    { name: "Serra Honda Sales Chat", type: "text", status: "active", description: "Primary website chat widget for sales inquiries and lead capture.", widgetCode: "wgt_serra_honda_sales", config: { position: "bottom-right", primaryColor: "#6366f1", accentColor: "#8b5cf6", greeting: "Hi! How can I help you find your perfect vehicle?", agentId: carolineAgent?.id, animation: "fade", showOrganizationName: true, audienceType: "all", deviceMobile: true, deviceDesktop: true, triggerDelay: 3, exitIntent: true, allowedDomains: ["serrahonda.com", "www.serrahonda.com"] } },
    { name: "Serra Video Assistant", type: "video", status: "active", description: "Video chat widget powered by Tavus for personalized customer interactions.", widgetCode: "wgt_serra_video_assist", config: { position: "bottom-right", primaryColor: "#8b5cf6", accentColor: "#a78bfa", greeting: "Click to start a video chat!", tavusPersonaId: "p9eb007721f4", animation: "slide", showOrganizationName: true, audienceType: "returning", deviceMobile: false, deviceDesktop: true, triggerDelay: 5, exitIntent: false, allowedDomains: ["serrahonda.com"] }, impressions: 1240, interactions: 89 },
    { name: "Service Appointment Bot", type: "voice", status: "inactive", description: "Voice widget for service appointment scheduling and recall notifications.", widgetCode: "wgt_serra_service_voice", config: { position: "bottom-left", primaryColor: "#14b8a6", accentColor: "#2dd4bf", greeting: "Need to schedule service?", vapiAssistantId: "90a876c0-0f11-4424-abfe-9ac82b264d88", animation: "bounce", showOrganizationName: false, audienceType: "all", deviceMobile: true, deviceDesktop: true, triggerDelay: 0, exitIntent: false, allowedDomains: ["serrahonda.com", "service.serrahonda.com"] }, impressions: 450, interactions: 34 },
    { name: "Marketing Landing Widget", type: "unified", status: "draft", description: "Multi-channel widget for marketing landing pages with text, voice, and video options.", widgetCode: "wgt_serra_marketing_unified", config: { position: "bottom-right", primaryColor: "#ec4899", accentColor: "#f472b6", greeting: "Explore our latest deals!", animation: "fade", showOrganizationName: true, audienceType: "new", deviceMobile: true, deviceDesktop: true, triggerDelay: 10, exitIntent: true, allowedDomains: ["deals.serrahonda.com"] } },
  ];

  for (const w of widgetData) {
    await storage.createWidget({
      name: w.name,
      type: w.type,
      status: w.status,
      description: w.description,
      widgetCode: w.widgetCode,
      organizationId: serraHonda.id,
      config: w.config,
      impressions: w.impressions || 0,
      interactions: w.interactions || 0,
    });
  }

  console.log("Tasks and widgets seeded successfully!");
}

async function seedMissingOrganizations() {
  const orgs = await storage.getOrganizations();
  const existingSlugs = orgs.map(o => o.slug);

  let cageAutomotive = orgs.find(o => o.slug === "cage-automotive");
  if (!cageAutomotive) {
    console.log("Creating missing organization: Cage Automotive");
    cageAutomotive = await storage.createOrganization({
      name: "Cage Automotive",
      slug: "cage-automotive",
      personaName: "Cage",
      outboundEnabled: true,
      smsEnabled: true,
      phoneEnabled: true,
      emailEnabled: true,
    });
  }

  const missingOrgs = [
    { name: "Hyundai of Columbia", slug: "hyundai-of-columbia", personaName: "Elizabeth", partnerId: cageAutomotive.id },
    { name: "Ford of Columbia", slug: "ford-of-columbia", personaName: "Savannah", partnerId: cageAutomotive.id },
  ];

  const personaNameFixes: Record<string, string> = {
    "serra-honda": "Caroline",
    "serra-nissan": "Magnolia",
    "tony-serra-ford": "Georgia",
    "hyundai-of-columbia": "Elizabeth",
    "ford-of-columbia": "Savannah",
  };
  for (const org of orgs) {
    const correctName = personaNameFixes[org.slug];
    if (correctName && org.personaName !== correctName) {
      console.log(`Fixing persona name for ${org.name}: ${org.personaName} -> ${correctName}`);
      await storage.updateOrganization(org.id, { personaName: correctName });
    }
  }

  for (const orgDef of missingOrgs) {
    if (!existingSlugs.includes(orgDef.slug)) {
      console.log(`Creating missing organization: ${orgDef.name}`);
      const newOrg = await storage.createOrganization({
        name: orgDef.name,
        slug: orgDef.slug,
        personaName: orgDef.personaName,
        partnerId: orgDef.partnerId,
        outboundEnabled: true,
        smsEnabled: true,
        phoneEnabled: true,
        emailEnabled: true,
      });

      const agentMap: Record<string, { name: string; department: string; description: string; assignedPhone: string; vapiAssistantId: string; tavusPersonaId: string }> = {
        "hyundai-of-columbia": { name: "Elizabeth", department: "marketing", description: "Hyundai of Columbia AI Marketing Agent. Handles campaign responses and lead nurturing.", assignedPhone: "+1 (901) 203-9398", vapiAssistantId: "6d12a8fa-0ed0-4ec1-bfdb-e84587ff86c0", tavusPersonaId: "p92b0da01c4f" },
        "ford-of-columbia": { name: "Savannah", department: "service", description: "Ford of Columbia AI Service Agent. Manages service lane communications and upsell opportunities.", assignedPhone: "+1 (931) 369-2815", vapiAssistantId: "6216451c-e0a3-43d0-aece-ae382bd8df25", tavusPersonaId: "pf233f09f33d" },
      };

      const agentDef = agentMap[orgDef.slug];
      if (agentDef) {
        console.log(`Creating agent ${agentDef.name} for ${orgDef.name}`);
        await storage.createAgent({
          name: agentDef.name,
          department: agentDef.department,
          type: "ai",
          status: "active",
          description: agentDef.description,
          channels: ["voice", "video"],
          dealership: orgDef.name,
          assignedPhone: agentDef.assignedPhone,
          vapiAssistantId: agentDef.vapiAssistantId,
          tavusPersonaId: agentDef.tavusPersonaId,
          autoGreeting: null,
          organizationId: newOrg.id,
        });
      }
    }
  }
}

async function seedMissingAgents() {
  const orgs = await storage.getOrganizations();
  const serraHonda = orgs.find(o => o.slug === "serra-honda");
  if (!serraHonda) return;

  const existingAgents = await storage.getAgents(serraHonda.id);
  const missingAgents = [
    { name: "Service Agent", department: "service", description: "Serra Honda AI Service Knowledge Agent. Provides service campaign insights, recall information, maintenance scheduling guidance, and service lane performance data.", channels: ["chat"], dealership: "Serra Honda", orgId: serraHonda.id, assignedPhone: null, vapiAssistantId: null, tavusPersonaId: null },
    { name: "Marketing Agent", department: "marketing", description: "Serra Honda AI Marketing Knowledge Agent. Analyzes marketing campaign performance, tracks lead source ROI, manages promotional content, and provides marketing analytics insights.", channels: ["chat"], dealership: "Serra Honda", orgId: serraHonda.id, assignedPhone: null, vapiAssistantId: null, tavusPersonaId: null },
  ];

  for (const a of missingAgents) {
    if (!existingAgents.find(e => e.name === a.name && e.organizationId === a.orgId)) {
      console.log(`Creating missing agent: ${a.name}`);
      await storage.createAgent({
        name: a.name,
        department: a.department,
        type: "ai",
        status: "active",
        description: a.description,
        channels: a.channels,
        dealership: a.dealership,
        assignedPhone: a.assignedPhone,
        vapiAssistantId: a.vapiAssistantId,
        tavusPersonaId: a.tavusPersonaId,
        autoGreeting: null,
        organizationId: a.orgId,
      });
    }
  }
}

async function seedBillingData() {
  const billingMap: Record<string, string> = BILLING_CUSTOMER_MAP;

  try {
    const orgs = await storage.getOrganizations();
    for (const [slug, customerId] of Object.entries(billingMap)) {
      const org = orgs.find(o => o.slug === slug);
      if (!org) continue;
      if (org.billingCustomerId && org.billingWalletId) continue;

      console.log(`[Billing Seed] Setting billing customer ID for ${org.name}: ${customerId}`);
      const updateData: Record<string, any> = { billingCustomerId: customerId };

      try {
        const subscription = await billingService.getSubscription(customerId);
        if (subscription) {
          updateData.billingSubscriptionId = subscription.id || null;
          updateData.billingPlanId = subscription.plan_id || subscription.planId || null;
          if (subscription.metadata?.tier) {
            updateData.billingTier = subscription.metadata.tier;
          }
        }
      } catch (err: any) {
        console.log(`[Billing Seed] Could not fetch subscription for ${org.name}: ${err.message}`);
      }

      try {
        const wallets = await billingService.getWallets(customerId);
        if (wallets && wallets.length > 0) {
          updateData.billingWalletId = wallets[0].id;
          console.log(`[Billing Seed] Found wallet for ${org.name}: ${wallets[0].id}`);
        }
      } catch (err: any) {
        console.log(`[Billing Seed] Could not fetch wallets for ${org.name}: ${err.message}`);
      }

      await storage.updateOrganization(org.id, updateData as any);
    }
    console.log("[Billing Seed] Billing data seeded successfully");
  } catch (err: any) {
    console.log(`[Billing Seed] Error seeding billing data: ${err.message}`);
  }
}

async function seedProductionDatabase() {
  const existingRoles = await storage.getRoles();
  if (existingRoles.length === 0) {
    console.log("Production seed: creating roles...");
    const roleData = [
      { name: "super_admin", level: 1 },
      { name: "partner_admin", level: 2 },
      { name: "org_admin", level: 3 },
      { name: "executive", level: 3 },
      { name: "sales_manager", level: 3 },
      { name: "sales", level: 4 },
      { name: "service", level: 4 },
      { name: "marketing", level: 4 },
    ];

    const createdRoles: Record<string, string> = {};
    for (const r of roleData) {
      const role = await storage.createRole(r);
      createdRoles[r.name] = role.id;
    }

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@nexxusconnect.ai';
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      console.error("FATAL: ADMIN_PASSWORD environment variable is required in production.");
      process.exit(1);
    }

    const defaultOrg = await storage.createOrganization({
      name: "Nexxus Connect",
      slug: "nexxus-connect",
      personaName: "Admin",
      outboundEnabled: false,
      smsEnabled: false,
      phoneEnabled: false,
      emailEnabled: false,
    });

    const hashedAdminPass = await bcrypt.hash(adminPassword, SALT_ROUNDS);
    await storage.createUser({
      email: adminEmail,
      password: hashedAdminPass,
      firstName: "Super",
      lastName: "Admin",
      roleId: createdRoles["super_admin"],
      organizationId: defaultOrg.id,
      isActive: true,
    });

    console.log(`Production seed complete. Admin account: ${adminEmail}`);
  } else {
    console.log("Production database already seeded, skipping...");
  }

  if (Object.keys(BILLING_CUSTOMER_MAP).length > 0) {
    await seedBillingData();
  }
}

export async function seedDatabase() {
  if (process.env.NODE_ENV === 'production') {
    await seedProductionDatabase();
    return;
  }

  const existingRoles = await storage.getRoles();
  if (existingRoles.length > 0) {
    console.log("Database already seeded, skipping...");
    await seedTasksAndWidgets();
    await seedPartnerAccount();
    await seedMissingOrganizations();
    await seedMissingAgents();
    await seedHuminicUsers();
    await seedBillingData();
    return;
  }

  console.log("Seeding database...");

  const roleData = [
    { name: "super_admin", level: 1 },
    { name: "partner_admin", level: 2 },
    { name: "org_admin", level: 3 },
    { name: "executive", level: 3 },
    { name: "sales_manager", level: 3 },
    { name: "sales", level: 4 },
    { name: "service", level: 4 },
    { name: "marketing", level: 4 },
  ];

  const createdRoles: Record<string, string> = {};
  for (const r of roleData) {
    const role = await storage.createRole(r);
    createdRoles[r.name] = role.id;
  }

  const cageAutomotive = await storage.createOrganization({
    name: "Cage Automotive",
    slug: "cage-automotive",
    personaName: "Cage",
    outboundEnabled: true,
    smsEnabled: true,
    phoneEnabled: true,
    emailEnabled: true,
  });

  const serraHonda = await storage.createOrganization({
    name: "Serra Honda",
    slug: "serra-honda",
    personaName: "Caroline",
    partnerId: cageAutomotive.id,
    outboundEnabled: true,
    smsEnabled: true,
    phoneEnabled: true,
    emailEnabled: true,
  });

  const serraNissan = await storage.createOrganization({
    name: "Serra Nissan",
    slug: "serra-nissan",
    personaName: "Magnolia",
    partnerId: cageAutomotive.id,
    outboundEnabled: true,
    smsEnabled: true,
    phoneEnabled: true,
    emailEnabled: true,
  });

  const tonySerraFord = await storage.createOrganization({
    name: "Tony Serra Ford",
    slug: "tony-serra-ford",
    personaName: "Georgia",
    partnerId: cageAutomotive.id,
    outboundEnabled: true,
    smsEnabled: true,
    phoneEnabled: true,
    emailEnabled: true,
  });

  const hyundaiOfColumbia = await storage.createOrganization({
    name: "Hyundai of Columbia",
    slug: "hyundai-of-columbia",
    personaName: "Elizabeth",
    partnerId: cageAutomotive.id,
    outboundEnabled: true,
    smsEnabled: true,
    phoneEnabled: true,
    emailEnabled: true,
  });

  const fordOfColumbia = await storage.createOrganization({
    name: "Ford of Columbia",
    slug: "ford-of-columbia",
    personaName: "Nova",
    partnerId: cageAutomotive.id,
    outboundEnabled: true,
    smsEnabled: true,
    phoneEnabled: true,
    emailEnabled: true,
  });

  const defaultPassword = await bcrypt.hash(seedPassword, SALT_ROUNDS);

  const seedUsers = [
    { email: "admin@nexxus.com", firstName: "System", lastName: "Admin", role: "super_admin", org: serraHonda.id },
    { email: "partner@nexxus.com", firstName: "Marcus", lastName: "Webb", role: "partner_admin", org: serraHonda.id },
    { email: "orgadmin@serrahonda.com", firstName: "James", lastName: "Chen", role: "org_admin", org: serraHonda.id },
    { email: "executive@serrahonda.com", firstName: "Vanessa", lastName: "Torres", role: "executive", org: serraHonda.id },
    { email: "salesmanager@serrahonda.com", firstName: "Derek", lastName: "Wilson", role: "sales_manager", org: serraHonda.id },
    { email: "sales@serrahonda.com", firstName: "Ashley", lastName: "Brooks", role: "sales", org: serraHonda.id },
    { email: "service@serrahonda.com", firstName: "Brian", lastName: "Mitchell", role: "service", org: serraHonda.id },
    { email: "marketing@serrahonda.com", firstName: "Rachel", lastName: "Kim", role: "marketing", org: serraHonda.id },
  ];

  for (const u of seedUsers) {
    await storage.createUser({
      email: u.email,
      password: defaultPassword,
      firstName: u.firstName,
      lastName: u.lastName,
      roleId: createdRoles[u.role],
      organizationId: u.org,
      isActive: true,
    });
  }

  const agentData = [
    { name: "Caroline", department: "sales", description: "Serra Honda AI Sales Agent. Handles inbound leads, appointment scheduling, and customer follow-ups.", channels: ["voice", "video"], dealership: "Serra Honda", orgId: serraHonda.id, assignedPhone: "+1 (901) 203-8267", vapiAssistantId: "90a876c0-0f11-4424-abfe-9ac82b264d88", tavusPersonaId: "p9eb007721f4", autoGreeting: "Hi {{customerName}}! This is {{agentName}} from {{dealershipName}}. Thank you for your interest — I'd love to help you find the perfect vehicle. What are you looking for?" },
    { name: "Magnolia", department: "service", description: "Serra Nissan AI Service Agent. Manages service appointments, recall notifications, and maintenance reminders.", channels: ["voice", "video"], dealership: "Serra Nissan", orgId: serraNissan.id, assignedPhone: "+1 (256) 862-3318", vapiAssistantId: "2203b188-a549-417b-ab33-075766e1b5c1", tavusPersonaId: "p2f586f7e4e0" },
    { name: "Georgia", department: "sales", description: "Tony Serra Ford AI Sales Agent. Specializes in truck and fleet sales inquiries.", channels: ["voice", "video"], dealership: "Tony Serra Ford", orgId: tonySerraFord.id, assignedPhone: "+1 (256) 459-9707", vapiAssistantId: "ad478eb2-6602-42c5-9732-3d4648013307", tavusPersonaId: "pe791670615d" },
    { name: "Elizabeth", department: "marketing", description: "Hyundai of Columbia AI Marketing Agent. Handles campaign responses and lead nurturing.", channels: ["voice", "video"], dealership: "Hyundai of Columbia", orgId: hyundaiOfColumbia.id, assignedPhone: "+1 (901) 203-9398", vapiAssistantId: "6d12a8fa-0ed0-4ec1-bfdb-e84587ff86c0", tavusPersonaId: "p92b0da01c4f" },
    { name: "Savannah", department: "service", description: "Ford of Columbia AI Service Agent. Manages service lane communications and upsell opportunities.", channels: ["voice", "video"], dealership: "Ford of Columbia", orgId: fordOfColumbia.id, assignedPhone: "+1 (931) 369-2815", vapiAssistantId: "6216451c-e0a3-43d0-aece-ae382bd8df25", tavusPersonaId: "pf233f09f33d" },
    { name: "CRM Guru", department: "sales", description: "VIN Solutions CRM data expert. Prioritizes CRM data for lead insights, pipeline analysis, and customer history lookups.", channels: ["chat"], dealership: "Serra Honda", orgId: serraHonda.id, assignedPhone: null, vapiAssistantId: null, tavusPersonaId: null },
    { name: "Service Agent", department: "service", description: "Serra Honda AI Service Knowledge Agent. Provides service campaign insights, recall information, maintenance scheduling guidance, and service lane performance data.", channels: ["chat"], dealership: "Serra Honda", orgId: serraHonda.id, assignedPhone: null, vapiAssistantId: null, tavusPersonaId: null },
    { name: "Marketing Agent", department: "marketing", description: "Serra Honda AI Marketing Knowledge Agent. Analyzes marketing campaign performance, tracks lead source ROI, manages promotional content, and provides marketing analytics insights.", channels: ["chat"], dealership: "Serra Honda", orgId: serraHonda.id, assignedPhone: null, vapiAssistantId: null, tavusPersonaId: null },
    { name: "CRM Guru", department: "sales", description: "VIN Solutions CRM data expert. Prioritizes CRM data for lead insights, pipeline analysis, and customer history lookups.", channels: ["chat"], dealership: "Serra Nissan", orgId: serraNissan.id, assignedPhone: null, vapiAssistantId: null, tavusPersonaId: null },
    { name: "CRM Guru", department: "sales", description: "VIN Solutions CRM data expert. Prioritizes CRM data for lead insights, pipeline analysis, and customer history lookups.", channels: ["chat"], dealership: "Tony Serra Ford", orgId: tonySerraFord.id, assignedPhone: null, vapiAssistantId: null, tavusPersonaId: null },
  ];

  const createdAgents: Record<string, string> = {};
  for (const a of agentData) {
    const agent = await storage.createAgent({
      name: a.name,
      department: a.department,
      type: "ai",
      status: "active",
      description: a.description,
      channels: a.channels,
      dealership: a.dealership,
      assignedPhone: a.assignedPhone,
      vapiAssistantId: a.vapiAssistantId,
      tavusPersonaId: a.tavusPersonaId ?? null,
      autoGreeting: (a as any).autoGreeting || null,
      organizationId: a.orgId,
    });
    createdAgents[a.name] = agent.id;
  }

  const campaignData = [
    { name: "Service Reminder - February", department: "service", status: "active", channel: "sms", orgId: serraHonda.id, recipientCount: 145, sentCount: 0, repliedCount: 0, csvFilename: "feb_service_due.csv", killSwitch: false },
    { name: "Presidents Day Sale", department: "marketing", status: "completed", channel: "both", orgId: serraHonda.id, recipientCount: 892, sentCount: 0, repliedCount: 0, csvFilename: "marketing_list_feb.csv", killSwitch: false },
    { name: "New Lead Follow-Up Sequence", department: "sales", status: "active", channel: "both", orgId: serraHonda.id, recipientCount: 67, sentCount: 0, repliedCount: 0, csvFilename: null, killSwitch: false },
    { name: "Oil Change Reminder", department: "service", status: "paused", channel: "sms", orgId: serraHonda.id, recipientCount: 234, sentCount: 0, repliedCount: 0, csvFilename: "oil_change_due_march.csv", killSwitch: true },
  ];

  const createdCampaigns: Record<string, string> = {};
  for (const c of campaignData) {
    const campaign = await storage.createCampaign({
      name: c.name,
      department: c.department,
      status: c.status,
      channel: c.channel,
      organizationId: c.orgId,
      recipientCount: c.recipientCount,
      sentCount: c.sentCount,
      repliedCount: c.repliedCount,
      csvFilename: c.csvFilename,
      killSwitch: c.killSwitch,
    });
    createdCampaigns[c.name] = campaign.id;
  }

  const conv1 = await storage.createConversation({
    customerName: "Michael Clark",
    customerEmail: "michael.clark@email.com",
    customerPhone: "(412) 555-0101",
    channel: "sms",
    status: "open",
    agentId: createdAgents["Caroline"],
    organizationId: serraHonda.id,
    unreadCount: 3,
    lastMessageAt: new Date("2026-02-20T14:30:00Z"),
  });
  await storage.createMessage({ conversationId: conv1.id, role: "bot", content: "Hi Michael! Thank you for your interest in the 2026 Camry. Would you like to schedule a test drive?", senderName: "Sales Agent" });
  await storage.createMessage({ conversationId: conv1.id, role: "customer", content: "Yes, but I also wanted to ask about the trade-in value for my current car.", senderName: "Michael Clark" });
  await storage.createMessage({ conversationId: conv1.id, role: "bot", content: "Of course! I can help with that. What year, make, and model is your current vehicle?", senderName: "Sales Agent" });
  await storage.createMessage({ conversationId: conv1.id, role: "customer", content: "I received a damaged item and need help.", senderName: "Michael Clark" });

  const conv2 = await storage.createConversation({
    customerName: "Ben Smith",
    customerEmail: "ben.smith@email.com",
    customerPhone: "(412) 555-0102",
    channel: "chat",
    status: "automated",
    agentId: createdAgents["Caroline"],
    organizationId: serraHonda.id,
    unreadCount: 1,
    lastMessageAt: new Date("2026-02-20T13:45:00Z"),
  });
  await storage.createMessage({ conversationId: conv2.id, role: "bot", content: "Welcome Ben! How can I help you today?", senderName: "Sales Agent" });
  await storage.createMessage({ conversationId: conv2.id, role: "customer", content: "I'm having trouble accessing my account.", senderName: "Ben Smith" });

  const conv3 = await storage.createConversation({
    customerName: "David Jackson",
    customerEmail: "david.jackson@email.com",
    customerPhone: "(412) 555-0103",
    channel: "email",
    status: "followup",
    organizationId: serraHonda.id,
    unreadCount: 0,
    lastMessageAt: new Date("2026-02-20T12:00:00Z"),
  });
  await storage.createMessage({ conversationId: conv3.id, role: "customer", content: "I need to update my payment information.", senderName: "David Jackson" });

  const conv4 = await storage.createConversation({
    customerName: "Joshua Thompson",
    customerEmail: "joshua.t@email.com",
    customerPhone: "(412) 555-0104",
    channel: "sms",
    status: "assigned",
    agentId: createdAgents["Elizabeth"],
    organizationId: serraHonda.id,
    unreadCount: 2,
    lastMessageAt: new Date("2026-02-20T11:30:00Z"),
  });
  await storage.createMessage({ conversationId: conv4.id, role: "bot", content: "Hi Joshua! We have some great deals this month. Can I help you find the right vehicle?", senderName: "Communications Agent" });
  await storage.createMessage({ conversationId: conv4.id, role: "customer", content: "I have a question about the special pricing.", senderName: "Joshua Thompson" });

  const conv5 = await storage.createConversation({
    customerName: "Emily Davis",
    customerEmail: "emily.d@email.com",
    customerPhone: "(412) 555-0105",
    channel: "whatsapp",
    status: "open",
    organizationId: serraHonda.id,
    unreadCount: 1,
    lastMessageAt: new Date("2026-02-20T10:45:00Z"),
  });
  await storage.createMessage({ conversationId: conv5.id, role: "customer", content: "I need to change the shipping address.", senderName: "Emily Davis" });

  const conv6 = await storage.createConversation({
    customerName: "Amanda Anderson",
    customerEmail: "amanda.a@email.com",
    customerPhone: "(412) 555-0106",
    channel: "chat",
    status: "pending",
    agentId: createdAgents["Savannah"],
    organizationId: serraHonda.id,
    unreadCount: 0,
    lastMessageAt: new Date("2026-02-20T09:30:00Z"),
  });
  await storage.createMessage({ conversationId: conv6.id, role: "customer", content: "I'd like to request a copy of my service history.", senderName: "Amanda Anderson" });

  const conv7 = await storage.createConversation({
    customerName: "Melissa Taylor",
    customerPhone: "(412) 555-0107",
    channel: "sms",
    status: "scheduled",
    agentId: createdAgents["Savannah"],
    organizationId: serraHonda.id,
    campaignId: createdCampaigns["Service Reminder - February"],
    unreadCount: 0,
    lastMessageAt: new Date("2026-02-19T16:00:00Z"),
  });
  await storage.createMessage({ conversationId: conv7.id, role: "bot", content: "Hi Melissa! This is a reminder that your vehicle is due for its 30,000 mile service.", senderName: "Service Guru" });
  await storage.createMessage({ conversationId: conv7.id, role: "customer", content: "Can I schedule it for Friday?", senderName: "Melissa Taylor" });
  await storage.createMessage({ conversationId: conv7.id, role: "bot", content: "Your service appointment is confirmed for Friday at 10am.", senderName: "Service Guru" });

  const conv8 = await storage.createConversation({
    customerName: "Stephanie Thompson",
    customerEmail: "steph.t@email.com",
    channel: "email",
    status: "participating",
    agentId: createdAgents["Elizabeth"],
    organizationId: serraHonda.id,
    unreadCount: 1,
    lastMessageAt: new Date("2026-02-19T14:00:00Z"),
  });
  await storage.createMessage({ conversationId: conv8.id, role: "bot", content: "Hi Stephanie! Check out our exclusive February specials - up to $5,000 off select models!", senderName: "Marketing Agent" });
  await storage.createMessage({ conversationId: conv8.id, role: "customer", content: "I received the wrong promotional offer.", senderName: "Stephanie Thompson" });

  const integrationData = [
    { orgId: serraHonda.id, provider: "vinsolutions", dealerId: "21043", dealerName: "Serra Honda of Sylacauga", integrationId: null, nexxusOrgId: "3795b8f6-aca7-45fc-b77e-fc671b85a9f3" },
    { orgId: serraNissan.id, provider: "vinsolutions", dealerId: "21044", dealerName: "Serra Nissan of Sylacauga", integrationId: "f3f7e600-7d48-4c4e-9607-d737a271e57c", nexxusOrgId: "7f868569-62e5-4d49-9378-2e25d6a69321" },
    { orgId: tonySerraFord.id, provider: "vinsolutions", dealerId: "21047", dealerName: "Tony Serra Ford", integrationId: "6b430786-b1b1-45ef-ae17-bd33e0cb3735", nexxusOrgId: "8751c73d-4570-4b8d-bd40-fa4f1e48024d" },
    { orgId: hyundaiOfColumbia.id, provider: "vinsolutions", dealerId: "13399", dealerName: "Hyundai of Columbia", integrationId: null, nexxusOrgId: "a1b2c3d4-e5f6-4789-abcd-ef0123456789" },
    { orgId: fordOfColumbia.id, provider: "vinsolutions", dealerId: "13398", dealerName: "Ford of Columbia", integrationId: null, nexxusOrgId: "b2c3d4e5-f6a7-4890-bcde-f01234567890" },
  ];

  for (const i of integrationData) {
    await storage.createIntegration({
      organizationId: i.orgId,
      provider: i.provider,
      externalDealerId: i.dealerId,
      externalDealerName: i.dealerName,
      externalIntegrationId: i.integrationId,
      status: "active",
      nexxusOrgId: i.nexxusOrgId,
    });
  }

  await seedTasksAndWidgets();
  await seedDocumentsAndRecipients();
  await seedHuminicUsers();
  await seedBillingData();

  console.log("Database seeded successfully!");
  console.log("Default login: duane.wells@huminic.ai");
}

async function seedDocumentsAndRecipients() {
  const orgs = await storage.getOrganizations();
  const serraHonda = orgs.find(o => o.slug === "serra-honda");
  if (!serraHonda) return;

  const existingDocs = await storage.getDocuments(serraHonda.id);
  if (existingDocs.length > 0) return;

  const allAgents = await storage.getAgents(serraHonda.id);
  const carolineAgent = allAgents.find(a => a.name === "Caroline");

  await storage.createDocument({
    name: "current_inventory_march2026.csv",
    type: "csv",
    size: 245760,
    status: "indexed",
    organizationId: serraHonda.id,
    agentId: null,
    content: "vin,year,make,model,trim,price,status\n1HGCV1F3XRA000001,2026,Honda,Civic,Sport,28995,available\n1HGCV1F3XRA000002,2026,Honda,Accord,EX-L,35990,available",
    mimeType: "text/csv",
  });

  await storage.createDocument({
    name: "service_faq_2026.pdf",
    type: "pdf",
    size: 189440,
    status: "indexed",
    organizationId: serraHonda.id,
    agentId: carolineAgent?.id || null,
    content: null,
    mimeType: "application/pdf",
  });

  await storage.createDocument({
    name: "serra_brand_guidelines.docx",
    type: "docx",
    size: 512000,
    status: "indexed",
    organizationId: serraHonda.id,
    agentId: null,
    content: null,
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });

  await storage.createDocument({
    name: "dealer_policies.txt",
    type: "txt",
    size: 4096,
    status: "indexed",
    organizationId: serraHonda.id,
    agentId: null,
    content: "Serra Honda Dealer Policies\n\nAll sales representatives must verify customer identity before processing trade-ins.\nService appointments require 24-hour advance booking.\nAll outbound communications must include opt-out language.",
    mimeType: "text/plain",
  });

  const allCampaigns = await storage.getCampaigns(serraHonda.id);
  const serviceCampaign = allCampaigns.find(c => c.department === "service");
  const salesCampaign = allCampaigns.find(c => c.department === "sales");

  if (serviceCampaign) {
    const serviceRecipients = [
      { campaignId: serviceCampaign.id, firstName: "James", lastName: "Rodriguez", phone: "2055551001", email: "james.r@email.com" },
      { campaignId: serviceCampaign.id, firstName: "Patricia", lastName: "Williams", phone: "2055551002", email: "pwilliams@email.com" },
      { campaignId: serviceCampaign.id, firstName: "Robert", lastName: "Chen", phone: "2055551003", email: "rchen@email.com" },
      { campaignId: serviceCampaign.id, firstName: "Linda", lastName: "Martinez", phone: "2055551004", email: "linda.m@email.com" },
      { campaignId: serviceCampaign.id, firstName: "David", lastName: "Johnson", phone: "2055551005", email: "djohnson@email.com" },
      { campaignId: serviceCampaign.id, firstName: "Susan", lastName: "Brown", phone: "2055551006", email: "sbrown@email.com" },
      { campaignId: serviceCampaign.id, firstName: "Michael", lastName: "Davis", phone: "2055551007", email: "mdavis@email.com" },
      { campaignId: serviceCampaign.id, firstName: "Karen", lastName: "Wilson", phone: "2055551008", email: null },
      { campaignId: serviceCampaign.id, firstName: "Thomas", lastName: "Moore", phone: "2055551009", email: "tmoore@email.com" },
      { campaignId: serviceCampaign.id, firstName: "Nancy", lastName: "Taylor", phone: "2055551010", email: "ntaylor@email.com" },
    ];
    await storage.createRecipients(serviceRecipients);
    const count = await storage.getRecipientCount(serviceCampaign.id);
    await storage.updateCampaign(serviceCampaign.id, { recipientCount: count } as any);
  }

  if (salesCampaign) {
    const salesRecipients = [
      { campaignId: salesCampaign.id, firstName: "Mark", lastName: "Anderson", phone: "2055552001", email: "manderson@email.com" },
      { campaignId: salesCampaign.id, firstName: "Emily", lastName: "Thomas", phone: "2055552002", email: "ethomas@email.com" },
      { campaignId: salesCampaign.id, firstName: "Steven", lastName: "Jackson", phone: "2055552003", email: "sjackson@email.com" },
      { campaignId: salesCampaign.id, firstName: "Angela", lastName: "White", phone: "2055552004", email: "awhite@email.com" },
      { campaignId: salesCampaign.id, firstName: "Brian", lastName: "Harris", phone: null, email: "bharris@email.com" },
    ];
    await storage.createRecipients(salesRecipients);
    const count = await storage.getRecipientCount(salesCampaign.id);
    await storage.updateCampaign(salesCampaign.id, { recipientCount: count } as any);
  }

  console.log("Knowledge documents and campaign recipients seeded successfully!");
}

async function seedPartnerAccount() {
  const existing = await storage.getUserByEmail("durran.cage@cageautomotive.com");
  if (existing) return;

  const orgs = await storage.getOrganizations();
  const cageOrg = orgs.find(o => o.slug === "cage-automotive");
  if (!cageOrg) return;

  const roles = await storage.getRoles();
  const partnerRole = roles.find(r => r.name === "partner_admin");
  if (!partnerRole) return;

  const hashedPassword = await bcrypt.hash(seedPassword, SALT_ROUNDS);
  await storage.createUser({
    email: "durran.cage@cageautomotive.com",
    password: hashedPassword,
    firstName: "Durran",
    lastName: "Cage",
    roleId: partnerRole.id,
    organizationId: cageOrg.id,
    isActive: true,
  });

  console.log("Durran Cage partner account seeded (durran.cage@cageautomotive.com)");
}

async function seedHuminicUsers() {
  const orgs = await storage.getOrganizations();
  const serraHonda = orgs.find(o => o.slug === "serra-honda");
  if (!serraHonda) return;

  const roles = await storage.getRoles();
  const roleMap: Record<string, string> = {};
  for (const r of roles) {
    roleMap[r.name] = r.id;
  }

  const huminicUsers = [
    { email: "duane.wells@huminic.ai", firstName: "Duane K.", lastName: "Wells", role: "super_admin", password: process.env.HUMINIC_ADMIN_PASSWORD || seedPassword },
    { email: "partner_admin@huminic.ai", firstName: "Partner", lastName: "Admin", role: "partner_admin", password: seedPassword },
    { email: "org_admin@huminic.ai", firstName: "Org", lastName: "Admin", role: "org_admin", password: seedPassword },
    { email: "sales_staff@huminic.ai", firstName: "Sales", lastName: "Staff", role: "sales", password: seedPassword },
    { email: "marketing_staff@huminic.ai", firstName: "Marketing", lastName: "Staff", role: "marketing", password: seedPassword },
    { email: "executive_staff@huminic.ai", firstName: "Executive", lastName: "Staff", role: "executive", password: seedPassword },
  ];

  for (const u of huminicUsers) {
    const emailLower = u.email.toLowerCase();
    const existing = await storage.getUserByEmail(emailLower);
    if (existing) {
      console.log(`Huminic user already exists, skipping: ${emailLower}`);
    } else {
      const hashedPassword = await bcrypt.hash(u.password, SALT_ROUNDS);
      await storage.createUser({
        email: emailLower,
        password: hashedPassword,
        firstName: u.firstName,
        lastName: u.lastName,
        roleId: roleMap[u.role],
        organizationId: serraHonda.id,
        isActive: true,
      });
      console.log(`Huminic user created: ${emailLower}`);
    }
  }
}
