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
    { name: "Caroline", department: "sales", description: "Serra Honda AI Sales Agent. Handles inbound leads, appointment scheduling, and customer follow-ups.", channels: ["voice", "video"], dealership: "Serra Honda", orgId: serraHonda.id },
    { name: "Magnolia", department: "service", description: "Serra Nissan AI Service Agent. Manages service appointments, recall notifications, and maintenance reminders.", channels: ["voice", "video"], dealership: "Serra Nissan", orgId: serraNissan.id },
    { name: "Georgia", department: "sales", description: "Tony Serra Ford AI Sales Agent. Specializes in truck and fleet sales inquiries.", channels: ["voice", "video"], dealership: "Tony Serra Ford", orgId: tonySerraFord.id },
    { name: "Elizabeth", department: "marketing", description: "Hyundai of Columbia AI Marketing Agent. Handles campaign responses and lead nurturing.", channels: ["voice", "video"], dealership: "Hyundai of Columbia", orgId: serraHonda.id },
    { name: "Savannah", department: "service", description: "Ford of Columbia AI Service Agent. Manages service lane communications and upsell opportunities.", channels: ["voice", "video"], dealership: "Ford of Columbia", orgId: serraHonda.id },
  ];

  for (const a of agentData) {
    await storage.createAgent({
      name: a.name,
      department: a.department,
      type: "ai",
      status: "active",
      description: a.description,
      channels: a.channels,
      dealership: a.dealership,
      organizationId: a.orgId,
    });
  }

  const campaignData = [
    { name: "Winter Service Reminder", status: "active", channel: "sms", orgId: serraHonda.id, recipientCount: 1250, sentCount: 890, repliedCount: 234, csvFilename: "winter_service_2026.csv" },
    { name: "New Year Sales Event", status: "active", channel: "email", orgId: serraHonda.id, recipientCount: 3400, sentCount: 3400, repliedCount: 567 },
    { name: "Recall Notice - Brake System", status: "paused", channel: "sms", orgId: serraHonda.id, recipientCount: 450, sentCount: 450, repliedCount: 89, csvFilename: "recall_brakes.csv" },
    { name: "Spring Marketing Campaign", status: "draft", channel: "email", orgId: serraHonda.id, recipientCount: 0, sentCount: 0, repliedCount: 0 },
  ];

  for (const c of campaignData) {
    await storage.createCampaign({
      name: c.name,
      status: c.status,
      channel: c.channel,
      organizationId: c.orgId,
      recipientCount: c.recipientCount,
      sentCount: c.sentCount,
      repliedCount: c.repliedCount,
      csvFilename: c.csvFilename || null,
    });
  }

  const conv1 = await storage.createConversation({
    customerName: "Michael Clark",
    customerEmail: "mclark@email.com",
    customerPhone: "+1(901)555-0123",
    channel: "sms",
    status: "open",
    organizationId: serraHonda.id,
    unreadCount: 2,
    lastMessageAt: new Date(),
  });

  await storage.createMessage({ conversationId: conv1.id, role: "customer", content: "Hi, I'm interested in the 2026 Civic. Do you have any in stock?", senderName: "Michael Clark" });
  await storage.createMessage({ conversationId: conv1.id, role: "bot", content: "Hello Michael! Yes, we have several 2026 Honda Civics available. Would you prefer the sedan or hatchback?", senderName: "Caroline" });
  await storage.createMessage({ conversationId: conv1.id, role: "customer", content: "The sedan, preferably in blue. What's the starting price?", senderName: "Michael Clark" });

  const conv2 = await storage.createConversation({
    customerName: "Sarah Johnson",
    customerEmail: "sjohnson@email.com",
    customerPhone: "+1(256)555-0456",
    channel: "email",
    status: "automated",
    organizationId: serraHonda.id,
    unreadCount: 0,
    lastMessageAt: new Date(Date.now() - 3600000),
  });

  await storage.createMessage({ conversationId: conv2.id, role: "customer", content: "When is my next service appointment due?", senderName: "Sarah Johnson" });
  await storage.createMessage({ conversationId: conv2.id, role: "bot", content: "Hi Sarah! Based on your records, your 2024 Accord is due for a 30,000 mile service. Would you like me to schedule an appointment?", senderName: "Magnolia" });

  console.log("Database seeded successfully!");
  console.log("Default login: admin@nexxus.com / password123");
}
