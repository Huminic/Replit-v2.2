/**
 * Unit tests for substituteOrgContext (server/lib/templateSubstitute.ts).
 *
 * Locks the I-269 fix contract:
 *   - {{dealershipName}} replaced with org.name
 *   - Other {{...}} placeholders LEFT INTACT (they are runtime placeholders
 *     for AI-drafted customer templates, not org-context values).
 */

import { describe, it, expect } from "vitest";
import { substituteOrgContext } from "@server/lib/templateSubstitute";

describe("substituteOrgContext", () => {
  it("replaces {{dealershipName}} with org name", () => {
    const out = substituteOrgContext(
      "You are the Sales Coach for {{dealershipName}}.",
      { dealershipName: "Serra Honda" },
    );
    expect(out).toBe("You are the Sales Coach for Serra Honda.");
  });

  it("replaces multiple occurrences of {{dealershipName}}", () => {
    const out = substituteOrgContext(
      "Use {{dealershipName}} naturally in every template. Never speak ill of {{dealershipName}}.",
      { dealershipName: "Serra Honda" },
    );
    expect(out).toBe(
      "Use Serra Honda naturally in every template. Never speak ill of Serra Honda.",
    );
  });

  it("leaves runtime placeholders intact ({{customerName}}, {{vehicleOfInterest}}, {{salespersonName}})", () => {
    const input =
      "Personalize templates with {{customerName}}, {{vehicleOfInterest}}, and {{salespersonName}}.";
    const out = substituteOrgContext(input, { dealershipName: "Serra Honda" });
    expect(out).toBe(input); // unchanged — these are runtime placeholders
  });

  it("handles a string with both org-context and runtime placeholders", () => {
    const out = substituteOrgContext(
      "Welcome to {{dealershipName}}, {{customerName}}! Your {{vehicleOfInterest}} is ready.",
      { dealershipName: "Serra Honda" },
    );
    expect(out).toBe(
      "Welcome to Serra Honda, {{customerName}}! Your {{vehicleOfInterest}} is ready.",
    );
  });

  it("returns input unchanged when {{dealershipName}} is absent", () => {
    const input = "You are a helpful assistant.";
    expect(substituteOrgContext(input, { dealershipName: "Serra Honda" })).toBe(input);
  });

  it("returns empty string for empty input", () => {
    expect(substituteOrgContext("", { dealershipName: "Serra Honda" })).toBe("");
  });

  it("handles dealership names with special chars (does NOT regex-escape — split/join is literal)", () => {
    const out = substituteOrgContext(
      "Welcome to {{dealershipName}}.",
      { dealershipName: "Serra Honda & Sons (Est. 1985)" },
    );
    expect(out).toBe("Welcome to Serra Honda & Sons (Est. 1985).");
  });

  it("does NOT substitute partial placeholder text like {dealershipName}", () => {
    const input = "Single brace {dealershipName} should not be touched.";
    const out = substituteOrgContext(input, { dealershipName: "Serra Honda" });
    expect(out).toBe(input);
  });

  it("does NOT substitute {{DealershipName}} (case-sensitive)", () => {
    const input = "{{DealershipName}} is wrong case.";
    const out = substituteOrgContext(input, { dealershipName: "Serra Honda" });
    expect(out).toBe(input); // case-sensitive — agent-instructions.json uses exact lowercase 'd'
  });

  it("matches the exact agent-instructions.json shape (Communication Writer Tone line)", () => {
    // From agent-instructions.json line 9:
    const input =
      "Tone: Professional, warm, and dealership-branded. Use {{dealershipName}} naturally in every template.";
    const out = substituteOrgContext(input, { dealershipName: "Serra Honda" });
    expect(out).toBe(
      "Tone: Professional, warm, and dealership-branded. Use Serra Honda naturally in every template.",
    );
  });
});
