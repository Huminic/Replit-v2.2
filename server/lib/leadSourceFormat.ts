/**
 * Lead-source formatter and ID→name resolver for Insights endpoints.
 *
 * Background (I-279, see evidence/vin-source-resolution-analysis-2026-04-26.md):
 *
 * VIN Solutions stores `lead_source` as a URL string of the form
 *   https://api.vinsolutions.com/leadsources/id/<id>?dealerid=<dealer>
 * — never the human-readable name. The companion MCP tool
 * `vin_get_lead_sources` returns a list of `{ leadSourceId, leadSourceName }`
 * entries (live shape, verified 2026-04-26 against mcp.huminicdev.com).
 *
 * The previous in-line resolver in server/routes/insights.ts read the
 * fields `src.id` / `src.name`, which never existed on the live response.
 * As a result the resolver populated an EMPTY map for every org, and EVERY
 * source URL fell back to a `Source #<id>` literal regardless of whether
 * the MCP could have resolved it. The same bug had already been fixed in
 * server/services/weeklyReportService.ts — Insights was missed.
 *
 * This module extracts the resolver + formatter into a unit-testable surface
 * and uses the same OR-chain as weeklyReportService (`leadSourceId || id || sourceId`,
 * `leadSourceName || name || description`) so both code paths agree.
 *
 * Coverage cap: even with the field-name bug fixed, only ~32% of Serra Honda
 * leads' source IDs are present in `vin_get_lead_sources` (which returns
 * only "actively configured" sources). The remaining ~68% are real
 * production sources that VIN does not surface in the configured-list
 * endpoint. Closing that gap requires a central-mcp-side change
 * (see decisions.md 2026-04-26 — VIN lead-source coverage gap).
 */

import { callMCP, resolveNexxusOrgId } from "../vendorProxy";

/**
 * Per-orgId cache of resolved lead source ID → name mappings.
 * Exported only for tests that need to assert cache behavior or reset it.
 */
export const leadSourceCache = new Map<string, { map: Map<string, string>; fetchedAt: number }>();
export const LEAD_SOURCE_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Fetch (and cache) the VIN Solutions lead source ID → name map for an org.
 *
 * On MCP failure or empty response, returns an empty map. Callers should
 * handle that by falling back to the ID-based label via {@link formatLeadSource}.
 *
 * The OR-chain reads BOTH the current authoritative MCP field names
 * (`leadSourceId` / `leadSourceName`) and the legacy speculative field names
 * (`id` / `name` / `sourceId` / `description`) for forward/backward compat
 * if the MCP schema is ever extended.
 */
export async function getLeadSourceMap(orgId: string): Promise<Map<string, string>> {
  const cached = leadSourceCache.get(orgId);
  if (cached && Date.now() - cached.fetchedAt < LEAD_SOURCE_CACHE_TTL_MS) {
    return cached.map;
  }

  const map = new Map<string, string>();
  try {
    const nexxusOrgId = resolveNexxusOrgId(orgId);
    const data = await callMCP("vin_get_lead_sources", { orgId: nexxusOrgId });
    const sources = Array.isArray(data) ? data : (data?.items || data?.leadSources || []);
    for (const src of sources) {
      // Authoritative field names (live MCP, verified 2026-04-26):
      //   leadSourceId / leadSourceName
      // OR-chain keeps backward compatibility with the speculative legacy
      // names (id / name / sourceId / description) in case the MCP shape
      // is ever extended.
      const id = String(src.leadSourceId || src.id || src.sourceId || "");
      const name = src.leadSourceName || src.name || src.description || "";
      if (id && name) {
        map.set(id, name);
      }
    }
    leadSourceCache.set(orgId, { map, fetchedAt: Date.now() });
  } catch (err) {
    console.log(`[Insights] Failed to fetch lead source mapping for org ${orgId}: ${err}`);
    // Return empty map on failure — formatLeadSource will fall back to ID-based label.
  }
  return map;
}

/**
 * Transform a raw lead source value into a human-readable label.
 *
 * VIN Solutions stores lead sources as API URLs like
 *   https://api.vinsolutions.com/leadsources/id/7098?dealerid=21043
 * This resolves the numeric ID to a human-readable name via the cached
 * lead source mapping from VIN Solutions. Falls back to "Source #ID" if
 * the mapping is not available (operator preference 2026-04-26: drop
 * developer-jargon "VIN" from the user-facing fallback string).
 *
 * For non-VIN-pattern URLs, returns the hostname. For non-URL inputs
 * (already-named sources passed through directly), returns the input
 * unchanged. For null/empty input, returns "Unknown".
 */
export function formatLeadSource(
  raw: string | null | undefined,
  sourceMap?: Map<string, string>,
): string {
  if (!raw) return "Unknown";
  // Match VIN Solutions leadsources URL pattern.
  const vinMatch = raw.match(/\/leadsources\/id\/(\d+)/i);
  if (vinMatch) {
    const sourceId = vinMatch[1];
    if (sourceMap && sourceMap.has(sourceId)) {
      return sourceMap.get(sourceId)!;
    }
    return `Source #${sourceId}`;
  }
  // If it looks like a generic URL but not a VIN leadsources URL, show domain.
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    try {
      const hostname = new URL(raw).hostname;
      return hostname;
    } catch {
      return raw;
    }
  }
  return raw;
}
