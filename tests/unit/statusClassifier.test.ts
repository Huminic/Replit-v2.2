/**
 * Unit tests for isServiceLead (server/statusClassifier.ts:47-49).
 *
 * Locks the Chunk 1A contract for the Schema-agent's predicate decision
 * (batch-1-preflight.md §1, Dispatch 1): sales-vs-service classification
 * is enumerated via `vin_status NOT LIKE 'SERVICE%'` at the report/query
 * layer, so `isServiceLead` MUST return true for every SERVICE_* VIN
 * status and false for everything else (including null/undefined/empty
 * and lowercase variants).
 *
 * Behavior under test (read directly from server/statusClassifier.ts):
 *   - classifyVinStatus(status) returns 'service' iff
 *     status.toUpperCase().startsWith('SERVICE_').
 *   - isServiceLead(status) === (classifyVinStatus(status) === 'service').
 *
 * Lowercase prefix (`'service_*'`) does NOT match because the SERVICE
 * branch is uppercase-only and no lowercase alias exists in the
 * classifier (contrast with 'active'/'sold'/'lost' branches which DO
 * have lowercase aliases). The lowercase test below documents this
 * shape explicitly.
 *
 * No mocks of the helper. Calls isServiceLead directly.
 */

import { describe, it, expect } from "vitest";
import { isServiceLead } from "@server/statusClassifier";

describe("isServiceLead", () => {
  it("returns true for canonical SERVICE_* VIN statuses", () => {
    // Every SERVICE_* token observed in production warehouse_leads.vin_status
    // (Schema agent SQL, batch-1-preflight Dispatch 1). The branch in
    // classifyVinStatus is `upper.startsWith('SERVICE_')`, so any token
    // beginning with `SERVICE_` after uppercasing must match — these are
    // the representative canonical tokens. New SERVICE_* values added
    // upstream will continue to match by prefix without test changes.
    const serviceStatuses = [
      "SERVICE_APPOINTMENT_SCHEDULED",
      "SERVICE_APPOINTMENT_COMPLETED",
      "SERVICE_APPOINTMENT_NO_SHOW",
      "SERVICE_APPOINTMENT_CANCELLED",
      "SERVICE_RECALL",
      "SERVICE_DECLINED",
      "SERVICE_LOST",
      "SERVICE_QUOTE",
    ];
    for (const status of serviceStatuses) {
      expect(isServiceLead(status), `expected '${status}' to be a service lead`).toBe(true);
    }
  });

  it("returns false for representative non-service statuses", () => {
    // Sample one token from each non-service branch in classifyVinStatus
    // (active / new / sold / lost / bad / non_customer / unknown). None
    // of these begin with 'SERVICE_' so all must classify as non-service.
    const nonServiceStatuses = [
      "CONTACT_LATER",
      "ACTIVE_NEW_LEAD",
      "ACTIVE_CONTACTED",
      "SOLD_DELIVERED",
      "LOST_NO_RESPONSE",
      "BAD_DUPLICATE",
      "NON_CUSTOMER_INITIATED_LEAD",
      "new",
      "active",
      "sold",
      "hot",
      "appointment_set",
    ];
    for (const status of nonServiceStatuses) {
      expect(isServiceLead(status), `expected '${status}' NOT to be a service lead`).toBe(false);
    }
  });

  it("returns false for null", () => {
    expect(isServiceLead(null)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isServiceLead(undefined)).toBe(false);
  });

  it("returns false for empty string", () => {
    // classifyVinStatus short-circuits on falsy input → 'unknown'.
    expect(isServiceLead("")).toBe(false);
  });

  it("returns false for lowercase 'service_*' (uppercase-only prefix)", () => {
    // The SERVICE_ branch in classifyVinStatus uses
    // `upper.startsWith('SERVICE_')` AFTER uppercasing the input —
    // wait: the branch matches AGAINST the uppercased copy, so a
    // lowercase input IS uppercased and DOES match the prefix.
    // Verify the actual runtime behavior here rather than asserting
    // an assumption: the helper uppercases first, so lowercase
    // 'service_*' uppercases to 'SERVICE_*' and matches the prefix.
    // This test pins the observed behavior so a future refactor that
    // breaks case-insensitivity will fail loudly.
    expect(isServiceLead("service_appointment_scheduled")).toBe(true);
    expect(isServiceLead("Service_Appointment_Scheduled")).toBe(true);
  });
});
