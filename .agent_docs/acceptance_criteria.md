# .agent_docs/acceptance_criteria.md — Nexxus v2.2
# SINGLE SOURCE OF TRUTH FOR ALL ACCEPTANCE CRITERIA
# This file is READ-ONLY to all agents. Owner changes only. chmod 444 after deployment.
# Format: Given / When / Then — each item maps 1:1 to a test in spec.ts
# Every AC item MUST have a corresponding test. No AC without a test. No test without an AC.
# Last updated: 2026-03-04

---

## OUT OF SCOPE — DO NOT TEST

The following items are explicitly excluded from v2.2 and must generate a test failure
if any reference is found in the codebase:

- Drive, Custom Agent, Sharing, Artifacts
- Global Skills (Skills UI outside Personal Assistant)
- System-wide dealer brain
- Two-way email inbox
- File upload analysis
- NanoClaw / Personal Assistant (Wave 6)
- A2P / 10DLC SMS registration
- Credit system or billing markup UI
- Facebook / Google Analytics / Make.com connectors

---

## MVP FUNCTION 1 — ACCURATE METRICS

**AC-01-A: Active pipeline definition**
Given a request for active pipeline count
When the system queries the database
Then it returns leads created in the last 14 days excluding status Lost, Sold, or Duplicate

**AC-01-B: Pipeline count display**
Given the AI Chat landing page loads
When the page renders
Then the displayed active pipeline count matches the database query defined in AC-01-A

**AC-01-C: Metric consistency across sections**
Given active pipeline count is displayed in Sales dashboard
When the same count is requested in Marketing Insights
Then both values are identical — computed from the same single query

---

## MVP FUNCTION 2 — VOICE LEAD CAPTURE

**AC-02-A: Successful VAPI lead capture**
Given an inbound VAPI call completes
When both VIN creation steps succeed
Then a lead record exists in VIN Solutions with call transcript attached and no escalation created

**AC-02-B: Step 1 failure escalation**
Given an inbound VAPI call completes
When the VIN contact creation (step 1) fails
Then a VIN Push Failure escalation exists in TeamBox containing: org_id, failed_step=1,
error_response, timestamp, original_vapi_data

**AC-02-C: Step 2 failure escalation**
Given an inbound VAPI call completes and step 1 succeeds
When the VIN lead creation (step 2) fails
Then a VIN Push Failure escalation exists in TeamBox containing: org_id, failed_step=2,
contact_href, error_response, timestamp, original_vapi_data

**AC-02-D: No silent failure**
Given any step in the VAPI→VIN flow fails
When the system processes the failure
Then no lead is silently dropped — a log entry AND an escalation both exist

---

## MVP FUNCTION 3 — APPOINTMENT SYNC

**AC-03-A: Google Calendar appointment appears in Nexxus**
Given a Google Calendar connector is enabled for an org
When a new appointment is created in Google Calendar
Then the appointment appears in the Nexxus internal calendar within the sync interval

**AC-03-B: Dealer.com appointment appears in Nexxus**
Given a Dealer.com connector is enabled for an org
When a new appointment is created in Dealer.com
Then the appointment appears in the Nexxus internal calendar within the sync interval

**AC-03-C: Tekion appointment appears in Nexxus**
Given a Tekion connector is enabled for an org
When a new appointment is created in Tekion
Then the appointment appears in the Nexxus internal calendar within the sync interval

**AC-03-D: Manual appointment creation**
Given a staff user is in the Nexxus calendar view
When they create an appointment manually
Then the appointment is saved and visible to other org users with calendar access

**AC-03-E: VIN Solutions not listed as appointment source**
Given an org admin views the appointment sync settings
When they view available connectors
Then VIN Solutions does not appear as an option

---

## MVP FUNCTION 4 — UNIVERSAL WIDGET

**AC-04-A: Four channels present**
Given a widget configuration for an org with all channels enabled
When the widget is rendered
Then web chat, web call, form, and two-way video are all available as options

**AC-04-B: Video launches immediately on click**
Given the two-way video channel is enabled
When a customer selects the video option
Then a Tavus session is initialized and the video begins immediately — not pre-loaded on page arrival

**AC-04-C: Channel toggle**
Given a channel is disabled in widget configuration
When the widget renders
Then that channel option does not appear

**AC-04-D: Embed code generation**
Given an org admin views the widget configuration page
When they view the embed section
Then a working embed code snippet is displayed and copyable

---

## MVP FUNCTION 5 — OUTBOUND TRIGGER ENGINE

**AC-05-A: Kill switch blocks SMS**
Given `outbound_enabled = FALSE` in the org settings
When an outbound SMS trigger fires
Then no SMS is sent, an Unsent Message escalation is created in TeamBox, and the trigger is not queued

