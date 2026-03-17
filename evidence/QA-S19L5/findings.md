# QA-S19L5 — L5 Admin Walkthrough Findings

User is walking through the live UI and reporting findings. This document collects them for a subsequent FIX sprint.

## Known Before Walkthrough
- Cage Automotive should have no data (parent company, not a dealership)
- Huminic org needs to be created and associated with Super Admin account
- Other dealers may need backfill sync for VIN data
- ENOENT error on PM2 restart (dist/public/index.html race condition)

## User Findings

1. **Org switch should full refresh and land on main page.** Currently switching orgs may stay on the current page with stale data. Should do a full page reload and redirect to "/" (main chat page).

2. **TeamBox: static left column should be a popup, popup should be the column.** Currently there's a static left column showing Conversations/Tasks AND a popup menu overlay with Conversations/Tasks/Workflows. The popup content (with Workflows) should replace the static column. The current static column should become the popup. The layout is inverted.

3. **Left menu: locked mode should not change column on hover.** The menu has two modes:
   - **Popup mode (default):** Hover over menu items → popup appears. Select an item → page opens, popup closes. This works correctly.
   - **Locked mode (click the two arrows):** Column stays static, pushes content right. This works correctly for layout.
   - **BUG:** In locked mode, hovering over menu items changes the locked column content. It should NOT. The locked column should only change when you CLICK a different menu item, not on hover. Hover should do nothing when locked. The lock arrows toggle between popup behavior and persistent column behavior — but hover is leaking through to the locked column.
   - **Note:** There is a timeout that auto-unlocks the locked mode. This is already built in and correct.

4. **"Credits" menu item in left sidebar should not exist.** An unauthorized UI modification added a "Credits" item to the left side menu. This was not part of the original design and needs to be removed.

5. **Marketing submenu has two agent sections — should only have one.** The marketing submenu shows the creative tools agents (Photo Studio, Video Producer, etc.) which is correct, BUT there's also a second section below it showing database agents like "Elizabeth" and "Photo agents." That entire second section of agents should not be there. Only the marketing creative tools section should appear.

6. **Submenu links not navigating correctly.** Most links in the submenus (the items at the top of the popup/column above the separator) don't go to the correct destination. Clicking a labeled link doesn't navigate to where it says it should. This appears to be a widespread issue across multiple submenus, not just marketing.

7. **Sales has no agents — should have 3.** Under Sales, the following agents should exist:
   - **Communication Agent** (named per dealer — "Caroline" for Serra, "Elizabeth" for Hyundai of Columbia, etc.) — handles customer communication
   - **Sales Coach Agent** — uses uploaded knowledge + web/LLM to coach salespeople through deals, look up solutions
   - **Writing Agent** — helps craft text messages and emails, will use uploaded knowledge for guidance
   These are missing from the Sales submenu. The communication agent "Elizabeth" (Hyundai of Columbia) is incorrectly showing under Marketing instead of Sales.

8. **Service has no chat agent.** There should be a service-specific agent for handling service conversations. It's not present.

9. **Agent department assignments are wrong.** Elizabeth (communications agent for Hyundai of Columbia) is appearing under Marketing when it should be under Sales. Agents are not in their correct departments. Need to audit all agent department assignments across all dealers.

10. **Other dealers not populating data.** VIN Solutions data is not flowing for dealers other than Serra Honda. Need to trigger backfill sync for all connected dealers (Serra Nissan dealer 21044, Tony Serra Ford dealer 21047). The other dealers (Hyundai of Columbia, Ford of Columbia) may also need VIN integration provisioning.

11. **Missing billing tile on main settings page.** The System Settings page should have a billing configuration tile but it's not showing.

12. **Submenu links confirmed broken (widespread).** The links above the divider in submenus are not navigating correctly. This affects multiple sections. The structure is correct (links on top, agents below divider) but the links don't route to the right destination.

13. **Manage → Activities shows wrong content.** The Activities page under Manage is showing system synchronization logs (background sync operations) instead of user chat activity. Two options per user:
    - **Keep the sync activity log as-is** (it's useful) but rename the menu item to something like "System Log"
    - **Add a new "User Chats" menu item** under Manage that shows chat activity sortable by user for the org (admin-only view)
    - The user chose: keep the sync log, add "User Chats" as a new item. More intuitive naming.

14. **No copy button on chat responses.** When the AI responds in the chat, there's no way to copy the response text. Need a copy-to-clipboard button on each assistant message.

