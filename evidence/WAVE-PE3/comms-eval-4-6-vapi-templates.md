# Comms Eval 4 & 6: VAPI Voice Downstream + Message Template Audit

**Date:** 2026-04-07
**Evaluator:** Automated agent (Opus 4.6)
**Scope:** VAPI transcript verification, VIN lead verification, notification email audit, and full message template audit

---

## Eval 4: VAPI Voice Downstream Verification

### Step 1: Voice Transcript Verification

**4 voice conversations found in database** (ordered by most recent):

#### Call 1 (conv `2daddd11`): Phone +19012038267
```
**Call Summary:**
Caroline from Sarah Automotive introduced herself as a car buying assistant and asked
the caller about their interests to schedule a test drive. The caller expressed interest
in a 2024 Honda Civic and inquired about test drive availability for the following day
around 2 PM.

**Transcript:**
User: Hi. Thanks for calling Sarah Automotive. My name is Caroline, your personal car
buying assistant. Can you tell me a little about what you are looking for so I can get
you scheduled for a test drive?
AI: Hi, Caroline. I'm interested in scheduling a test drive for the 20 24 Honda Civic.
Do you have availability tomorrow around 2 PM?
```

#### Call 2 (conv `d4a2fc69`): Phone +18392729080
```
**Call Summary:**
The call began with an AI assistant from Sarah Automotive offering to help schedule a
test drive. The user expressed interest in test driving a 2024 Honda Civic and asked
about availability for tomorrow around 2 PM before the call abruptly ended.

**Transcript:**
AI: Hi. Thanks for calling Sarah Automotive. My name is Caroline, your per car buying
assistant. Can you tell me a little about what you are looking for so I can get you
scheduled for a test drive?
User: Hi, Caroline. I'm interested in scheduling a test drive for the 20 24 Honda Civic.
Do you have availability tomorrow around 2 PM?
AI: Thank
```

#### Call 3 (conv `fc02895c`): Phone +15559999999 (test)
```
**Call Summary:**
Customer requested oil change appointment.

**Transcript:**
AI: Hello, how can I help? User: I need an oil change.
```

#### Call 4 (conv `820388e4`): Phone +15551234567 (test probe)
```
**Call Summary:**
Test probe call

**Transcript:**
Agent: Hello. Customer: Test.
```

### Transcript Coherence Assessment

| Check | Result | Details |
|-------|--------|---------|
| Transcript coherent? | PARTIAL | Real calls coherent but incomplete (Call 2 cut off at "Thank") |
| Role labels correct? | MISMATCH | Call 1 has User/AI labels reversed — "User" says Caroline's greeting, "AI" is the caller. This is a VAPI transcript labeling inversion. |
| Appointment data extracted? | YES | 2024 Honda Civic, tomorrow 2 PM |
| Dealership name correct? | **MISMATCH** | Caroline says "Sarah Automotive" — should be "Serra Honda". This is a VAPI assistant config issue (assistant ID 90a876c0-0f11-4424-abfe-9ac82b264d88 has wrong dealership name). |