**AC-05-B: Kill switch blocks phone calls**
Given `outbound_enabled = FALSE` in the org settings
When an outbound VAPI call trigger fires
Then no call is initiated, an Unsent Message escalation is created in TeamBox

**AC-05-C: Kill switch blocks email**
Given `outbound_enabled = FALSE` in the org settings
When an outbound email trigger fires
Then no email is sent, an Unsent Message escalation is created in TeamBox

**AC-05-D: Channel switch blocks specific channel**
Given `outbound_enabled = TRUE` and `sms_enabled = FALSE`
When an outbound SMS trigger fires
Then no SMS is sent, an Unsent Message escalation is created

**AC-05-E: Rate limit enforcement**
Given a customer has received 3 outbound messages in the last 24 hours
When a 4th outbound trigger fires for the same customer
Then the message is blocked and an Unsent Message escalation is created

**AC-05-F: Trigger logged**
Given any outbound trigger fires (sent or blocked)
When the system processes it
Then a log entry exists with: trigger_id, org_id, customer_id, channel, status, blocked_reason, timestamp

---

## MVP FUNCTION 6 — ADVANCED AI CHAT

**AC-06-A: Thinking card appears**
Given a user sends a complex query to AI Chat
When the AI is processing
Then a thinking card is visible indicating reasoning is in progress

**AC-06-B: Chat history persists**
Given a user has had a previous chat session
When they return to AI Chat
Then their previous conversation history is accessible

**AC-06-C: Persona name from master field**
Given an org has set "Agent Name" = "Alex" in org settings
When any AI Chat surface renders the persona greeting
Then "Alex" is displayed — not "Automa" or any other name

**AC-06-D: Persona name fallback**
Given an org has not set the Agent Name field
When any AI Chat surface renders
Then the VAPI configuration name is used as fallback

---

## MVP FUNCTION 7 — CRM GURU AGENT

**AC-07-A: VIN Solutions data priority**
Given a user asks CRM Guru a question answerable from VIN Solutions data
When CRM Guru responds
Then the response draws from VIN Solutions data

**AC-07-B: Warehouse supplement**
Given a user asks CRM Guru a question that requires warehouse data in addition to VIN data
When CRM Guru responds
Then the response includes both data sources and explicitly states "I found additional data in your
internal data warehouse" when warehouse data is used

**AC-07-C: General chat fallback**
Given a user in general AI Chat asks a question that requires CRM data
When the system processes the query
Then it attempts the internal data warehouse first, and if insufficient, returns a response with
a navigation suggestion to CRM Guru

---

## MVP FUNCTION 8 — CUSTOMER EXPERIENCE VIEW

**AC-08-A: Globe icon links to landing page**
Given a staff user clicks the globe icon in the Nexxus header
When the link resolves
Then the org's public hosted landing page opens at nexxus.ai/p/[org-slug]

**AC-08-B: Landing page is publicly accessible**
Given the landing page URL for an org
When an unauthenticated user visits the URL
Then the page loads without requiring login

---

## MVP FUNCTION 9 — HOSTED LANDING PAGE

**AC-09-A: Landing page slug format**
Given a new org is created with name "Serra Chevrolet"
When the system generates the landing page
Then the slug is "serra-chevrolet" and the page is accessible at nexxus.ai/p/serra-chevrolet

**AC-09-B: Slug collision handling**
Given a slug "serra-chevrolet" already exists
When a second org tries to claim the same slug
Then the system appends "-2" (e.g., "serra-chevrolet-2") automatically

**AC-09-C: Slug edit and logging**
Given an Org Admin edits their landing page slug
When the change is saved
Then the new slug is active, the old slug redirects for 30 days, and the change is in the forensic log

**AC-09-D: Widget present on landing page**
Given a user visits the public landing page
When the page loads
Then the universal widget is present and functional

---

## MVP FUNCTION 10 — METERING AND USAGE

**AC-10-A: Events are counted**
Given an outbound SMS is sent
When the event completes
Then a usage log entry exists for the org with event_type=outbound_sms, timestamp, org_id

**AC-10-B: Usage visible to Org Admin**
Given a user with Org Admin role views the usage page
When the page loads
Then usage counts and volumes for their org are displayed with no dollar amounts

**AC-10-C: Usage scoped correctly**
Given a Partner Admin views usage
When they view the usage dashboard
Then they see usage for their assigned orgs only — not all orgs

**AC-10-D: Billing API accessible**
Given a valid API request to the billing MCP tool
When billing_get_usage is called with org_id and period
Then usage data is returned in the defined schema

---

## KILL SWITCH SYSTEM

**AC-KS-A: All 4 columns exist in staging DB**
Given the kill switch migration has been applied to staging
When the organization_settings table schema is inspected
Then columns outbound_enabled, sms_enabled, phone_enabled, email_enabled all exist with DEFAULT FALSE

