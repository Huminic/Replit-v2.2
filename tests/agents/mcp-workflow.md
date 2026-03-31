# MCP Exploration Workflow

## What MCP Playwright Is

MCP (Model Context Protocol) Playwright is a browser automation interface exposed at `https://mcp.huminicdev.com/dax/mcp`. It provides JSON-RPC tools for navigating, clicking, snapshotting, and evaluating pages in a remote browser session. The Planner agent uses MCP to explore the live application and document what it finds.

The local helper at `tests/e2e/helpers/mcp.ts` wraps MCP calls for use within Playwright test contexts.

## MCP Helper Reference

### `callMCP(request, toolName, args, token)`

**File:** `tests/e2e/helpers/mcp.ts`

```typescript
export async function callMCP(
  request: APIRequestContext,  // Playwright's request context
  toolName: string,            // MCP tool name (e.g., "browser_navigate")
  args: Record<string, unknown>, // Tool-specific arguments
  token: string                // Bearer token from auth login
): Promise<any>
```

**How it works:**
1. Sends a JSON-RPC `tools/call` POST to the MCP endpoint
2. Parses the SSE (Server-Sent Events) response, looking for `data:` lines
3. Extracts and JSON-parses the `result.content[0].text` field
4. Throws if no data line is found

**Authentication:** Requires a Bearer token obtained via `login()` from the auth helper. The token is passed as an `Authorization` header to the MCP endpoint.

**Response format:** The MCP endpoint returns Server-Sent Events. The helper finds the first `data:` line, parses the JSON, and extracts the result content.

## Available MCP Tools

Based on the MCP Playwright plugin, these tools are available:

| Tool | Purpose | Key Args |
|------|---------|----------|
| `browser_navigate` | Go to a URL | `url` |
| `browser_navigate_back` | Go back | (none) |
| `browser_click` | Click an element | `element`, `ref` |
| `browser_fill_form` | Fill form fields | `values` |
| `browser_type` | Type text into focused element | `text` |
| `browser_press_key` | Press a keyboard key | `key` |
| `browser_snapshot` | Get accessibility tree snapshot of current page | (none) |
| `browser_take_screenshot` | Capture visual screenshot | (none) |
| `browser_evaluate` | Run JS in page context | `expression` |
| `browser_hover` | Hover over an element | `element`, `ref` |
| `browser_select_option` | Select dropdown option | `element`, `values` |
| `browser_tabs` | List open tabs | (none) |
| `browser_wait_for` | Wait for a condition | `selector`, `state` |
| `browser_console_messages` | Get console log output | (none) |
| `browser_network_requests` | Get network request log | (none) |
| `browser_resize` | Resize viewport | `width`, `height` |
| `browser_close` | Close the browser | (none) |
| `browser_handle_dialog` | Accept/dismiss dialogs | `accept` |
| `browser_file_upload` | Upload a file | `paths` |
| `browser_drag` | Drag and drop | `startElement`, `endElement` |
| `browser_run_code` | Execute Playwright code directly | `code` |

## Step-by-Step Exploration Workflow

### Prerequisites

1. Obtain a valid auth token for the role you want to explore as
2. Have access to the MCP endpoint (`https://mcp.huminicdev.com/dax/mcp`)
3. Know the target domain/page you want to explore

### Phase 1: Initial Page Discovery

**Step 1 -- Authenticate and navigate**

```
callMCP(request, "browser_navigate", { url: "https://dev.huminicdev.com/settings" }, token)
```

Navigate to the target page. Use the full URL (the MCP browser is remote, not local).

**Step 2 -- Take a snapshot**

```
callMCP(request, "browser_snapshot", {}, token)
```

Returns the accessibility tree of the current page. This is the primary discovery tool -- it shows all visible elements, their roles, text content, and interactive states.

**Step 3 -- Take a screenshot (optional)**

```
callMCP(request, "browser_take_screenshot", {}, token)
```

Visual confirmation of what the page looks like. Useful for layout-dependent features.

### Phase 2: Interactive Exploration

**Step 4 -- Click interactive elements**

```
callMCP(request, "browser_click", { element: "Settings tile", ref: "e15" }, token)
```

The `ref` comes from the snapshot output. Each element in the accessibility tree has a reference ID.

**Step 5 -- Snapshot after interaction**

```
callMCP(request, "browser_snapshot", {}, token)
```

Capture the new state after clicking. Compare with the previous snapshot to understand what changed.

**Step 6 -- Fill forms if needed**

```
callMCP(request, "browser_fill_form", { values: [{ selector: "#name", value: "Test" }] }, token)
```

**Step 7 -- Check network requests**

```
callMCP(request, "browser_network_requests", {}, token)
```

See what API calls the page makes. Useful for understanding data dependencies.

### Phase 3: Role Comparison

**Step 8 -- Repeat for different roles**

Log in as a different user role and navigate to the same page. Compare snapshots to identify role-based element visibility.

Example: Snapshot `/settings` as `superAdmin` vs `orgAdmin` vs `sales` to see which tiles are visible to each role.

### Phase 4: Edge Cases

**Step 9 -- Test empty states**

Navigate to pages with no data (e.g., a new org with no conversations). Snapshot to see empty state UI.

**Step 10 -- Test error states**

Navigate to invalid routes or trigger error conditions. Snapshot to see error handling.

## Example Exploration Session: Settings Domain

