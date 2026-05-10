# S2 — I-245 AI PATCH bypass — Delta 2 endpoint behavioral probe

**Wave:** 9-Sec
**Chunk:** S2
**Item:** I-245 AI system-prompt PATCH bypass
**Fix commit:** `94e9f70`
**Build/reload:** `npm run build` + `pm2 reload nexxus-app --update-env` at 2026-05-10T19:03:39Z
**Probe time:** 2026-05-10T19:05Z

---

## Setup

| | Value |
|---|---|
| Endpoint | `PATCH /api/settings/org` |
| Auth | serra_honda@huminic.ai (org_admin, roleLevel=3) |
| Fix gate | `server/lib/aiSettingsGuard.ts:37` `stripAiFieldsForLowerRoles` called from `server/routes/settings.ts:28-31` |
| Allowlist (gated) fields | `aiModel`, `systemPrompt`, `chatInstructions` |

**Mutation safety:** A single benign field (`timezone`) was changed and immediately restored. No real provider sends triggered.

---

## Pre-state (baseline)

```json
{"adfBrand":"Honda","adfEmail":"leads@serrahonda.co","timezone":"America/Chicago","adfLeadSource":"Dealers WebSite","textmagicPhone":"+18338935694","triggersEnabled":true,"triggerTestPhones":["+14126546500"],"vapiPhoneNumberId":"6e524330-8253-4e09-bf34-1892ebb393b5","checkInDelayMinutes":1440,"checkInTriggerEnabled":true,"afterHoursTriggerEnabled":false}
```

No `aiModel` / `systemPrompt` / `chatInstructions` keys present. (Ideal pre-state — any leakage of those keys post-PATCH is a clean signal.)

## Probe — PATCH with EVIL AI fields + benign timezone change

```
$ curl -sS -X PATCH "http://localhost:5000/api/settings/org" \
    -H "Authorization: Bearer <serra-honda-admin-token>" \
    -H "Content-Type: application/json" \
    -d '{"systemPrompt":"EVIL-INJECTION","chatInstructions":"EVIL-CHAT","aiModel":"EVIL-MODEL","timezone":"America/Detroit"}'

HTTP 200
{"adfBrand":"Honda","adfEmail":"leads@serrahonda.co","timezone":"America/Detroit","adfLeadSource":"Dealers WebSite","textmagicPhone":"+18338935694","triggersEnabled":true,"triggerTestPhones":["+14126546500"],"vapiPhoneNumberId":"6e524330-8253-4e09-bf34-1892ebb393b5","checkInDelayMinutes":1440,"checkInTriggerEnabled":true,"afterHoursTriggerEnabled":false}
```

**Key observations:**
- No `systemPrompt`, no `chatInstructions`, no `aiModel` keys in response — **stripped before merge**.
- `timezone` changed to `America/Detroit` (allowed field, passed through).

## Independent DB-level check

```sql
SELECT settings FROM organizations WHERE id = '24d64f99-ba04-4b43-af35-fd06f555ac86';
```

Result `settings` JSON contained NO `EVIL-INJECTION`, `EVIL-CHAT`, or `EVIL-MODEL` strings. Verified programmatically:

```
Contains 'EVIL-INJECTION': false
Contains 'EVIL-CHAT':      false
Contains 'EVIL-MODEL':     false
```

## Restore

```
$ curl -sS -X PATCH "http://localhost:5000/api/settings/org" -H "..." -d '{"timezone":"America/Chicago"}'
HTTP 200
```

Verified post-restore GET returned `timezone:"America/Chicago"` and full baseline shape — no residual mutation, no leftover EVIL strings.

---

## Verdict

**PASS.** Pre-fix, the EVIL strings would have spread into `org.settings` and corrupted the AI assistant's behavior for serra-honda. Post-fix, the field-allowlist gate (`stripAiFieldsForLowerRoles`) silently drops the AI-config fields for `roleLevel > 2` while letting allowed fields (e.g., `timezone`) through. DB confirmed clean. State restored to pre-probe baseline.
