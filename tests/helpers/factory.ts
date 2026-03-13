/**
 * Test data factories.
 * Generate valid data objects for use in tests. These are plain objects,
 * not database records — use them for request bodies or assertions.
 */
import { randomUUID } from "crypto";

// ── User ──────────────────────────────────────────────────────────

export interface TestUser {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roleId: string;
  organizationId: string;
  isActive: boolean;
  profilePhotoUrl: string | null;
}

export function buildUser(overrides: Partial<TestUser> = {}): TestUser {
  const id = overrides.id ?? randomUUID();
  return {
    id,
    email: `testuser-${id.slice(0, 8)}@nexxus-test.local`,
    password: "hashed_placeholder_not_real",
    firstName: "Test",
    lastName: "User",
    roleId: overrides.roleId ?? randomUUID(),
    organizationId: overrides.organizationId ?? randomUUID(),
    isActive: true,
    profilePhotoUrl: null,
    ...overrides,
  };
}

// ── Organization ──────────────────────────────────────────────────

export interface TestOrganization {
  id: string;
  name: string;
  slug: string;
  personaName: string;
  outboundEnabled: boolean;
  smsEnabled: boolean;
  phoneEnabled: boolean;
  emailEnabled: boolean;
  videoEnabled: boolean;
  settings: Record<string, unknown>;
}

export function buildOrganization(
  overrides: Partial<TestOrganization> = {}
): TestOrganization {
  const id = overrides.id ?? randomUUID();
  return {
    id,
    name: `Test Dealership ${id.slice(0, 6)}`,
    slug: `test-dealership-${id.slice(0, 6)}`,
    personaName: "Serra",
    outboundEnabled: false,
    smsEnabled: false,
    phoneEnabled: false,
    emailEnabled: false,
    videoEnabled: false,
    settings: {},
    ...overrides,
  };
}

// ── Campaign ──────────────────────────────────────────────────────

export interface TestCampaign {
  id: string;
  name: string;
  department: string;
  status: string;
  channel: string;
  organizationId: string;
  killSwitch: boolean;
  recipientCount: number;
  sentCount: number;
  repliedCount: number;
  messageTemplate: string | null;
  sendIntervalSeconds: number;
}

export function buildCampaign(
  overrides: Partial<TestCampaign> = {}
): TestCampaign {
  const id = overrides.id ?? randomUUID();
  return {
    id,
    name: `Test Campaign ${id.slice(0, 6)}`,
    department: "sales",
    status: "draft",
    channel: "sms",
    organizationId: overrides.organizationId ?? randomUUID(),
    killSwitch: false,
    recipientCount: 0,
    sentCount: 0,
    repliedCount: 0,
    messageTemplate: null,
    sendIntervalSeconds: 60,
    ...overrides,
  };
}
