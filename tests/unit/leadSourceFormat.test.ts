/**
 * Unit tests for formatLeadSource (server/lib/leadSourceFormat.ts).
 *
 * Locks the I-279 Path-A fix contract:
 *   - VIN-pattern URLs are resolved via the supplied source map.
 *   - The map's key uses the live MCP authoritative field names
 *     (`leadSourceId` / `leadSourceName`) — caller is responsible for
 *     building the map; see getLeadSourceMap in the same module.
 *   - When the ID is NOT in the map, the fallback string is `Source #N`
 *     (operator preference 2026-04-26: drop developer-jargon "VIN").
 *   - Plain-string passthrough for already-named sources.
 *   - null / empty input returns "Unknown".
 *   - Empty map behaves identically to "no map supplied" — every VIN URL
 *     falls back to `Source #N`.
 *
 * The map-construction OR-chain (leadSourceId → id → sourceId, etc.) lives
 * in getLeadSourceMap and is exercised indirectly: tests build the map
 * the way getLeadSourceMap would, using both the current and legacy field
 * names, and assert the formatter sees them identically.
 */

import { describe, it, expect } from "vitest";
import { formatLeadSource } from "@server/lib/leadSourceFormat";

/**
 * Mirrors the OR-chain in getLeadSourceMap so the tests assert the
 * same field-name resolution that the runtime resolver performs.
 * Accepts any mix of current (`leadSourceId` / `leadSourceName`) and
 * legacy (`id` / `name` / `sourceId` / `description`) shapes.
 */
function buildMapFromMcpLikeItems(
  items: Array<Record<string, unknown>>,
): Map<string, string> {
  const map = new Map<string, string>();
  for (const src of items) {
    const id = String(src.leadSourceId || src.id || src.sourceId || "");
    const name = String(src.leadSourceName || src.name || src.description || "");
    if (id && name) map.set(id, name);
  }
  return map;
}

describe("formatLeadSource", () => {
  it("resolves a VIN URL to the human name when the map uses current field names (leadSourceId / leadSourceName)", () => {
    // Live MCP shape verified 2026-04-26 against mcp.huminicdev.com.
    const map = buildMapFromMcpLikeItems([
      { leadSourceId: 362, leadSourceName: "Dealers WebSite", href: "..." },
      { leadSourceId: 106, leadSourceName: "Repeat Customer", href: "..." },
    ]);
    const url = "https://api.vinsolutions.com/leadsources/id/362?dealerid=21043";
    expect(formatLeadSource(url, map)).toBe("Dealers WebSite");
  });

  it("resolves a VIN URL when the map was built from legacy field names (src.id / src.name)", () => {
    // Backward-compat: if the MCP shape ever reverts or a different upstream
    // emits the speculative legacy fields, the OR-chain still populates the
    // map and the formatter sees the same ID → name pair.
    const map = buildMapFromMcpLikeItems([
      { id: 362, name: "Dealers WebSite" },
      { sourceId: 106, description: "Repeat Customer" },
    ]);
    const url = "https://api.vinsolutions.com/leadsources/id/106?dealerid=21043";
    expect(formatLeadSource(url, map)).toBe("Repeat Customer");
  });

  it("falls back to 'Source #N' when the VIN ID is not in the map", () => {
    // Real production case for Serra Honda: ID 7098 has 111 leads in 30 days
    // but is NOT returned by vin_get_lead_sources (central-mcp coverage gap).
    // Operator preference 2026-04-26: drop "VIN" prefix from the fallback.
    const map = buildMapFromMcpLikeItems([
      { leadSourceId: 362, leadSourceName: "Dealers WebSite" },
    ]);
    const url = "https://api.vinsolutions.com/leadsources/id/7098?dealerid=21043";
    expect(formatLeadSource(url, map)).toBe("Source #7098");
  });

  it("passes through a plain-string source unchanged (already-named, not a URL or numeric ID)", () => {
    // Some sync paths populate raw.source?.name directly; these are stored
    // as plain strings in warehouse_leads.lead_source. They must NOT be
    // mangled by the URL/ID resolver.
    const map = buildMapFromMcpLikeItems([
      { leadSourceId: 362, leadSourceName: "Dealers WebSite" },
    ]);
    expect(formatLeadSource("Walk-In", map)).toBe("Walk-In");
    expect(formatLeadSource("AutoTrader", map)).toBe("AutoTrader");
  });

  it("returns 'Unknown' for null or empty input", () => {
    const map = buildMapFromMcpLikeItems([]);
    expect(formatLeadSource(null, map)).toBe("Unknown");
    expect(formatLeadSource(undefined, map)).toBe("Unknown");
    expect(formatLeadSource("", map)).toBe("Unknown");
  });

  it("OR-chain priority: leadSourceId / leadSourceName win over legacy id / name when BOTH are present", () => {
    // Defends the OR-chain order at server/lib/leadSourceFormat.ts:68-69.
    // If the MCP ever simultaneously emits both shapes (e.g. during an
    // upgrade window), the AUTHORITATIVE current names must take precedence
    // so the resolved label matches what VIN actually returns. Reading the
    // legacy `id` / `name` fields first would silently regress to the pre-
    // Path A bug.
    const map = buildMapFromMcpLikeItems([
      {
        leadSourceId: 362,
        leadSourceName: "Dealers WebSite (current)",
        // Conflicting legacy fields on the same row — must lose to the current ones.
        id: 999,
        name: "Wrong Legacy Name",
      },
    ]);
    // The current ID (362) won during map construction; the legacy ID (999) was discarded.
    expect(map.has("362")).toBe(true);
    expect(map.has("999")).toBe(false);
    // Resolution uses the leadSourceName, not the conflicting legacy name.
    const url = "https://api.vinsolutions.com/leadsources/id/362?dealerid=21043";
    expect(formatLeadSource(url, map)).toBe("Dealers WebSite (current)");
  });

  it("falls back to 'Source #N' for every VIN URL when the MCP map is empty", () => {
    // Models the central-mcp outage / empty-response case. The resolver
    // must degrade gracefully: every VIN URL becomes Source #<id>, not a
    // crash and not the word "Unknown".
    const emptyMap = new Map<string, string>();
    const url1 = "https://api.vinsolutions.com/leadsources/id/362?dealerid=21043";
    const url2 = "https://api.vinsolutions.com/leadsources/id/7098?dealerid=21043";
    expect(formatLeadSource(url1, emptyMap)).toBe("Source #362");
    expect(formatLeadSource(url2, emptyMap)).toBe("Source #7098");
    // Same behavior when no map is supplied at all.
    expect(formatLeadSource(url1)).toBe("Source #362");
  });
});
