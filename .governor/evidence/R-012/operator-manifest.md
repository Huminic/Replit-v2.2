# Operator Manifest — 2026-03-26
# Raw input from operator app review. This is the source of truth for R-012+ sprint planning.

## Global Items
- Popout menus have separators between links and agents (correct, keep)
- RBAC stays same
- Made many edits to menus — agent will need permission to modify UI values
- Anything removed from popout must be removed from top menu on page
- Insight data seems empty and not working properly

## AI Chat (Home)
Sub items: Chat, Favorites, Chat History
1. Chat needs high conversation quality
2. Tests need written to test chat quality
3. Links need tested
4. Chat has not been tested well enough
5. Favorites feature needs tested
6. Chat history: check scrolling behavior when list exceeds screen, test ability to delete

## TeamBox
Sub items: Conversations, Tasks, Filters
Should be: All Conversations, Phone Calls, SMS, Video, Webchats, Form Submissions
- Agent test needs created
- Conversations can be removed from popout
- Popout needs changed to: SMS, Email, Phone, Video, Tasks
- Each choice goes right to filtered list
- Needs top menu bar like rest of pages with favorites and same popout items
- Phone shows VAPI logs for store with transcript links
- Video shows Tavus logs with transcript links
- Filters need different color (not light blue)
- Need easy filter for agent vs human conversations

## My Work
HIDDEN — add to backlog.md

## Sales
Sub items: Dashboard, Agents, Insights, Calendar
Agents: Caroline (comms), Data Guru, Sales Coach, Communication Writer
- Agent test needs created
- Need to see Caroline in this section
- Purpose and test need identified for each agent
- Agents are currently missing from the page
- Agent cards should say what the agent does
- Test needs created for each agent
- Metrics test needs thorough
- Webhook should check for appointment data using agent LLM insert in sales calendar

## Service
Sub items: Dashboard, Agents, Campaigns, Insights, Calendar
Agents: Nancy (campaign agent)
- Agent test needs created
- Need to see Nancy Gaston in agent list
- Agent cards should say what the agent does
- Remove any other agents from service
- Dashboard data needs moved to insights, dashboard item deleted
- Move campaigns to top of list
- Dashboard replaced with Full CRUD Campaign + CSV upload
- Active campaign stats only on dashboard
- Insights needs more data in modal

## Marketing
Sub items: Dashboard, Campaigns, Studio, Insights
Agents: Photo Agent, Video Agent, Copywriter, Marketing Intel, Creative Director
- Agent test needs created
- All items created
- Remove campaigns from popout and page
- Studio should show filters for categories

## Manage
Sub items: Dashboard, Insights (same as sales), System Log, User Chats, ROI
- Remove Dashboard
- Agent test needs created
- Move Billing here for user
- Insights same as sales
- ROI needs removed
- User chats needs to show all staff chats from org with filter
- Dashboard needs to show data (TBD)

## System (Settings)
Sub items: Users, Organization, Tools and Integrations, Knowledge Base, AI Configuration, Notifications, Appearance, Billing
- Right side popout with chat access to copilot system changes
- Multi-positioned tests needed, settings need evaluated
- RBAC needs evaluated — only super admin sees super admin items

## Top Icons
Items: Landing Pages, Notifications, Activity Feed, UI Color, Profile, Arrow (Role Switcher)
- Agent test needs created
- Landing page needs to open in new window
- Activity and notifications may be same data — need to check

## Profile
Sub items: Preferences, Billing, Take Tour
- Agent test needs created
- "Take Tour" should be retitled "Reset Tour"
- Billing needs moved to submenu of manage

## Landing Page
Sub items: Page, Widgets
- Agent test needs created
- Video widget needs to target new window, not open in widget window
- Store name should show on left side at top

## Widgets (Universal widget)
Items: Web chat, Web Call, Contact Form, 2-way Video
- Video widget CONFIRMED to open new window, not chat pane
- Web call should trigger outbound instant agent call — ask for number, trigger VAPI call to prospect