**ISSUE: "Sarah Automotive" vs "Serra Honda"**
- Caroline's VAPI assistant is configured to say "Sarah Automotive" instead of "Serra Honda"
- This is a VAPI-side configuration issue (the assistant's prompt/first message on the VAPI dashboard says "Sarah Automotive")
- The DB agent record has organization_id correctly pointing to Serra Honda
- Fix required: Update VAPI assistant prompt for assistant ID `90a876c0-0f11-4424-abfe-9ac82b264d88`

### Step 2: VIN Lead Verification

**warehouse_leads table: 5 most recent leads**

All leads have `customer_name = NULL`, `customer_email = NULL`, `customer_phone = NULL`.

| Field | Value |
|-------|-------|
| vehicle_of_interest | VIN Solutions API URLs (e.g., `https://api.vinsolutions.com/vehicles/interest/id/...`) |
| vin_status | ACTIVE_WAITING_FOR_PROSPECT_RESPONSE, ACTIVE_ACTIVE_LEAD, BAD_BAD_OR_NO_CONTACT_INFORMATION |
| lead_source | VIN Solutions API URLs |
| created_at | 2026-04-07 06:35:59 (all 5 within same second) |

**ISSUE: VIN Leads Missing Customer Data**
- All 5 recent warehouse_leads have NULL customer_name, customer_email, and customer_phone
- vehicle_of_interest stores raw VIN API URLs instead of resolved vehicle descriptions
- These appear to be synced from VIN Solutions but the customer PII was not dereferenced from the API URLs
- The voice calls (Elliott/James Richardson) did NOT produce warehouse_lead entries with their name/phone

### Step 3: Notification Email Verification

**Recent outbound email log entries:**

| Time | Recipients | Subject | Status |
|------|-----------|---------|--------|
| 21:19:51 | orgadmin@serrahonda.com, executive@serrahonda.com, salesmanager@serrahonda.com, serra_honda@huminic.ai, durran.cage@cageautomotive.com, duane.wells@huminic.ai | Serra Honda Has a New AI Voice Lead! | sent |
| 21:19:51 | serra_nissan@huminic.ai, durran.cage@cageautomotive.com, duane.wells@huminic.ai | Serra Nissan Has a New AI Voice Lead! | sent |
| 07:55:32 | (not logged) | Serra Honda Has a New AI Voice Lead! | sent |

**Recipient Analysis for Serra Honda notification:**

| Recipient | Type | Real or Seed? |
|-----------|------|---------------|
| orgadmin@serrahonda.com | Level 3 org_admin (James Chen) | **SEED** — fake serrahonda.com domain |
| executive@serrahonda.com | Level 3 executive (Vanessa Torres) | **SEED** — fake serrahonda.com domain |
| salesmanager@serrahonda.com | Level 3 sales_manager (Derek Wilson) | **SEED** — fake serrahonda.com domain |
| serra_honda@huminic.ai | Level 3 org_admin (Serra Honda Admin) | **TEST ACCOUNT** — huminic.ai test |
| durran.cage@cageautomotive.com | Level 2 partner_admin (Durran Cage) | **REAL** — Cage Automotive partner admin |
| duane.wells@huminic.ai | Level 1 super_admin (Duane K. Wells) | **REAL** — system owner |

**ISSUE: Mixed Real and Seed Recipients**
- 3 of 6 recipients use `@serrahonda.com` — a domain that likely does not exist (seed data)
- These emails are sent via Resend and will bounce or be undeliverable
- The exclusion filter only removes `admin@` prefix and `@nexxus.com` / `@test.com` patterns
- It does NOT filter out seed accounts like `orgadmin@serrahonda.com`
- Real emails (duane.wells@huminic.ai, durran.cage@cageautomotive.com) ARE being sent correctly

**Notification Email Template (from code):**
- Subject: `[emoji] {orgName} Has a New AI Voice Lead!`
- From: `Nexxus Connect <notifications@huminic.ai>`
- Body includes: org name, assistant name, customer phone, call type, duration, ended reason, VIN status, summary, transcript, recording link
- Template is well-structured HTML with gradient header, detail table, summary block, transcript block

### Step 4: TeamBox Voice Thread

**Verified via existing screenshots (2026-04-07):**

- `teambox-phone-loaded.png`: Shows VAPI Call Logs table with multiple Caroline calls from +18392729080
- `teambox-transcript.png`: Shows expanded transcript dialog with full call content
- `.playwright-mcp/page-2026-04-07T09-09-42-911Z.yml`: Accessibility snapshot confirms all call rows visible with "Sarah Automotive" in summaries

| Check | Result |
|-------|--------|
| Phone tab shows voice calls | PASS |
| Transcript button visible | PASS |
| Transcript dialog opens | PASS |
| Full transcript readable | PASS |
| "Sarah Automotive" visible in summaries | CONFIRMED (BUG) |
| Recording link available | PASS (Listen to Recording link present) |

---

## Eval 6: Message Template Audit

### Template 1: Lead Follow-Up SMS

**Location:** `server/services/scheduler.ts:189`

**Actual template:**
```
Hi {customerFirstName}, this is {agentName} from {dealerStoreName}. I just wanted to
follow up with you to see if you had any questions and if your experience with our
dealer so far has been a good one. Please let me know if I can be of any assistance
or if you have any feedback.
```

**Documented template:**
```
Hi {customerFirstName}, this is {agentName} from {dealerStoreName}. I just wanted to
follow up with you to see if you had any questions...
```

**Verdict:** MATCH (documented template is abbreviated but the full version matches)

**Evidence from outbound_log (real sent SMS):**
```
Hi Ronteira, this is Caroline from Serra Honda. I just wanted to follow up with you
to see if you had any questions and if your experience with our dealer so far has been
a good one. Please let me know if...
```
Substitution working correctly: `{customerFirstName}` -> "Ronteira", `{agentName}` -> "Caroline", `{dealerStoreName}` -> "Serra Honda"

**Variable format note:** Uses `{singleBrace}` format (not `{{doubleBrace}}`). This is correct for the scheduler template engine.

### Template 2: Auto-Greeting (SMS on new conversation)

**Location:** `agents` table, `auto_greeting` column + `server/routes/conversations.ts:59-66`

**Caroline's auto_greeting (from DB):**
```
Hi {{customerName}}! This is {{agentName}} from {{dealershipName}}. Thank you for your
interest -- I'd love to help you find the perfect vehicle. What are you looking for?
```

**Substitution engine (conversations.ts:63-66):**
```javascript
greeting.replace(/\{\{customerName\}\}/g, conv.customerName || "there")
         .replace(/\{\{dealershipName\}\}/g, org?.name || "our dealership")
         .replace(/\{\{agentName\}\}/g, greetingAgent.name || "your assistant")
```

**Evidence from outbound_log (real sent auto-greeting):**
```
Hi +15551234567! This is Caroline from Serra Honda. Thank you for your interest --
I'd love to help you find the perfect vehicle. What are you looking for?
```

**ISSUE:** When customerName is not set, it falls back to the raw phone number (`+15551234567`) rather than "there". The code says `conv.customerName || "there"` but the evidence shows the phone number was used. This suggests `customerName` was set to the phone number string.

**Verdict:** PARTIAL MATCH — template correct, but fallback behavior puts phone number in greeting instead of "there"

### Template 3: Campaign SMS Default Template

**Location:** `server/outbound.ts:576`

**Actual template:**
```
Hello {{customerName}}, this is a message from {{dealershipName}}.
```

**Substitution engine (outbound.ts:496-505):**
```javascript
template
  .replace(/\{\{customerName\}\}/g, customerName)        // firstName + lastName or "valued customer"
  .replace(/\{\{firstName\}\}/g, recipient.firstName || "valued customer")
  .replace(/\{\{lastName\}\}/g, recipient.lastName || "")
  .replace(/\{\{dealershipName\}\}/g, dealershipName || "our dealership")
  .replace(/\{\{vehicleYear\}\}/g, recipient.vehicleYear || "")
  .replace(/\{\{vehicleModel\}\}/g, recipient.vehicleModel || "")
  .replace(/\{\{vin\}\}/g, recipient.vin || "")
```

**Evidence from outbound_log (Nancy service campaign SMS):**
```
Hi Duane, this is Nancy from Serra Honda Service. Your vehicle may be due for routine
maintenance. Would you like to schedule a service appointment? Reply YES to confirm
or call us at (833) 978-5374.
```

This is a CUSTOM template (not the default) — campaigns can override the default. The default fallback is generic but functional.

**Verdict:** MATCH — default template exists as documented. Custom campaign templates override it correctly.

### Template 4: STOP Confirmation SMS

**Location:** `server/outbound.ts:58`

**Actual template:**
```
You have been unsubscribed from ${orgName} messages. Reply START to re-subscribe.
```

**Verdict:** Present and functional. Uses template literal substitution (not handlebars).

### Template 5: Password Reset Email

**Location:** `server/routes/auth.ts:434-438`

**Actual template:**
```
From: Nexxus Connect <notifications@huminic.ai>
Subject: Password Reset -- Nexxus Connect
Body:
  Hi {firstName},
  Click the link below to reset your password. This link expires in 1 hour.
  {resetUrl}
  If you did not request this, ignore this email.
```

**Verdict:** MATCH — standard password reset email with proper security language.

### Template 6: Welcome Email (User Creation)

**Location:** `server/routes/users.ts:103-112`

**Actual template:**
```
From: Nexxus Connect <no-reply@huminic.app>
Subject: Welcome to {orgName} on Nexxus Connect
Body:
  Welcome to {orgName}!
  Hi {firstName},
  Your account has been created for {orgName} by {creatorFirstName} {creatorLastName}.
  You can log in using your email address: {email}
  Please change your password after your first login for security purposes.
  Welcome aboard!
```

**Note:** Uses `no-reply@huminic.app` (different from other emails which use `notifications@huminic.ai`).

**Verdict:** MATCH — appropriate onboarding email.

### Template 7: Invite Email

**Location:** `server/routes/users.ts:356-367`

**Actual template:**
```
From: Nexxus Connect <no-reply@huminic.app>
Subject: You've been invited to {orgName}
Body:
  Welcome to {orgName}!
  {inviterFirstName} {inviterLastName} has invited you to join their organization.
  Your temporary credentials:
    Email: {email}
    Password: {tempPassword}
  Please change your password after your first login.
```

**ISSUE:** Temporary password is sent in plaintext via email. This is standard for invite flows but should be noted.

**Verdict:** MATCH — functional invite email.

### Template 8: Lead Notification Email (VAPI/Tavus)

**Location:** `server/routes/webhooks.ts:286-405`

**Actual template (generateLeadEmailHTML):**
```
Subject: [emoji] {orgName} Has a New AI Voice Lead!  (or "New Video Session Lead!")
From: Nexxus Connect <notifications@huminic.ai>

Sections:
  - Header: gradient banner with org name + "Has a New AI Voice Lead!"
  - Intro: "Congratulations! Your AI assistant {assistantName} just completed a call
    with a potential customer."
  - Lead Summary: call summary text
  - Details table: Assistant, Customer Phone, Call Type, Duration, Timestamp,
    Ended Reason, VIN Solutions status
  - Recording link button (if available)
  - Full Transcript section (monospace, scrollable)
  - Footer: "This is an automated notification from Nexxus Connect..."
```

**Verdict:** MATCH — comprehensive notification email with all relevant call details.

### Template 9: Outbound Call System Prompt Override

**Location:** `server/outbound.ts:194-197`

**Actual template:**
```
You are making an OUTBOUND call on behalf of ${dealershipName}. Campaign: ${campaignName}.
Goal: ${goal}. The customer's name is ${customerName}.
```

**Verdict:** Present and functional for outbound campaign calls via VAPI.

---

## Check 5: Lead Notification Email Recipients

### Serra Honda Admin Hierarchy

| Name | Email | Role | Level | Real/Seed |
|------|-------|------|-------|-----------|
| James Chen | orgadmin@serrahonda.com | org_admin | 3 | SEED |
| Vanessa Torres | executive@serrahonda.com | executive | 3 | SEED |
| Derek Wilson | salesmanager@serrahonda.com | sales_manager | 3 | SEED |
| Serra Honda Admin | serra_honda@huminic.ai | org_admin | 3 | TEST |
| Marcus Webb | partner@nexxus.com | partner_admin | 2 | SEED (filtered by @nexxus.com) |
| Duane Wells | duanekwells@gmail.com | partner_admin | 2 | REAL |
| Durran Cage | durran.cage@cageautomotive.com | partner_admin | 2 | REAL (via hierarchy) |
| Duane K. Wells | duane.wells@huminic.ai | super_admin | 1 | REAL |

**Exclusion filter analysis:**
- `admin@nexxus.com` — correctly excluded (starts with "admin@")
- `partner@nexxus.com` — correctly excluded (ends with "@nexxus.com")
- `orgadmin@serrahonda.com` — NOT excluded (does not match any filter pattern)
- `executive@serrahonda.com` — NOT excluded
- `salesmanager@serrahonda.com` — NOT excluded
- `duanekwells@gmail.com` — NOT excluded but also not in the actual sent list (level 2 but in Serra Honda org, not parent)

**ISSUE:** The `@serrahonda.com` seed accounts are NOT filtered and receive real Resend API calls. These likely bounce, wasting Resend quota and potentially affecting sender reputation.

---

## Summary of Issues Found

| # | Severity | Issue | Location |
|---|----------|-------|----------|
| 1 | **HIGH** | Caroline says "Sarah Automotive" instead of "Serra Honda" | VAPI assistant config (ID: 90a876c0-0f11-4424-abfe-9ac82b264d88) |
| 2 | **MEDIUM** | VIN warehouse_leads have NULL customer data — PII not dereferenced from API URLs | server/sync.ts / storage.ts |
| 3 | **MEDIUM** | Notification emails sent to seed accounts (@serrahonda.com) that bounce | server/routes/webhooks.ts:230-236 exclusion filter |
| 4 | **LOW** | Auto-greeting uses phone number instead of "there" when customerName is phone string | server/routes/conversations.ts:64 |
| 5 | **LOW** | Transcript role labels inverted on some calls (User/AI swapped) | VAPI webhook transcript parsing |
| 6 | **INFO** | Welcome/invite emails use different from address (no-reply@huminic.app) than notifications (notifications@huminic.ai) | Inconsistent but not broken |
| 7 | **INFO** | Invite email sends temp password in plaintext | Standard but worth noting for security review |

## Template Match Summary

| Template | Location | Status |
|----------|----------|--------|
| Lead follow-up SMS | scheduler.ts:189 | MATCH |
| Auto-greeting SMS | agents.auto_greeting + conversations.ts | PARTIAL MATCH (phone fallback issue) |
| Campaign SMS default | outbound.ts:576 | MATCH |
| STOP confirmation | outbound.ts:58 | MATCH |
| Password reset email | auth.ts:434 | MATCH |
| Welcome email | users.ts:103 | MATCH |
| Invite email | users.ts:356 | MATCH |
| Lead notification email | webhooks.ts:286 | MATCH |
| Outbound call prompt | outbound.ts:194 | MATCH |

## Screenshots Referenced

- `teambox-phone-loaded.png` — TeamBox Phone tab with VAPI call logs
- `teambox-transcript.png` — Expanded transcript dialog showing full call content
- `.playwright-mcp/page-2026-04-07T09-09-42-911Z.yml` — Accessibility snapshot of TeamBox Phone tab
