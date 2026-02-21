# Data Source Inventory & API Capability Assessment

**Created:** 2026-02-18
**Purpose:** Complete inventory of all data sources, fields, API endpoints, and capabilities available to Nexxus V2. Front-loaded from official documentation, to be validated via live API probing.

---

## Table of Contents

1. [VIN Solutions Lead Management API](#1-vin-solutions-lead-management-api)
2. [VAPI Voice AI Platform](#2-vapi-voice-ai-platform)
3. [Tavus Video AI Platform](#3-tavus-video-ai-platform)
4. [Local Database (Nexxus DB)](#4-local-database-nexxus-db)
5. [Gap Analysis: What We Use vs. What's Available](#5-gap-analysis)
6. [48-Hour Claim: Evidence & Conclusion](#6-48-hour-claim)
7. [API Probing Plan](#7-api-probing-plan)
8. [Data-to-Questions Mapping](#8-data-to-questions-mapping)

---

## 1. VIN Solutions Lead Management API

**Source:** `filestore/VinDocs/Leadmanagement.md` (OAS 3.0 Spec)
**Auth:** OAuth 2.0 Client Credentials (tokens expire every 60 min)
**Base URL:** `https://api.vinsolutions.com`
**Header Versioning:** `Accept: application/vnd.coxauto.v3+json` (lowercase v3 required in production despite docs showing V3)

### 1.1 Complete Endpoint Inventory

| # | Method | Endpoint | Description | We Use? |
|---|--------|----------|-------------|---------|
| 1 | GET | `/gateway/v1/organization/dealers` | List dealers in org | No |
| 2 | GET | `/gateway/v1/tenant/user?dealerId=X` | List CRM users for dealer | Yes (userId lookup) |
| 3 | GET | `/gateway/v1/tenant/user/id/{userId}` | Get specific CRM user | No |
| 4 | POST | `/gateway/v1/organization/dealers/id/{dealerId}/remove` | Remove dealer from org | No (destructive) |
| 5 | GET | `/leads` | Search leads (paginated) | Yes (primary) |
| 6 | POST | `/leads?dealerId=X` | Create new lead | Yes (sync_queue) |
| 7 | GET | `/leads/id/{LeadId}` | Get specific lead | Yes |
| 8 | PUT | `/leads/id/{LeadId}` | Update lead | No |
| 9 | GET | `/vehicles/vin?vin=X` | VIN decode | No |
| 10 | GET | `/vehicles/years` | List vehicle years | No |
| 11 | GET | `/vehicles/makes?year=X` | List makes for year | No |
| 12 | GET | `/vehicles/models?year=X&make=Y` | List models | No |
| 13 | GET | `/vehicles/trims?year=X&make=Y&model=Z` | List trims | No |
| 14 | GET | `/vehicles/interest?leadId=X&dealerId=Y` | Get vehicles of interest | No |
| 15 | POST | `/vehicles/interest?leadId=X&dealerId=Y` | Add vehicle of interest | No |
| 16 | PUT | `/vehicles/interest/id/{id}?leadId=X&dealerId=Y` | Update vehicle of interest | No |
| 17 | GET | `/vehicles/trade?leadId=X&dealerId=Y` | Get trade-in vehicles | No |
| 18 | POST | `/vehicles/trade?leadId=X&dealerId=Y` | Add trade-in vehicle | No |
| 19 | PUT | `/vehicles/trade/id/{id}?leadId=X&dealerId=Y` | Update trade-in vehicle | No |
| 20 | GET | `/leadSources?dealerId=X` | List lead sources | Yes (for creating leads) |
| 21 | GET | `/leadSources/id/{id}?dealerId=X` | Get specific lead source | No |
| 22 | GET | `/leadTypes?dealerId=X` | List lead types | Yes (for creating leads) |
| 23 | GET | `/leadStatuses?dealerId=X` | List lead statuses | No |
| 24 | GET | `/leadStatusTypes?dealerId=X` | List lead status types | No |
| 25 | GET | `/leadGroupCategories?dealerId=X` | List lead group categories | No |
| 26 | GET | `/gateway/v1/contact?contactId=X&dealerId=Y` | Get contact by ID | Yes (name enrichment) |
| 27 | POST | `/gateway/v1/contact` | Create contact | Yes (sync_queue) |
| 28 | PUT | `/gateway/v1/contact` | Update contact | No |
| 29 | GET | `/gateway/v1/contacts` | Search contacts (plural) | No |
| 30 | POST | `/gateway/v1/contacts` | Bulk create contacts | No |
| 31 | PUT | `/gateway/v1/contacts` | Bulk update contacts | No |

**Note:** The API introduction mentions "CallDetails" as a resource, but NO `/callDetails` endpoint is documented in the OAS 3.0 spec. This may be a deprecated or undocumented endpoint — flagged for probing.

### 1.2 Key Response Schemas

**LeadGetResponse (GET /leads/id/{id}):**
```
leadId, leadStatus, leadStatusType, createdUtc, updatedUtc,
contact (URL → /contacts/id/{contactId}),
leadSource (URL → /leadSources/id/{id}),
leadType (URL → /leadTypes/id/{id}),
vehiclesOfInterest (URL → /vehicles/interest),
vehiclesTradingIn (URL → /vehicles/trade),
isHot, leadGroupCategories
```

**PagedResultLeadGetResponse (GET /leads):**
```
results[] — array of LeadGetResponse
totalItems — total count across all pages
pageSize — items per page (response field)
pageNumber — current page
pageCount — total pages
```
**NOTE:** Query param is `limit` (not `pageSize`). Response field is `pageSize`. Different names.

**ProviderContact (GET /gateway/v1/contact):**
```
ContactInformation:
  FirstName, MiddleName, LastName, CompanyName, Title
  Emails[]: { EmailAddress, EmailType }
  Phones[]: { Number, PhoneType }
  Addresses[]: { Line1, Line2, City, State, Zip, Country }
ProviderLeadInformation:
  CurrentSalesRepUserId
  Assignments[]: { UserId, AssignmentType }
```

**AddContactRequestModel (POST /gateway/v1/contact):**
```
DealerId (integer, required)
UserId (integer, required)
ContactInformation: { FirstName, LastName, CompanyName, Emails[], Phones[] }
LeadInformation: { CurrentSalesRepUserId }
```

### 1.3 Endpoints We DON'T Use But Could

| Endpoint | What It Provides | Business Value |
|----------|-----------------|----------------|
| GET /vehicles/interest | Exact vehicles customer is interested in | "What's the most popular model?" |
| GET /vehicles/trade | Trade-in details (year, make, model, value) | "What's our average trade-in value?" |
| PUT /leads/id/{id} | Update lead status, assignment | Write-back capabilities |
| GET /leadStatuses | All possible lead statuses for a dealer | Status mapping validation |
| GET /leadStatusTypes | Status type hierarchy | Understand status structure |
| GET /leadGroupCategories | Lead categorization | Segmentation analytics |
| GET /gateway/v1/contacts (plural) | Bulk contact search | Customer lookup |
| GET /vehicles/vin | VIN decode → year, make, model, trim | Inventory intelligence |
| "CallDetails" (undocumented) | Communication history? | Salesperson response tracking |

### 1.4 Known API Behaviors (Verified)

| Behavior | Source | Status |
|----------|--------|--------|
| No 48-hour data limitation | api-48h-test-results.json | VERIFIED FALSE |
| `limit` is query param, `pageSize` is response field | Production testing | CONFIRMED |
| Header must be lowercase `v3` | Production testing | CONFIRMED (docs show V3) |
| `results` is the response array field | Production testing | CONFIRMED (not `items`) |
| Response array is in `data.results` | VIN API response parsing | CONFIRMED |
| `userId` filter on GET /leads returns 404 | Production testing | CONFIRMED |
| `ACTIVE_SET_APPOINTMENT` status returns 404 | api-48h-test-results.json | CONFIRMED (all 3 dealers) |
| Default page size is 25 | api-48h-test-results.json | CONFIRMED |
| ACTIVE leads go back years (2023+) | api-48h-test-results.json | CONFIRMED |
| SOLD leads go back to 2017+ | api-48h-test-results.json | CONFIRMED |

### 1.5 Live API Probe Results (2026-02-18)

**Probed from production with Serra Honda credentials (dealerId 21043).**

#### Working Endpoints (3)

| Endpoint | Status | Notes |
|----------|--------|-------|
| GET /leads?dealerId=X&limit=N | 200 | Primary lead query — WORKS with v3 headers |
| GET /gateway/v1/tenant/user?dealerId=X | 200 | CRM user list — gateway headers |
| GET /gateway/v1/organization/dealers | 200 | Dealer list — gateway headers |

#### Reference Data Endpoints — ALL FAIL (v3 header rejected)

| Endpoint | Status | Error | Implication |
|----------|--------|-------|-------------|
| GET /leadStatuses?dealerId=X | 400 | `UnsupportedApiVersion` | v3 header wrong for this endpoint |
| GET /leadStatusTypes?dealerId=X | 400 | `UnsupportedApiVersion` | Same — needs different version |
| GET /leadSources?dealerId=X | 400 | `UnsupportedApiVersion` | Same — our lead creation code likely fails silently |
| GET /leadTypes?dealerId=X | 400 | `UnsupportedApiVersion` | Same — our lead creation code likely fails silently |
| GET /leadGroupCategories?dealerId=X | 400 | `UnsupportedApiVersion` | Cannot categorize leads |
| GET /vehicles/years | 400 | `UnsupportedApiVersion` | Vehicle reference data inaccessible |
| GET /vehicles/makes?year=X | 400 | `UnsupportedApiVersion` | Same |

**With gateway headers (Accept: application/json, no version):** Returns `ApiVersionUnspecified` — version IS required but v3 is wrong. Need to discover correct version (v1? v2?).

**CRITICAL BUG DISCOVERED:** Our lead creation code in `vinSolutionsService.ts` calls `/leadSources` and `/leadTypes` with v3 headers. These calls fail with 400 but are inside try/catch blocks. The lead creation silently proceeds without valid leadSource/leadType hrefs. This explains why sync_queue `lead_to_vin` jobs have been failing.

#### Gateway Endpoints — Access Denied (403)

| Endpoint | Status | Error | Implication |
|----------|--------|-------|-------------|
| GET /gateway/v1/contacts?dealerId=X | 403 | Auth header format error | Plural contacts endpoint needs different auth |
| GET /gateway/v1/leads?dealerId=X | 403 | Auth header format error | Gateway-style leads endpoint, different auth |
| GET /gateway/v1/communication?dealerId=X | 403 | Forbidden | Exists but we lack permissions |
| GET /gateway/v1/activity?dealerId=X | 403 | Forbidden | Exists but we lack permissions |
| GET /gateway/v1/lead?dealerId=X | 403 | Forbidden | Exists but we lack permissions |

**KEY DISCOVERY:** `/gateway/v1/communication` and `/gateway/v1/activity` EXIST (return 403 Forbidden, not 404). These could contain customer communication history and activity feeds — exactly what the user needs for salesperson response tracking. However, our current API credentials don't grant access.

#### Undocumented Endpoints — All Non-Existent (596)

| Endpoint | Status | Conclusion |
|----------|--------|------------|
| /callDetails | 596 Service Not Found | Does NOT exist |
| /call-details | 596 Service Not Found | Does NOT exist |
| /communications | 596 Service Not Found | Does NOT exist |
| /activities | 596 Service Not Found | Does NOT exist |
| /notes | 596 Service Not Found | Does NOT exist |
| /tasks | 596 Service Not Found | Does NOT exist |
| /appointments | 596 Service Not Found | Does NOT exist |
| /emails | 596 Service Not Found | Does NOT exist |
| /conversations | 596 Service Not Found | Does NOT exist |
| /history | 596 Service Not Found | Does NOT exist |
| /timeline | 596 Service Not Found | Does NOT exist |

**"CallDetails"** mentioned in the API introduction is NOT a standalone endpoint. It may be embedded within contact/lead responses or available through a different API (not Lead Management).

### 1.6 What This Means for Nexxus

**Available RIGHT NOW:**
- Lead search (all statuses, all date ranges, paginated)
- CRM user list (for salesperson roster)
- Dealer list
- Single contact lookup (for name enrichment)
- Lead creation (2-step: contact + lead)

**Available BUT wrong API version:**
- Lead statuses, lead sources, lead types, lead group categories
- Vehicle reference data (years, makes, models, trims)
- Need to discover correct API version header

**Available BUT wrong credentials/permissions:**
- Communication history (gateway endpoint exists)
- Activity feed (gateway endpoint exists)
- Bulk contact search
- These may require additional API scopes or a different API product

**NOT Available (doesn't exist in this API):**
- Call/conversation details (despite mention in docs)
- Appointment data
- Notes/comments
- Email history
- Task/follow-up tracking
- Timeline view

---

## 2. VAPI Voice AI Platform

**Source:** docs.vapi.ai (web documentation, fetched 2026-02-18)
**Auth:** API Key (Bearer token)
**Base URL:** `https://api.vapi.ai`

### 2.1 REST API Endpoints

| Resource | Endpoints | We Use? |
|----------|-----------|---------|
| **Calls** | List, Create, Get, Update, Delete | Create (outbound), partial |
| **Assistants** | List, Create, Get, Update, Delete | Create/Update (agent config) |
| **Analytics** | POST /analytics (create queries) | **NO** |
| **Insights** | List, Create, Get, Update, Delete, Run, Preview | **NO** |
| **Evals** | List, Create, Get, Update, Delete, Run | **NO** |
| **Scorecards** | List, Create, Get, Update, Delete | **NO** |
| **Phone Numbers** | List, Create, Get, Update, Delete | Partial |
| **Squads** | List, Create, Get, Update, Delete | **NO** |
| **Campaigns** | List, Create, Get, Update, Delete | **NO** |
| **Sessions** | List, Create, Get, Update, Delete | **NO** |
| **Chats** | List, Create, Get, Delete, OpenAI-compat | **NO** |
| **Tools** | List, Create, Get, Update, Delete, Test | Partial |
| **Files** | List, Upload, Get, Update, Delete | **NO** |
| **Structured Outputs** | List, Create, Get, Update, Delete, Run | **NO** |
| **Provider Resources** | CRUD | **NO** |

### 2.2 Call Object Schema (Complete)

**Core:**
- `id` (string) — Unique call identifier
- `type` (enum) — inboundPhoneCall, outboundPhoneCall, webCall, vapi.websocketCall
- `status` (enum) — scheduled, queued, ringing, in-progress, ended
- `createdAt`, `updatedAt`, `startedAt`, `endedAt` (datetime)
- `duration` (number) — seconds

**Communication:**
- `messages[]` — Array of UserMessage, SystemMessage, BotMessage, ToolCallMessage, ToolCallResultMessage
- `transcript` (string) — Full text transcript

**Analysis:**
- `analysis.summary` (string) — AI-generated call summary
- `analysis.structuredData` (object) — Extracted structured data
- `analysis.successEvaluation` (string) — Success assessment
- `analysis.structuredOutput` (object) — Schema-validated output

**Costs (WE DO NOT CAPTURE THIS):**
- `costs[]` — Array of cost items by type:
  - Transport, Transcriber, Model, Voice, Vapi, VoicemailDetection, Analysis, KnowledgeBase
- `costBreakdown` — Aggregated costs:
  - `transport`, `stt`, `llm`, `tts`, `vapi`, `chat`, `total`

**Participants:**
- `assistantId` (string)
- `phoneNumberId` (string)
- `customer` (object) — phone, email
- `destination` — TransferDestinationNumber or TransferDestinationSip
- `squadId` (string) — if multi-assistant

**Resolution:**
- `endedReason` (enum) — Extensive list of call end reasons

**Metadata:**
- `customData` (object) — Custom key-value pairs (includes our organizationId)

**Artifact:**
- `artifact.recording` — Recording data
- `artifact.transcript` — Transcript data

### 2.3 Analytics API (WE DO NOT USE)

**POST /analytics** — Create analytics queries

**Available Metrics:**
- Cost: total, LLM, STT, TTS, VAPI, transport, transcriber, analysis
- Performance: duration, concurrency, minutes used
- Token usage: LLM prompt tokens, completion tokens
- Character usage: TTS character counts

**Grouping Options:**
- By type, assistantId, endedReason, successEvaluation
- By custom variable values

**Time Ranges:**
- Custom start/end (ISO 8601)
- Step intervals: second through millennium
- Default: last 7 days, UTC

**Aggregation:** sum, avg, count, min, max, history

### 2.4 Webhook Events (23 Total, We Handle 5)

| # | Event | We Handle? | Data Available |
|---|-------|-----------|----------------|
| 1 | `call.started` | **YES** | call object |
| 2 | `call.ended` | **YES** | call object, endedReason |
| 3 | `end-of-call-report` | **YES** | transcript, summary, recording, analysis, artifact |
| 4 | `transcript` | **YES** | role, transcriptType, transcript text |
| 5 | `status-update` | **YES** | call object, status |
| 6 | `assistant-request` | No | call object (for dynamic assistant selection) |
| 7 | `tool-calls` | No | call, toolWithToolCallList, toolCallList |
| 8 | `transfer-destination-request` | No | call object |
| 9 | `knowledge-base-request` | No | messages, messagesOpenAIFormatted |
| 10 | `hang` | No | call object |
| 11 | `conversation-update` | No | messages[], messagesOpenAIFormatted[] |
| 12 | `speech-update` | No | status, role, turn |
| 13 | `model-output` | No | output (raw LLM response) |
| 14 | `transfer-update` | No | destination |
| 15 | `user-interrupted` | No | (event only) |
| 16 | `language-change-detected` | No | language |
| 17 | `phone-call-control` | No | request, destination |
| 18 | `voice-input` | No | input |
| 19 | `voice-request` | No | text, sampleRate |
| 20 | `call.endpointing.request` | No | messagesOpenAIFormatted |
| 21 | `chat.created/deleted` | No | chat object |
| 22 | `session.created/updated/deleted` | No | session object |

**Transcript event has fields we don't capture:**
- `isFiltered` — was content filtered?
- `detectedThreats` — threat detection results
- `originalTranscript` — pre-filter transcript
- `transcriptType` — partial vs final

### 2.5 What We Capture vs. What's Available

| Data Point | Available? | We Capture? | Where? |
|-----------|-----------|-------------|--------|
| Call ID | Yes | Yes | vapi_call_logs.vapi_call_id |
| Assistant ID | Yes | Yes | vapi_call_logs.vapi_assistant_id |
| Direction (type) | Yes | Yes | vapi_call_logs.direction |
| Status | Yes | Yes | vapi_call_logs.status |
| Duration | Yes | Yes | vapi_call_logs.duration_seconds |
| Transcript | Yes | Yes | vapi_call_logs.transcript |
| Summary | Yes | Yes | vapi_call_logs.summary |
| Recording URL | Yes | Yes | vapi_call_logs.recording_url |
| Phone Number | Yes | Yes | vapi_call_logs.phone_number |
| Customer Name | Yes (from transcript AI) | Yes | vapi_call_logs.extracted_customer_name |
| End Reason | Yes | Partial | In end_of_call_report JSONB |
| Analysis.structuredData | Yes | **NO** | Not captured |
| Analysis.successEvaluation | Yes | **NO** | Not captured |
| **Costs (per-call)** | Yes | **NO** | Not captured |
| **Cost Breakdown** | Yes | **NO** | Not captured |
| **Messages array** | Yes | Partial | Individual transcript events only |
| Squad ID | Yes | **NO** | Not captured |
| Transfer destination | Yes | **NO** | Not captured |
| Threat detection | Yes | **NO** | Not captured |
| Content filtering | Yes | **NO** | Not captured |
| **Analytics (aggregated)** | Yes (POST /analytics) | **NO** | Not queried |

---

## 3. Tavus Video AI Platform

**Source:** docs.tavus.io (web documentation, fetched 2026-02-18)
**Auth:** API Key (x-api-key header)
**Base URL:** `https://tavusapi.com`

### 3.1 REST API Endpoints

| Resource | Endpoints | We Use? |
|----------|-----------|---------|
| **Conversations** | Create, Get, List, Delete, End | Partial (create for widget) |
| **Personas** | Create, Get, List, Delete, Patch | Partial (create/config) |
| **Replicas** | Create, Get, List, Delete, Rename | Partial (create) |
| **Documents** | Create, Get, List, Delete, Update, Recrawl | **NO** |
| **Videos** | Generate, Get, List, Delete, Rename | **NO** |

### 3.2 Conversation Object (What Tavus Sends)

| Field | Type | We Capture? | Where? |
|-------|------|-------------|--------|
| conversation_id | string | Yes | tavus_sessions.tavus_conversation_id |
| replica_id | string | Yes | tavus_sessions.tavus_replica_id |
| persona_id | string | Yes | tavus_sessions.tavus_persona_id |
| status | string | Yes | tavus_sessions.status |
| created_at | datetime | Yes | tavus_sessions.started_at |
| ended_at | datetime | Yes | tavus_sessions.ended_at |
| duration | number | Yes | tavus_sessions.duration_seconds |
| transcript | string | Yes | tavus_sessions.transcript |
| summary | string | Yes | tavus_sessions.summary |
| replay_url | string | Yes | tavus_sessions.replay_url |
| engagement_score | number | Yes | tavus_sessions.engagement_score |
| outcome | string | Yes | tavus_sessions.outcome |
| custom_data | object | Yes | tavus_sessions.metadata (JSONB) |

### 3.3 Webhook Events (4 Handled, Others Available)

| Event | We Handle? | Data |
|-------|-----------|------|
| `conversation.started` | **YES** | conversation_id, persona_id, replica_id, custom_data |
| `conversation.ended` | **YES** | Full conversation data including transcript, summary, duration, engagement |
| `replica.ready` | Logged only | replica_id |
| `video.ready` | Logged only | video details |

### 3.4 Interaction Events (Not Used)

**Incoming (we could send to Tavus during conversation):**
- Append/Overwrite Conversational Context
- Echo Interaction, Interrupt Interaction
- Text Respond Interaction
- Sensitivity Interaction

**Outgoing (Tavus could send to us):**
- Perception Analysis Event — real-time sentiment/emotion analysis
- Perception Tool Call Event — function calling during video
- Replica Interrupted Event
- Replica Started/Stopped Speaking Event
- Tool Call Event
- User Started/Stopped Speaking Event
- Utterance Event — individual speech segments

### 3.5 Documents API (Not Used — Knowledge Base)

Tavus has a document/knowledge base system:
- Create Document (upload files for persona knowledge)
- Get/List/Delete/Update Documents
- Recrawl Document (refresh website content)

This could be used to feed dealership-specific knowledge to video agents (inventory, pricing, FAQs).

### 3.6 Videos API (Not Used — Async Video Generation)

Tavus can generate videos asynchronously:
- Generate Video (script + replica → video)
- Get Video (includes download_url, stream_url, hosted_url)
- List/Delete/Rename Videos

Potential use: automated video follow-ups, personalized marketing videos.

---

## 4. Local Database (Nexxus DB)

**Total Tables:** 54
**Multi-Tenant:** Yes (RLS on all tables via `app.current_org_id`)
**Key Tables for Data Engineering:**

### 4.1 Primary Data Tables

| Table | Records | Source | Purpose |
|-------|---------|--------|---------|
| leads | ~606 (Serra Honda) | Mixed: excel_upload, vin_import, vapi_voice, tavus_video, manual | Central lead repository |
| vapi_call_logs | ~29 (12 real + 17 test) | VAPI webhooks | Voice call records |
| tavus_sessions | ~1 | Tavus webhooks | Video session records |
| appointments | varies | Manual, VAPI, Tavus, import | Calendar events |
| conversations | varies | VAPI, Tavus, widget, inbox | Chat/call histories |
| messages | varies | VAPI transcripts, widget chat, inbox | Individual messages |
| sync_queue | varies | VAPI/Tavus end-of-call → VIN | Async job queue |
| dealer_pulse_cache | 1 per org | DealerPulseJob (VIN API live) | Cached VIN snapshots |
| vin_reports_cache | varies | Context Router | Cached VIN query results |
| credit_usage | varies | Webhook handlers | Usage tracking |

### 4.2 Source Tag Inventory (leads.source column)

**No CHECK constraint — accepts arbitrary strings. Known values:**

| Source Value | Origin | Count (Serra Honda) |
|-------------|--------|-------------------|
| `excel_upload` | One-off import script | ~400 (66%) |
| `vin_import` / `vin` | VIN Lead Poll job | ~200 (33%) |
| `vapi_voice` / `voice` | VAPI webhook handler | 2 |
| `tavus_video` / `video` | Tavus webhook handler | 1 |
| `manual` | Manual UI entry | 0 |
| `report_upload` | PDF report import | unknown |
| `admin_upload` | Admin bulk import | unknown |
| `widget_chat` | Widget interaction | unknown |
| `sms` | SMS conversation | unknown |
| `email` | Email interaction | unknown |
| `dealerbrain` | AI-created lead | unknown |
| `trigger` | Auto-trigger created | unknown |

### 4.3 Data Flow Diagram

```
External Sources                    Local Database                   Consumer Services
================                    ==============                   =================

VIN Solutions API ──┐
  GET /leads        │   VIN Lead Poll (hourly)
  GET /contact      ├──────────────────────────→ leads table ──────→ DashboardService
                    │                                               LeadInsightService
                    │   DealerPulseJob (4hr)                        DealerBrainService
                    ├──────────────────────────→ dealer_pulse_cache → DealerPulseService
                    │
                    │   Context Router (on-demand)
                    └──────────────────────────→ vin_reports_cache → ContextRouterService


VAPI Platform ──────┐
  Webhooks          │   vapi.ts handler
  (5 event types)   ├──────────────────────────→ vapi_call_logs ──→ VoiceInsightService
                    │                            conversations      DashboardService
                    │                            messages            DealerBrainService
                    └──────────────────────────→ sync_queue ───────→ SyncCoordinator
                                                                    → VIN Solutions API


Tavus Platform ─────┐
  Webhooks          │   tavus.ts handler
  (4 event types)   ├──────────────────────────→ tavus_sessions ──→ VideoInsightService
                    │                            conversations      DashboardService
                    │                            sync_queue          DealerBrainService
                    └──────────────────────────→ appointments


Widget/Chat ────────┐
  User interactions │   Widget routes
                    ├──────────────────────────→ widget_visitors
                    │                            widget_chat_messages
                    └──────────────────────────→ inbox_conversations
                                                 inbox_messages


TextMagic SMS ──────┐
  Inbound messages  │   SMS routes
                    └──────────────────────────→ textmagic_messages
                                                 inbox_conversations


Email (IMAP) ───────┐
  Synced emails     │   EmailService
                    └──────────────────────────→ cached_emails
                                                 sent_emails
```

---

## 5. Gap Analysis: What We Use vs. What's Available

### 5.1 VIN Solutions — Unused Capabilities

| Capability | Endpoint | Business Value | Priority |
|-----------|----------|---------------|----------|
| **Vehicle of Interest details** | GET /vehicles/interest | Know exactly what customer wants (year/make/model/trim) | HIGH |
| **Trade-in details** | GET /vehicles/trade | Know what customer is trading, estimated values | HIGH |
| **Lead status list** | GET /leadStatuses | Validate our status mappings | MEDIUM |
| **Lead status type list** | GET /leadStatusTypes | Understand status hierarchy | MEDIUM |
| **VIN decode** | GET /vehicles/vin | Auto-identify vehicles from VIN numbers | MEDIUM |
| **Contact search (plural)** | GET /gateway/v1/contacts | Bulk customer lookup, dedup | MEDIUM |
| **Lead update** | PUT /leads/id/{id} | Write back status changes | LOW (sensitive) |
| **"CallDetails"** | Unknown (mentioned in intro) | Communication/conversation history | **PROBE** |
| **Lead group categories** | GET /leadGroupCategories | Lead segmentation | LOW |

### 5.2 VAPI — Unused Capabilities

| Capability | Endpoint/Event | Business Value | Priority |
|-----------|----------------|---------------|----------|
| **Analytics API** | POST /analytics | Aggregated cost, duration, success metrics without querying each call | **HIGH** |
| **Per-call costs** | Call object `costs[]` | Real cost tracking per call (we charge fixed rate but pay variable) | **HIGH** |
| **Success evaluation** | analysis.successEvaluation | Did the call achieve its goal? | HIGH |
| **Structured data extraction** | analysis.structuredData | Auto-extract customer intent, vehicle interest, budget | HIGH |
| **Insights** | Insights API endpoints | AI-generated evaluations of call quality | MEDIUM |
| **Conversation updates** | conversation-update event | Real-time message history during call | MEDIUM |
| **Threat detection** | transcript.detectedThreats | Safety/compliance monitoring | MEDIUM |
| **Content filtering** | transcript.isFiltered | Know when content was filtered | LOW |
| **Campaigns** | Campaign API endpoints | Outbound call campaign management | MEDIUM |
| **Evals** | Eval API endpoints | Automated call quality scoring | MEDIUM |
| **List Calls** | GET /calls | Bulk query historical calls with filters | **HIGH** |

### 5.3 Tavus — Unused Capabilities

| Capability | Endpoint/Event | Business Value | Priority |
|-----------|----------------|---------------|----------|
| **Perception Analysis** | Outgoing event | Real-time sentiment/emotion during video | HIGH |
| **Documents/Knowledge Base** | Documents API | Feed inventory/pricing to video agents | HIGH |
| **Async Video Generation** | Videos API | Automated follow-up videos, marketing | MEDIUM |
| **Interaction Events** | Various events | Real-time conversation steering | MEDIUM |
| **Tool Calls** | Tool Call event | Function calling during video (booking, lookup) | MEDIUM |

### 5.4 Context Router Coverage Gap

The Context Router currently covers only **~20% of data consumers**:

| Consumer | Uses Context Router? | Should It? |
|----------|---------------------|-----------|
| Dashboard: Lead Feed | Yes (when enabled) | Yes |
| DealerBrain: query_leads tool | Yes | Yes |
| DealerBrain: get_lead_stats tool | Yes | Yes |
| Dashboard: Health Scores | **NO** (direct SQL) | Yes |
| Dashboard: Lead Cards | **NO** (direct SQL) | Yes |
| Dashboard: Agent Actions | **NO** (direct SQL) | No (local data) |
| Dashboard: Leaderboard | **NO** (direct SQL) | Depends |
| Dashboard: Goal Progress | **NO** (direct SQL) | No (local data) |
| VIN Lead Feed Insight | **NO** (direct SQL) | Yes |
| Lead Aging Insight | **NO** (direct SQL) | Yes |
| Voice Agent Insight | **NO** (direct SQL) | No (local data) |
| Video Data Insight | **NO** (direct SQL) | No (local data) |
| Dealer Pulse | **NO** (own VIN queries) | Separate (already correct) |
| Reports | **NO** (direct SQL) | Maybe |
| Hunches | **NO** (direct SQL) | Maybe |
| DealerBrain: other tools | **NO** (direct SQL) | Some |

---

## 6. 48-Hour Claim: Evidence & Conclusion

### 6.1 The Claim

VIN Solutions told the user that their API would only return data from the last 48 hours. The entire Nexxus data architecture was designed around this limitation.

### 6.2 The Evidence

**Test file:** `filestore/stabilize/VIN_Data/api-48h-test-results.json`
**Test date:** 2026-02-13
**Dealers tested:** Serra Nissan (21044), Tony Serra Ford (21047), Serra Honda (21043)

**Results by time range (all 3 dealers):**

| Query | HTTP Status | Data Returned? | Oldest Lead Found |
|-------|------------|----------------|-------------------|
| No date filter | 200 | Yes (25 per page) | 2023-04-08 (Honda) |
| Last 24h | 200 | Yes | Same day |
| Last 48h | 200 | Yes | 2 days prior |
| Last 7 days | 200 | Yes | 7 days prior |
| Last 14 days | 200 | Yes | 14 days prior |
| Last 30 days | 200 | Yes | 30 days prior |
| Last 90 days | 200 | Yes | 90 days prior |
| **Last 365 days** | **200** | **Yes (25)** | **2025-03-06** (Ford) |
| Status=ACTIVE (no date) | 200 | Yes | **2023-04-08** (~3 years) |
| Status=SOLD (no date) | 200 | Yes | **2017-06-17** (~9 years) |
| Status=LOST (no date) | 200 | Yes | 2025-11-03 |

### 6.3 Conclusion

**The 48-hour claim is DEFINITIVELY FALSE.**

- Data goes back **years**, not hours
- SOLD leads from 2017 are accessible (9 years old)
- ACTIVE leads from 2023 are accessible (3 years old)
- The `totalItems=25` cap in all queries is just the default pagination limit, not a data restriction
- The API supports date filtering but does NOT restrict to recent data

### 6.4 Implications

This changes the data architecture fundamentally:
- We CAN query historical data at any time
- The "archive to local DB at end of day" pattern is unnecessary for data retention
- The VIN API can serve as a live data source for all queries
- Local DB is still valuable for: AI-generated leads, cross-source analytics, offline access, and faster queries
- The Context Router's VIN-first strategy is viable and correct

---

## 6.5 Live API Probe Results (2026-02-18)

**Probe script:** `scripts/probe-apis.ts`
**Raw results:** `filestore/stabilize/api-probe-2026-02-18/probe-results.json`

### VAPI Results: 9/10 Endpoints Successful

| Endpoint | Status | Key Findings |
|----------|--------|-------------|
| GET /call | 200 | Full Call object with 27 top-level fields including `cost`, `costBreakdown`, `analysis`, `artifact` |
| GET /assistant | 200 | 18 assistants returned |
| GET /phone-number | 200 | 7 phone numbers returned |
| POST /analytics (costs) | 201 | 31 daily data points — per-day cost aggregation works |
| POST /analytics (by assistant) | 201 | 13 assistant groups — can group costs/duration by assistant |
| GET /call/{id} | 200 | Complete call with `costBreakdown` (transport/stt/llm/tts/vapi/chat/total + token counts), `analysis` (summary + successEvaluation + structuredData), `artifact` (performanceMetrics, scorecards, pcapUrl, logUrl) |
| GET /insight | 404 | Endpoint doesn't exist at this path |
| GET /eval | 200 | **131 evaluations** — auto-generated call quality scores |
| GET /campaign | 200 | 0 campaigns (feature available but unused) |
| GET /tool | 200 | 15 tools registered |

**Key Discovery — VAPI Call Object Fields We Don't Capture:**
- `cost` (decimal) — actual cost per call
- `costBreakdown` — transport, STT, LLM, TTS, VAPI, chat, total + token counts
- `analysis.successEvaluation` — did the call achieve its goal? ("true"/"false")
- `analysis.structuredData` — auto-extracted structured data from call
- `artifact.performanceMetrics` — call performance data
- `artifact.scorecards` — quality scoring
- `costs[]` — detailed cost breakdown array

### Tavus Results: 6/6 Endpoints Successful

| Endpoint | Status | Key Findings |
|----------|--------|-------------|
| GET /conversations | 200 | 10 conversations returned with full metadata |
| GET /personas | 200 | 10 personas with system_prompt, layers, objectives |
| GET /replicas | 200 | 78 replicas available |
| GET /videos | 200 | 2 videos (async generation capability confirmed) |
| GET /documents | 200 | 0 documents (knowledge base API available but unused) |
| GET /conversations/{id} | 200 | Full conversation object with status, replica_id, persona_id, timestamps |

**Key Discovery — Tavus Conversation Object Fields:**
- `conversation_url` — direct link to video conversation
- `conversational_context` — context string fed to persona
- `layers` — persona configuration layers
- `objectives_id`, `guardrails_id` — safety/goal configuration
- `document_ids`, `document_tags` — knowledge base references

### VIN Solutions Results: 3/38 Endpoints Successful

| Category | Endpoints | Status | Details |
|----------|-----------|--------|---------|
| **Working** | GET /leads, GET /gateway/v1/tenant/user, GET /gateway/v1/organization/dealers | 200 | These 3 work with current auth |
| **Wrong API Version** | /leadStatuses, /leadSources, /leadTypes, /leadGroupCategories, /leadStatusTypes, /vehicles/* | 400 | All return `UnsupportedApiVersion` with v3 header, `ApiVersionUnspecified` with no version |
| **Service Not Found** | /callDetails, /call-details, /communications, /activities, /activity, /notes, /tasks, /appointments, /emails, /conversations, /history, /timeline | 596 | None exist as standalone endpoints |
| **Forbidden (Exist but No Access)** | /gateway/v1/communication, /gateway/v1/activity, /gateway/v1/lead, /gateway/v1/leads, /gateway/v1/contacts | 403 | Endpoints exist but our credentials lack the required scope/permissions |

**Key Discoveries:**

1. **Reference data endpoints need a different API version** — not v3, not "no version". Our lead creation code calls `/leadSources` and `/leadTypes` with v3 headers; they fail silently in try/catch blocks, meaning leads are created without valid leadSource/leadType href values.

2. **Gateway has communication and activity endpoints** — `/gateway/v1/communication` and `/gateway/v1/activity` return 403 (Forbidden), not 404. This means they EXIST but our OAuth credentials lack the required API scope. Getting access would unlock customer communication history and activity feeds.

3. **"CallDetails" doesn't exist** — The VIN API introduction mentions "CallDetails" as a resource, but it returns 596 Service Not Found at every path variation tested. This may be a deprecated resource or behind a different gateway.

4. **Gateway contact endpoints have different auth** — `/gateway/v1/contacts` (plural, search) returns 403 while `/gateway/v1/contact` (singular, by ID) works. Different permission levels.

---

## 6.6 What This Means for Nexxus

### Available Data We're Not Using

| Data | Source | Business Value | Effort |
|------|--------|---------------|--------|
| Per-call costs | VAPI Call object `cost` + `costBreakdown` | Real margin tracking (we charge $0.25/min, actual cost varies) | LOW — just capture from webhook |
| Call success evaluation | VAPI `analysis.successEvaluation` | Know if calls are working | LOW — capture from webhook |
| Structured data extraction | VAPI `analysis.structuredData` | Auto-extract customer intent | LOW — capture from webhook |
| 131 auto-evaluations | VAPI GET /eval | Call quality scoring without manual review | MEDIUM — new API integration |
| Analytics aggregation | VAPI POST /analytics | Dashboard metrics without querying each call | MEDIUM — new API integration |
| Tavus knowledge base | Tavus Documents API | Feed inventory/pricing to video agents | MEDIUM — new API integration |

### Data We Can't Get (Yet)

| Data | Blocked By | What Would Unlock It |
|------|-----------|---------------------|
| VIN reference data (leadStatuses, leadSources, leadTypes) | Wrong API version header | Find correct version (v1? v2?) — may need VIN Solutions support |
| Customer communication history | Gateway /communication returns 403 | Request additional API scope from VIN Solutions |
| Activity/interaction feed | Gateway /activity returns 403 | Request additional API scope from VIN Solutions |
| Bulk contact search | Gateway /contacts returns 403 | Request additional API scope from VIN Solutions |

### Architectural Implications

1. **VAPI webhook handler should capture more fields** — cost, costBreakdown, analysis, artifact are available in the call object but we only store a subset
2. **VIN lead creation is partially broken** — leadSource and leadType resolution fails silently due to API version mismatch
3. **The 48-hour myth is dead** — VIN API can serve historical data going back years, validating the Context Router's VIN-first architecture
4. **Gateway permissions are the real VIN bottleneck** — 5 gateway endpoints exist (communication, activity, lead, leads, contacts) but return 403. A permissions upgrade from VIN Solutions would dramatically expand available data

---

## 7. API Probing Plan

### 7.1 Approach

Following the VIN user guide pattern: authenticate first, then systematically probe each endpoint with minimal, non-destructive requests.

**Principles:**
1. **Read-only operations only** — no POST/PUT/DELETE to production data
2. **One endpoint at a time** — verify response schema matches docs
3. **Capture raw responses** — store in `filestore/stabilize/` for reference
4. **Compare to docs** — flag any discrepancies
5. **Rate limit awareness** — space requests to avoid throttling

### 7.2 VIN Solutions Probing Targets

**Priority 1 — Validate & Discover:**

| # | Probe | Method | Purpose |
|---|-------|--------|---------|
| 1 | GET /leadStatuses?dealerId=21043 | GET | Get complete status list (validate our mappings) |
| 2 | GET /leadStatusTypes?dealerId=21043 | GET | Understand status hierarchy |
| 3 | GET /vehicles/interest?leadId=X&dealerId=21043 | GET | See vehicle of interest schema |
| 4 | GET /vehicles/trade?leadId=X&dealerId=21043 | GET | See trade-in schema |
| 5 | GET /leadGroupCategories?dealerId=21043 | GET | Discover lead categories |
| 6 | GET /gateway/v1/contacts?dealerId=21043 | GET | Test bulk contact search |
| 7 | GET /leads?dealerId=21043&limit=1 | GET | Verify full response schema |

**Priority 2 — Discover Undocumented:**

| # | Probe | Method | Purpose |
|---|-------|--------|---------|
| 8 | GET /callDetails?dealerId=21043 | GET | Test if CallDetails resource exists |
| 9 | GET /communications?dealerId=21043 | GET | Test for communication/conversation endpoint |
| 10 | GET /activities?dealerId=21043 | GET | Test for activity feed endpoint |
| 11 | GET /notes?dealerId=21043 | GET | Test for notes/comments endpoint |
| 12 | GET /tasks?dealerId=21043 | GET | Test for task/follow-up endpoint |

### 7.3 VAPI Probing Targets

| # | Probe | Method | Purpose |
|---|-------|--------|---------|
| 1 | GET /calls?limit=1 | GET | Verify full Call object schema |
| 2 | GET /calls/{id} (recent call) | GET | Get complete call with costs, analysis |
| 3 | POST /analytics (last 30 days, sum costs) | POST | Test analytics query |
| 4 | GET /assistants | GET | List all assistants |
| 5 | GET /phone-numbers | GET | List phone numbers |

### 7.4 Tavus Probing Targets

| # | Probe | Method | Purpose |
|---|-------|--------|---------|
| 1 | GET /conversations | GET | List all conversations |
| 2 | GET /conversations/{id} (recent) | GET | Full conversation object |
| 3 | GET /personas | GET | List all personas |
| 4 | GET /replicas | GET | List all replicas |

### 7.5 Probing Script Template

```typescript
// Template for API probing (read-only, non-destructive)
// Execute via: npx tsx scripts/probe-api.ts

import { VinSolutionsService } from '../server/services/vinSolutionsService';
import { DatabaseStorage } from '../server/db';
import fs from 'fs';

async function probeVinEndpoints() {
  const storage = DatabaseStorage.forSystemJobs();
  const vinService = new VinSolutionsService(storage);
  const integrationId = '125ffd5b-6332-436b-a5d8-9e5527ad20ea'; // Serra Honda
  const dealerId = '21043';

  const results: Record<string, any> = {};

  // Probe 1: Lead Statuses
  try {
    const resp = await vinService.makeAuthenticatedRequest(
      integrationId,
      `/leadStatuses?dealerId=${dealerId}`,
      { method: 'GET' }
    );
    results.leadStatuses = { status: resp.status, data: await resp.json() };
  } catch (e: any) {
    results.leadStatuses = { error: e.message };
  }

  // ... more probes ...

  fs.writeFileSync(
    'filestore/stabilize/api-probe-results.json',
    JSON.stringify(results, null, 2)
  );
}
```

---

## 8. Data-to-Questions Mapping (To Be Completed)

**This section will be populated after:**
1. API probing validates the inventory above
2. User provides dealer pain points and business questions

### 8.1 Template

| Business Question | Data Source(s) | Fields Needed | Available Now? | Confidence |
|------------------|---------------|---------------|----------------|------------|
| "Which leads need follow-up?" | VIN API /leads + status | leadStatus, updatedUtc, contact | Yes | High |
| "How is salesperson X performing?" | VIN API /leads + local metrics | lead count by assignee, close rate | Partial | Medium |
| "What's my pipeline value?" | VIN API + vehicles/interest | lead count by status + vehicle data | Partial | Medium |
| "How effective are AI agents?" | VAPI vapi_call_logs + Analytics | call count, duration, lead extraction rate | Yes | High |
| "How quickly are leads being responded to?" | VIN API (need comms data) | Time between lead creation and first contact | **Unknown** | **Probe needed** |
| "Which lead sources perform best?" | VIN API /leads + /leadSources | Lead source → conversion rate | Yes | High |
| "How's our inventory vs. competitors?" | External data needed | N/A | **No** | N/A |

### 8.2 Data Availability by Question Category

| Category | Available Sources | Gaps |
|----------|------------------|------|
| **Lead Follow-up** | VIN API (lead status, dates), VAPI (call logs) | Need communication/activity history from VIN |
| **Sales Performance** | VIN API (leads by salesperson), local metrics | No revenue/deal value data from VIN Lead API |
| **Pipeline Health** | VIN API (lead counts by status), Dealer Pulse | Need vehicles of interest for pipeline value |
| **Agent Effectiveness** | VAPI (call logs, analytics), Tavus (sessions) | Need VAPI costs for ROI calculation |
| **Response Time** | VIN API (lead dates), VAPI (call times) | Need VIN activity/communication data |
| **Lead Source ROI** | VIN API (leadSources), VAPI (call outcomes) | Need cost data for ROI |
| **Inventory/Competitive** | Not available from current APIs | Need external data sources |
| **Service Performance** | Not available from current APIs | Need service department integration |

---

## Appendix A: VIN Solutions Auth Quick Reference

**From:** `filestore/VinDocs/user_guide.md`

```
Token endpoint: POST https://api.vinsolutions.com/v1.0/token
Body: grant_type=client_credentials&client_id={ID}&client_secret={SECRET}
Response: { "access_token": "...", "token_type": "Bearer", "expires_in": 3600 }
Header for v3 endpoints: Accept: application/vnd.coxauto.v3+json
Header for gateway: Accept: application/json
```

## Appendix B: VAPI Auth Quick Reference

```
Header: Authorization: Bearer {API_KEY}
Base URL: https://api.vapi.ai
All endpoints accept/return: application/json
```

## Appendix C: Tavus Auth Quick Reference

```
Header: x-api-key: {API_KEY}
Base URL: https://tavusapi.com
All endpoints accept/return: application/json
```
