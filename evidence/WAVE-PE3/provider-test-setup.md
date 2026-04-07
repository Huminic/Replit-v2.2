# Provider Test Setup — WAVE-PE3 Research

**Date:** 2026-04-07
**Purpose:** Catalog VAPI, TextMagic, and Tavus infrastructure readiness for production eval

---

## 1. Elliott Test Script

### Location (primary — current project)
`/home/ubuntu/Claude-store/nexxus2.2_replit/utilities/elliott-test.ts`

### What It Does
Elliott is a VAPI test assistant that makes outbound phone calls to any of the 6 store AI agents. It:
- Uses the VAPI `/call/phone` API to initiate an outbound call
- Elliott (assistant `c303d993-bf42-4784-a8cb-247477b1cbdd`) calls the store's VAPI phone number
- The store's AI agent answers and has a conversation with Elliott
- The end-of-call webhook fires, creating a conversation in TeamBox and sending email notification
- Supports `--wait` flag to poll for call completion and display transcript, duration, cost, and summary

### Usage
```bash
npx tsx utilities/elliott-test.ts --store "Serra Honda"
npx tsx utilities/elliott-test.ts --store "Serra Honda" --wait
```

### Elliott IDs
| Property | Value |
|----------|-------|
| Assistant ID | `c303d993-bf42-4784-a8cb-247477b1cbdd` |
| Phone Number ID | `a85a9397-25cb-4e35-b784-05cfa5a926b2` |

### Other Elliott Script Locations (historical reference)
| Location | Target | Notes |
|----------|--------|-------|
| `nexxus2.2/tests/scripts/elliott-calls-christine.ts` | Christine (d019ff3d) | Simulated dealer agent test |
| `nexxus/scripts/elliott-test-calls.ts` | Caroline + Elizabeth | Older version, calls two stores sequentially |
| `nexxus/test-scripts-archive/elliott-calls-elizabeth.ts` | Elizabeth | Uses Daria's phone ID (8a68c182) for outbound |
| `nexxus/test-scripts-archive/elliott-calls-user.ts` | Operator's phone (+14126546500) | Direct user call test |
| `nexxus/test-scripts-archive/elliott-config.json` | Config file | Older phone ID (c0517c1f) |
| `central-mcp/scripts/elliott-calls-andor.ts` | Andor (+14125209388) | Tool trigger test (get_current_time, openclaw, clickup) |

---

## 2. VAPI Configuration

### Environment Keys
| Key | Status |
|-----|--------|
| `VAPI_PRIVATE_KEY` | Set (`36bbcd04-eaae-4a28-9331-e404a50e618b`) |
| `VAPI_PUBLIC_KEY` | Set (`4bc381aa-dcdf-4a71-8911-9139fe2a2120`) |
| `VITE_VAPI_PUBLIC_KEY` | Set (same as public key) |

### VAPI Voice Agents (from seed.ts)
| Agent | Store | Phone | VAPI Assistant ID | Department |
|-------|-------|-------|-------------------|------------|
| Caroline | Serra Honda | +1 (901) 203-8267 | `90a876c0-0f11-4424-abfe-9ac82b264d88` | Sales |
| Magnolia | Serra Nissan | +1 (256) 862-3318 | `2203b188-a549-417b-ab33-075766e1b5c1` | Service |
| Georgia | Tony Serra Ford | +1 (256) 459-9707 | `ad478eb2-6602-42c5-9732-3d4648013307` | Sales |
| Elizabeth | Hyundai of Columbia | +1 (901) 203-9398 | `6d12a8fa-0ed0-4ec1-bfdb-e84587ff86c0` | Marketing |
| Savannah | Ford of Columbia | +1 (931) 369-2815 | `6216451c-e0a3-43d0-aece-ae382bd8df25` | Service |

### VAPI Phone Numbers in Elliott Script (mapped to same agents)
| Store | Number | Agent |
|-------|--------|-------|
| Serra Honda | +19012038267 | Caroline |
| Serra Service | +19014361271 | Nancy (service line) |
| Serra Nissan | +12568623318 | Magnolia |
| Tony Serra Ford | +12564599707 | Georgia |
| Ford of Columbia | +19313692815 | Savannah |
| Hyundai of Columbia | +19012039398 | Elizabeth |

