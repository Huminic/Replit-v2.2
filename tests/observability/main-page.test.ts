import { describe, it, expect } from "vitest";

describe("Main Page (AI Chat) — Observability", () => {
  describe("Pipeline Tiles", () => {
    it("GET /api/metrics/pipeline returns pipeline counts from warehouse_leads", async () => {
      expect.fail("STUB — wire to real API test in Sweep 8");
    });

    it("Active Pipeline count matches warehouse_leads WHERE status IN pipeline statuses", async () => {
      expect.fail("STUB — verify computation against DB");
    });

    it("New Leads count matches warehouse_leads WHERE status='new'", async () => {
      expect.fail("STUB — verify computation against DB");
    });

    it("Appointments count matches warehouse_leads WHERE status='appointment'", async () => {
      expect.fail("STUB — verify computation against DB");
    });

    it("Sold count matches warehouse_leads WHERE status='sold'", async () => {
      expect.fail("STUB — verify computation against DB");
    });
  });

  describe("Chat AI", () => {
    it("POST /api/chat/:id/stream returns streamed AI response from Anthropic", async () => {
      expect.fail("STUB — verify message saved to messages table");
    });
  });

  describe("Sub-Menu Data", () => {
    it("GET /api/agents returns org-scoped agent list", async () => {
      expect.fail("STUB — verify org_id filter");
    });

    it("GET /api/conversations?channel=ai-chat returns org-scoped conversations", async () => {
      expect.fail("STUB — verify org_id and channel filter");
    });

    it("GET /api/hunches returns org-scoped hunches", async () => {
      expect.fail("STUB — verify org_id filter");
    });

    it("Artifacts sub-menu shows static placeholder text", async () => {
      expect.fail("STUB — verify 'Artifacts will appear here' renders");
    });
  });
});
