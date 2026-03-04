import bcrypt from "bcrypt";
import { storage } from "./storage";

const SALT_ROUNDS = 10;

export async function seedDatabase() {
  const existingRoles = await storage.getRoles();
  if (existingRoles.length > 0) {
    console.log("Database already seeded, skipping...");
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

  const serraHonda = await storage.createOrganization({
    name: "Serra Honda",
    slug: "serra-honda",
    personaName: "Serra",
  });

  const serraNissan = await storage.createOrganization({
    name: "Serra Nissan",
    slug: "serra-nissan",
    personaName: "Aria",
  });

  const tonySerraFord = await storage.createOrganization({
    name: "Tony Serra Ford",
    slug: "tony-serra-ford",
    personaName: "Nova",
  });

  const defaultPassword = await bcrypt.hash("password123", SALT_ROUNDS);

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
    { name: "Caroline", department: "sales", description: "Serra Honda AI Sales Agent. Handles inbound leads, appointment scheduling, and customer follow-ups.", channels: ["voice", "video"], dealership: "Serra Honda", orgId: serraHonda.id, assignedPhone: "+1 (901) 203-8267", vapiAssistantId: "90a876c0-0f11-4424-abfe-9ac82b264d88", tavusPersonaId: "p9eb007721f4" },
    { name: "Magnolia", department: "service", description: "Serra Nissan AI Service Agent. Manages service appointments, recall notifications, and maintenance reminders.", channels: ["voice", "video"], dealership: "Serra Nissan", orgId: serraNissan.id, assignedPhone: "+1 (256) 862-3318", vapiAssistantId: "2203b188-a549-417b-ab33-075766e1b5c1", tavusPersonaId: "p2f586f7e4e0" },
    { name: "Georgia", department: "sales", description: "Tony Serra Ford AI Sales Agent. Specializes in truck and fleet sales inquiries.", channels: ["voice", "video"], dealership: "Tony Serra Ford", orgId: tonySerraFord.id, assignedPhone: "+1 (256) 459-9707", vapiAssistantId: "ad478eb2-6602-42c5-9732-3d4648013307", tavusPersonaId: "pe791670615d" },
    { name: "Elizabeth", department: "marketing", description: "Hyundai of Columbia AI Marketing Agent. Handles campaign responses and lead nurturing.", channels: ["voice", "video"], dealership: "Hyundai of Columbia", orgId: serraHonda.id, assignedPhone: "+1 (901) 203-9398", vapiAssistantId: "6d12a8fa-0ed0-4ec1-bfdb-e84587ff86c0", tavusPersonaId: null },
    { name: "Savannah", department: "service", description: "Ford of Columbia AI Service Agent. Manages service lane communications and upsell opportunities.", channels: ["voice", "video"], dealership: "Ford of Columbia", orgId: serraHonda.id, assignedPhone: "+1 (931) 369-2815", vapiAssistantId: "6216451c-e0a3-43d0-aece-ae382bd8df25", tavusPersonaId: "pf233f09f33d" },
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
      organizationId: a.orgId,
    });
    createdAgents[a.name] = agent.id;
  }

  const campaignData = [
    { name: "Service Reminder - February", department: "service", status: "active", channel: "sms", orgId: serraHonda.id, recipientCount: 145, sentCount: 132, repliedCount: 47, csvFilename: "feb_service_due.csv", killSwitch: false },
    { name: "Presidents Day Sale", department: "marketing", status: "completed", channel: "both", orgId: serraHonda.id, recipientCount: 892, sentCount: 892, repliedCount: 123, csvFilename: "marketing_list_feb.csv", killSwitch: false },
    { name: "New Lead Follow-Up Sequence", department: "sales", status: "active", channel: "both", orgId: serraHonda.id, recipientCount: 67, sentCount: 45, repliedCount: 18, csvFilename: null, killSwitch: false },
    { name: "Oil Change Reminder", department: "service", status: "paused", channel: "sms", orgId: serraHonda.id, recipientCount: 234, sentCount: 89, repliedCount: 31, csvFilename: "oil_change_due_march.csv", killSwitch: true },
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

  console.log("Database seeded successfully!");
  console.log("Default login: admin@nexxus.com / password123");
}
