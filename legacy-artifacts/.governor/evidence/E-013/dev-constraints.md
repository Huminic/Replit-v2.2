# E-013 Dev Harness Constraints — Per Section
**Date:** 2026-03-26
**Purpose:** Scope limits, declared files, and permissions for Dev agents working on each section sprint.

---

## Universal Constraints (apply to ALL section sprints)

1. **No infrastructure changes.** Dev agents cannot modify DNS, Caddy, PM2, ports, or system services.
2. **No governance file edits.** sprints.json, issues.md, backlog.md, acceptance_criteria.md, CLAUDE.md are Captain-only.
3. **No cross-project file access.** Dev works within nexxus2.2_replit only.
4. **Feature branch required.** All work on a branch named `section/{section-name}`.
5. **Test file must exist.** The authoritative .spec.ts for the section must be updated with any new ACs.
6. **No new dependencies** without Captain approval.
7. **Preserve existing behavior.** Unless a change is explicitly in the AC, don't break what works.
8. **External APIs through central-mcp only.** No direct API calls to TextMagic, VAPI, Tavus, etc.

---

## Per-Section Declared Files

### S-1: AI Chat
**Scope:** Chat page and sidebar flyout
**Files:**
- `client/src/pages/main.tsx` — main chat page
- `client/src/hooks/useStreamingChat.ts` — chat streaming hook
- `client/src/components/layout/SubMenuManager.tsx` — ai-chat section only (lines ~384-470)
- `tests/e2e/s1-ai-chat.spec.ts` — test file
**Off-limits:** Other page files, server routes (unless fixing a chat API bug documented in AC)

### S-2: TeamBox
**Scope:** Unified inbox, conversations, phone/video logs
**Files:**
- `client/src/pages/teambox.tsx`
- `client/src/components/layout/SubMenuManager.tsx` — teambox section only
- `tests/e2e/s2-teambox.spec.ts`
**Off-limits:** Campaign execution code, outbound.ts (except reading for verification)

### S-3: Sales
**Scope:** Sales dashboard, agents, insights, calendar
**Files:**
- `client/src/pages/sales.tsx`
- `client/src/components/layout/SubMenuManager.tsx` — sales section only
- `tests/e2e/s3-sales.spec.ts`
**Special:** Recent Activity feed (lines 591-603) needs API replacement — may need server route

### S-4: Service
**Scope:** Service campaigns, agents, insights, calendar
**Files:**
- `client/src/pages/service.tsx`
- `client/src/components/layout/SubMenuManager.tsx` — service section only
- `tests/e2e/s4-service.spec.ts`
**Special:** Campaign execution touches outbound.ts — read-only for verification, changes need Captain approval

### S-5: Marketing
**Scope:** Marketing dashboard, agents, studio, insights
**Files:**
- `client/src/pages/marketing.tsx`
- `client/src/lib/marketing-agents.ts` — client-side agent definitions
- `client/src/components/layout/SubMenuManager.tsx` — marketing section only
- `tests/e2e/s5-marketing.spec.ts`
**Off-limits:** Server-side agent creation (marketing agents are client-side only)

### S-6: Manage
**Scope:** Management page — insights, hunches, system log, user chats, billing
**Files:**
- `client/src/pages/management.tsx`
- `client/src/components/BillingDashboard.tsx` (if it exists as separate component)
- `client/src/components/layout/SubMenuManager.tsx` — management section only
- `tests/e2e/s6-manage.spec.ts`
**Special:** User Chats requires new implementation (currently placeholder). Billing requires FlexPrice wiring (I-105).

### S-7: System / Profile / Top Icons
**Scope:** Settings page, profile page, top bar
**Files:**
- `client/src/pages/settings.tsx`
- `client/src/pages/profile.tsx`
- `client/src/components/layout/TopBar.tsx`
- `client/src/components/layout/SubMenuManager.tsx` — system + profile sections
- `tests/e2e/s7-system-profile.spec.ts`
**Special:** Largest section (settings.tsx is 4091 lines). Changes must be surgical. TopBar label changes ("Take a Tour" → "Reset Tour", remove Billing link) are small.

### S-8: Landing Pages / Widgets
**Scope:** Public landing pages, universal widget
**Files:**
- `client/src/pages/widget-landing.tsx`
- `client/src/lib/widget-types.ts`
- `tests/e2e/s8-landing-widgets.spec.ts`
**Special:** Web Call behavior change (browser call → outbound VAPI) requires server-side work. Widget appearance theming requires connecting org config to landing page rendering.

---

## Permissions Matrix

| Action | Allowed? |
|---|---|
| Read any file in nexxus2.2_replit | YES |
| Edit declared files for current section | YES |
| Edit shared components (SubMenuManager) — own section only | YES |
| Edit server routes for AC-documented fixes | YES with Captain approval |
| Create new component files | YES if needed for AC |
| Delete files | NO — archive only, Captain approval |
| Edit .env or deployment config | NO |
| Run npm install | NO — request through Captain |
| Run tests locally | YES |
| Push to feature branch | YES |
| Merge to main | NO — Ghost gate required |