```
# 1. Login as super admin
token = login(request, testUsers.superAdmin)

# 2. Navigate to settings
callMCP(request, "browser_navigate", { url: "https://dev.huminicdev.com/settings" }, token)

# 3. Snapshot -- discover all settings tiles
snapshot1 = callMCP(request, "browser_snapshot", {}, token)
# Record: found tiles for "Users", "Billing", "Integrations", "AI Agents", etc.

# 4. Click "Users" tile
callMCP(request, "browser_click", { element: "Users", ref: "e23" }, token)

# 5. Snapshot -- see users management page
snapshot2 = callMCP(request, "browser_snapshot", {}, token)
# Record: user list table with columns Name, Email, Role, Status

# 6. Check network
callMCP(request, "browser_network_requests", {}, token)
# Record: GET /api/users called, returns user list

# 7. Navigate back
callMCP(request, "browser_navigate_back", {}, token)

# 8. Login as org_admin, repeat steps 2-3
token2 = login(request, testUsers.orgAdmin)
callMCP(request, "browser_navigate", { url: "https://dev.huminicdev.com/settings" }, token2)
snapshot3 = callMCP(request, "browser_snapshot", {}, token2)
# Record: fewer tiles visible -- no "Billing" for org_admin
```

## How Exploration Feeds Into Plans

### From Exploration to Plan

After exploring a domain, the Planner produces a plan file at `tests/agents/plans/{domain}-plan.md`. The plan should contain:

1. **Domain overview** -- What the feature area does, which routes are involved
2. **Page inventory** -- Each page/view discovered, with the elements found via snapshot
3. **Role matrix** -- Which elements are visible/accessible per role (from role comparison)
4. **Testable scenarios** -- Specific behaviors to test, derived from exploration:
   - Navigation: "Clicking tile X navigates to /path"
   - Visibility: "Users tile visible to super_admin but not sales"
   - Functionality: "Submitting form creates new record"
   - Validation: "Empty required field shows error message"
5. **Data dependencies** -- What data must exist for the page to work (from network analysis)
6. **API endpoints observed** -- From `browser_network_requests` output

### Plan Template

```markdown
# {Domain} Test Plan

## Routes
- /primary-route
- /primary-route/sub-page

## Roles Tested
- superAdmin: full access
- orgAdmin: limited tiles
- sales: read-only view

## Discovered Elements
### /primary-route
- Tile: "Feature A" (ref: e12) -- navigates to /primary-route/feature-a
- Tile: "Feature B" (ref: e15) -- navigates to /primary-route/feature-b
- [super_admin only] Tile: "Admin Feature" (ref: e18)

## Scenarios
1. Page loads and displays expected tiles for {role}
2. Clicking {tile} navigates to {sub-page}
3. {Sub-page} shows {expected content}
4. Role {X} cannot see {restricted element}

## Data Dependencies
- GET /api/{resource} -- requires at least one {resource} to exist
- User must belong to an org with active subscription

## MCP Tools Used
- browser_navigate, browser_snapshot, browser_click, browser_network_requests
```

### Conventions for Recording Findings

1. **Reference element refs** -- Include the `ref` IDs from snapshots so the Generator knows which elements to target
2. **Note exact text content** -- Record button labels, heading text, placeholder text exactly as seen in snapshots
3. **Record API endpoints** -- List every endpoint observed via `browser_network_requests` with method and path
4. **Mark role differences explicitly** -- Use `[role_name only]` annotations next to elements that are role-restricted
5. **Include timestamps** -- Note when the exploration was done (data may change between exploration and generation)

## Limitations and Gotchas

### MCP Session State

- The MCP browser session is remote and shared. If another agent is using MCP simultaneously, there may be conflicts.
- Browser state (cookies, localStorage) may not persist between separate `callMCP` calls if the session resets.
- Always re-navigate after authentication rather than assuming previous page state.

### Authentication

- The MCP endpoint requires a Bearer token. This is the same token from the app's `/api/auth/login` endpoint, not a separate MCP credential.
- Tokens expire after 60 minutes. For long exploration sessions, re-authenticate.
- The auth rate limiter (5 requests per 15 minutes) applies. Use the cached token from `login()` for API-based MCP calls.

### Snapshot vs Screenshot

- **Snapshots** (accessibility tree) are the primary exploration tool -- they give structured, parseable element data including refs, roles, names, and states.
- **Screenshots** are supplementary -- useful for visual layout but not parseable by the Generator.
- Always prefer snapshots over screenshots for plan documentation.

### Tour Overlays

- The app has product tour overlays that appear on first visit to each page.
- In browser tests, these are dismissed via `addInitScript` setting localStorage keys.
- When exploring via MCP, you may need to dismiss tours manually (click the dismiss button) or inject the localStorage keys via `browser_evaluate`.

### Dynamic Content

- Some pages load data asynchronously. A snapshot taken too early may show loading states.
- Use `browser_wait_for` or take a snapshot after a short delay to capture the loaded state.
- Network request logs (`browser_network_requests`) can confirm when data has loaded.

### Base URL

- MCP browser operates remotely. Use the full production/dev URL (`https://dev.huminicdev.com`) not `localhost`.
- Hand-authored tests use `localhost:5000` or `process.env.BASE_URL`. Agent specs should follow the same pattern (configurable base URL), but MCP exploration always hits the deployed instance.

### Element Refs Are Ephemeral

- The `ref` IDs from snapshots (e.g., `e15`) are session-specific. They change between browser sessions.
- Plans should record element refs for context but the Generator should use semantic selectors (text content, data-testid, role) rather than refs in the generated spec code.

### No Direct File Access

- MCP tools operate on the live deployed application. They cannot read source code, modify files, or access the server filesystem.
- All exploration is black-box -- observing the UI as a user would.