**Note:** The "Serra Service" number (+19014361271 / Nancy) is in the Elliott script but does NOT appear in seed.ts as a voice agent with a VAPI assistant ID. Nancy Gaston is seeded as a chat-only agent. This number may be configured directly in VAPI without a matching DB record.

---

## 3. TextMagic Configuration

### Environment Keys
| Key | Status |
|-----|--------|
| `TEXTMAGIC_*` | **NOT SET in .env** |
| `DEFAULT_TEXTMAGIC_PHONE` | Not in .env (code defaults to `18338096836`) |

### TextMagic in Code
- `server/services/scheduler.ts` sets a default TextMagic phone (`18338096836`) for Serra Honda via org settings
- `server/routes/sms.ts` handles inbound TextMagic webhooks at `/api/webhooks/textmagic`
- TextMagic phone is stored per-org in `organizations.settings.textmagicPhone`, NOT in the agents table
- Schema has NO `textmagic_phone` column on `agents` table — the DB queries in the task would return empty

### TextMagic Phone Numbers (from code)
| Store | Number | Source |
|-------|--------|--------|
| Serra Honda | 18338096836 | Default from scheduler.ts |
| Others | Unknown | Need to check org settings in DB |

### Assessment
TextMagic API keys are NOT configured in .env. SMS send/receive will not work without:
1. `TEXTMAGIC_API_KEY` or equivalent
2. `TEXTMAGIC_WEBHOOK_SECRET` (for inbound verification)
3. Phone numbers assigned per org in settings

---

## 4. Tavus Configuration

### Environment Keys
| Key | Status |
|-----|--------|
| `TAVUS_API_KEY` | Set (`161809492dac4638b9d7870363e4689d`) |
| `TAVUS_WEBHOOK_SECRET` | Set (`4c1fafcaa35a4f1b...`) |

### Tavus Personas (from seed.ts)
| Agent | Store | Tavus Persona ID |
|-------|-------|-----------------|
| Caroline | Serra Honda | `p9eb007721f4` |
| Magnolia | Serra Nissan | `p2f586f7e4e0` |
| Georgia | Tony Serra Ford | `pe791670615d` |
| Elizabeth | Hyundai of Columbia | `p92b0da01c4f` |
| Savannah | Ford of Columbia | `pf233f09f33d` |

### Tavus Widgets
- Serra Video Assistant widget configured with persona `p9eb007721f4` (Caroline/Serra Honda)
- Widget status: active, desktop only, returning visitors

---

## 5. Readiness Summary

### Ready for Testing
| Provider | Ready? | Notes |
|----------|--------|-------|
| VAPI Voice (outbound via Elliott) | YES | All 6 store numbers configured, Elliott script ready |
| VAPI Voice (inbound) | YES | Webhook handler exists at `/api/webhooks/vapi` |
| VAPI Voice Config API | YES | `/api/public/voice-config/:slug` returns assistant ID |
| Tavus Video | YES | API key set, 5 personas configured |
| Tavus Webhooks | YES | Secret set for webhook verification |

### Needs Setup Before Testing
| Provider | Issue | What's Needed |
|----------|-------|---------------|
| TextMagic SMS | No API keys in .env | `TEXTMAGIC_API_KEY`, `TEXTMAGIC_WEBHOOK_SECRET` |
| TextMagic per-org phones | Only Serra Honda has a default | Remaining 4 stores need phone numbers |
| Nancy (Serra Service) | Phone in Elliott but no VAPI assistant ID in seed | Verify VAPI dashboard or add to agents table |

### Testing Constraints (CommGate / IRREVERSIBLE)
- Elliott calls are REAL outbound VAPI calls with REAL cost
- Each call consumes VAPI minutes and telephony charges
- Calls trigger REAL webhooks that create conversations and send emails
- Per CLAUDE.md, these are IRREVERSIBLE actions requiring explicit operator approval before execution
- CommGate must be checked per-org before triggering any real sends