**AC-KS-B: Master switch overrides channels**
Given `outbound_enabled = FALSE` and `sms_enabled = TRUE`
When any outbound trigger fires
Then the trigger is blocked — master switch takes precedence

---

## TEAMBOX ESCALATIONS

**AC-TB-A: Escalation types present**
Given the TeamBox section
When a user with TeamBox access views it
Then Task, Escalation, and Unsent Message are distinct visual types

**AC-TB-B: Priority levels present**
Given an Escalation item
When it is displayed in TeamBox
Then Critical, High, Medium, Low priority levels are visually distinct

---

## ENFORCER COMPLIANCE

**AC-EF-A: Dropped feature references block merge**
Given a commit contains a reference to "Drive", "Custom Agent", "Sharing", or "Artifacts" in code
When the Enforcer compliance check runs
Then the merge is blocked and an Enforcer Violation escalation is created

**AC-EF-B: No production credentials**
Given a commit is submitted for merge
When the Enforcer scans for credential patterns
Then any file containing a production Supabase URL, real API key, or real phone number blocks the merge

**AC-EF-C: Kill switch test must pass**
Given the kill switch test suite
When all 4 channel tests run
Then all 4 pass before any merge proceeds

---

## AI CHAT LANDING PAGE — 4 METRICS

**AC-CH-A: Four metrics displayed on load**
Given a user navigates to AI Chat
When the page loads and the user has not yet typed anything
Then four metric tiles are visible: active pipeline count, appointments today, open escalations, outbound sent (last 24 hours)

**AC-CH-B: Metrics hide on chat start**
Given the AI Chat landing page is showing the four metric tiles
When the user begins typing or sends a message
Then the four metric tiles collapse or hide from view

---

## HUNCH FILTER — SYSTEM PROMPT HIERARCHY

**AC-HF-A: Accepted hunch added to effective prompt**
Given a user has accepted a hunch from the AI Chat response
When the next AI inference is executed for that org/user
Then the accepted hunch content is appended to the effective prompt (after master prompt, before session context)
And the master system prompt is unchanged

**AC-HF-B: Dismissed hunch not included**
Given a user has dismissed a hunch
When the next AI inference is executed
Then the dismissed hunch content does NOT appear in the effective prompt

**AC-HF-C: Resolved hunch removed from filter**
Given a hunch was accepted and its resulting task has been marked complete (resolved)
When the next AI inference is executed
Then the resolved hunch is no longer in the effective prompt

**AC-HF-D: Master prompt unchanged by hunch acceptance**
Given a user accepts any number of hunches
When the hunch filter is evaluated
Then the master system prompt stored in org settings is identical to its value before any hunch was accepted

---

## NAVIGATION SHELL

**AC-NAV-A: AI Chat sub-items render**
Given a user with default access opens the app
When they expand AI Chat in the navigation
Then Favorites, Chat History, and Artifacts sub-items are visible

**AC-NAV-B: Artifacts scoped to data reports only**
Given a user is in AI Chat → Artifacts
When they view the section
Then only downloadable data reports are available — no file upload, no sharing, no Drive

**AC-NAV-C: My Work sub-items render**
Given a user with default access opens the app
When they expand My Work in the navigation
Then Assistant, Dashboard, Tasks, and Chat sub-items are visible
And Assistant shows a "Coming Soon" label (Wave 6)

**AC-NAV-D: TeamBox sub-items render**
Given a user with TeamBox access opens TeamBox
When they expand TeamBox in the navigation
Then Tasks, Conversations, and Workflows sub-items are visible

**AC-NAV-E: All conversations route to TeamBox → Conversations**
Given an agent-to-customer conversation is active or a staff member takes over a conversation
When the staff member navigates to it
Then they arrive in TeamBox → Conversations — not in any section-specific sub-item

**AC-NAV-F: Sales sub-items match reference model**
Given a user with Sales access opens Sales
When they expand Sales in the navigation
Then Dashboard, Agents, Insights, and Calendar sub-items are visible
And Campaigns is NOT present under Sales

**AC-NAV-G: Service sub-items correct**
Given a user with Service access opens Service
When they expand Service in the navigation
Then Dashboard, Agents, Campaigns, Insights, and Calendar sub-items are visible

**AC-NAV-H: Management sub-items correct**
Given a user with Management access opens Management
When they expand Management in the navigation
Then Dashboard, Insights, Hunches (Coming Soon), Activities, and ROI sub-items are visible

**AC-NAV-I: Disabled section absent from nav**
Given a module is disabled at the platform level
When any user views the navigation
Then that section is completely absent — no stub, no Coming Soon label

**AC-NAV-J: Enabled-but-not-built section shows Coming Soon**
Given a module is enabled but not yet built (e.g., Studio sub-items in v2.2)
When a user with access views the navigation
Then that sub-item renders with a "Coming Soon" label and is not clickable
