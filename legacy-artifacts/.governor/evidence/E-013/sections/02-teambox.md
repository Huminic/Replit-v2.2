# Section Audit: TeamBox
**Sprint:** E-013
**Route:** /teambox
**Page Component:** client/src/pages/teambox.tsx (1253 lines)
**Sub-menu:** SubMenuManager.tsx (teambox section, lines 483-516)

## What Exists in Code

### Page Structure (teambox.tsx)
- **4-column layout:** Status/channel filters (Col 1) → conversation list (Col 2) → chat thread (Col 3) → customer info (Col 4)
- **Top menu bar:** 3 tabs — Conversations, Phone, Video (data-testid: tab-teambox-conversations, tab-teambox-phone, tab-teambox-video)
- **Channel filter chips:** All, SMS, Email, Web Chat, WhatsApp, Voice — visible in conversations view only
  - Active chip: bg-primary text-primary-foreground border-primary
  - Inactive chip: bg-background text-muted-foreground border-border
  - NOT light blue — uses primary theme color (appears correct per manifest)
- **Phone tab:** Shows VAPI call logs table with date, caller, assistant, duration, transcript link
- **Video tab:** Shows Tavus session logs table with date, visitor, persona, duration, recording/transcript links
- **Transcript modal:** Opens on transcript click with full text + audio link
- **Take Over button:** On automated conversations, lets human claim control
- **Campaign Disconnect:** Stops future campaign messages for this customer
- **Reply input:** Bottom of Col 3, sends via POST
- **Status filters in Col 1:** all, open, assigned, participating, automated, scheduled, followup, pending
- **Conversations also accessible via Col 1 bottom tabs:** Conversations, Tasks, Workflows

### Sub-menu Panel (SubMenuManager.tsx, teambox section)
- **Channels section:** SMS (with count badge), Email (with count), Phone (with count), Video (with count)
  - Each links to /teambox?channel=sms|email|voice|video
- **Tasks section:** Links to /teambox?tab=tasks
- No "Conversations" item in popout (already removed per manifest)
- No Favorites in popout (per page design)

### What's in Code vs Manifest

| Manifest Item | Code Status | Gap? |
|---|---|---|
| Popout: SMS, Email, Phone, Video, Tasks | YES — SubMenuManager lines 502-510 | No gap |
| Conversations removed from popout | YES — not present in popout | No gap |
| Each popout choice goes to filtered list | YES — uses ?channel= and ?tab= URL params | No gap |
| Top menu bar like rest of pages | PARTIAL — has Conversations/Phone/Video tabs but no Favorites button | Needs favorites? |
| Phone shows VAPI logs for store | YES — VAPI call logs table with data-testid phone-calls-table | No gap |
| Phone has transcript links | YES — transcript modal with full text + audio | No gap |
| Video shows Tavus logs with transcript links | YES — Tavus sessions table with recording/transcript links | No gap |
| Filters not light blue | CORRECT — active chips use bg-primary (theme color), not light blue | No gap |
| Easy filter for agent vs human conversations | PARTIAL — status filter has "automated" but no dedicated "human only" filter | Gap — need explicit agent/human toggle |
| Needs top menu with favorites and same popout items | PARTIAL — top menu exists with tabs but no favorites in the top bar | May need adjustment |

### Manifest says TeamBox should show:
All Conversations, Phone Calls, SMS, Video, Webchats, Form Submissions

### Code currently shows:
- Top tabs: Conversations, Phone, Video
- Channel chips (under Conversations): All, SMS, Email, Web Chat, WhatsApp, Voice

"Form Submissions" is not a separate tab or channel filter — forms come in as conversations with channel type. Need to verify if form submissions appear in the conversation list and can be filtered.

## Existing ACs

| AC | Coverage | Quality |
|---|---|---|
| S-2.AC1 | Top horizontal menu bar present | Basic |
| S-2.AC2 | Popout: SMS, Email, Phone, Video, Tasks | Good |
| S-2.AC3 | "Conversations" NOT in popout | Good (negative test) |
| S-2.AC4 | Each popout item opens filtered list | Good |
| S-2.AC5 | Phone tab shows VAPI logs | Good |
| S-2.AC6 | Phone tab has working transcript links | Good |
| S-2.AC7 | Video tab shows Tavus session logs | Good |
| S-2.AC8 | Video tab has transcript/recording links | Good |
| S-2.AC9 | Filter chips NOT light blue | Good (CSS assertion) |
| S-2.AC10 | Manual message send flow | Good |
| S-2.AC11 | Manual message delivered (outbound_log) | Good (BE/DT) |
| S-2.AC12 | STOP/opt-out adds to blacklist | Good (TG-004) |
| S-2.AC13 | No further messages to blacklisted phone | Good (TG-004) |
| S-2.AC14 | Near-real-time within 10s via polling | Basic (TG-010) |
| S-2.AC15 | Human takeover: assign → AI stops | Good |
| S-2.AC16 | Human takeover: un-assign → AI resumes | Good |

## New ACs Needed

| Proposed AC | Priority | Dimension |
|---|---|---|
| Agent vs human conversation filter: toggle/chip that shows only automated OR only human conversations | T2 | FE |
| Form submissions visible in conversation list and filterable | T2 | FE/BE |
| Sub-menu bar matching popout items (SMS, Email, Phone, Video, Tasks) + Favorites — consistent with other pages | T2 | FE |
| VAPI call log shows agent name not raw UUID | T2 | FE |
| VAPI call log shows caller phone number | T2 | FE |
| Message history renders actual chat content when conversation selected — not blank/empty | T1 | FE/BE |
| Take Over works for in-progress AI chats (SMS, webchat, etc.) — human picks up, AI stops responding | T1 | FE/BE |
| Service campaign conversations appear in TeamBox (reverse 2-way SMS) | T1 | FE/BE |
| Delete conversation: context menu or action to remove conversation from list and API | T2 | FE/BE |

## Operator Notes
- Needs sub-menu bar along top with favorites, matching popout items — consistent with other pages
- Operator has NOT been able to see actual chat messages in message history — this is a potential T1 bug
- Take Over for in-progress AI chats (text, webchat) must work — AI stops, human picks up
- Service campaign chats are reverse 2-way SMS — need to verify they appear in TeamBox
- Need ability to delete conversations

## Section Description (DRAFT — for operator edit)

**TeamBox is the unified inbox.** All customer communications converge here — SMS, email, web chat, voice calls, video sessions. The page uses a 4-column layout: status/channel filters on the left, scrollable conversation list, full chat thread in the center, and customer info panel on the right.

The top menu has 3 tabs: **Conversations** (the main inbox with channel filter chips — All, SMS, Email, Web Chat, WhatsApp, Voice), **Phone** (VAPI call logs table with transcript modal), and **Video** (Tavus session logs with recording/transcript links).

Key features: **Take Over** lets a human claim an automated conversation from the AI agent. **Campaign Disconnect** stops all future campaign messages to that customer. **Manual reply** lets staff compose and send messages. Status filters in the left column let you view by: open, assigned, participating, automated, scheduled, followup, pending.

The sidebar popout has: SMS, Email, Phone, Video (each with conversation count badges), and Tasks. "Conversations" has been removed from the popout as requested.

**What needs attention:** Agent vs human conversation filter doesn't exist as a dedicated toggle — you can filter by "automated" status but there's no "human only" option. Form submissions may not appear as a distinct filterable channel. VAPI call logs may show raw UUIDs instead of agent names. The top menu doesn't have a favorites button like other pages.
