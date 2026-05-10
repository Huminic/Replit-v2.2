# S1 — I-244 IDOR — Delta 2 endpoint behavioral probe

**Wave:** 9-Sec
**Chunk:** S1
**Item:** I-244 IDOR cross-tenant on `/api/vin/leads/summary`
**Fix commit:** `3a63022`
**Build/reload:** `npm run build` + `pm2 reload nexxus-app --update-env` at 2026-05-10T19:03:39Z (uptime 7s health OK)
**Probe time:** 2026-05-10T19:04Z

---

## Setup

| | Value |
|---|---|
| Serra Honda org id | `24d64f99-ba04-4b43-af35-fd06f555ac86` |
| Serra Nissan org id (cross-tenant target) | `4a23d5ad-38ff-4016-8af5-f4cfc9fd88cd` |
| Serra Honda admin (roleLevel=3 / org_admin) | `serra_honda@huminic.ai` |
| Super admin (roleLevel=1) | `duane.wells@huminic.ai` |
| Endpoint | `GET /api/vin/leads/summary[?orgId=<uuid>]` |
| Fix gate | `server/vendorProxy.ts:559` (`resolveEffectiveOrgId(roleLevel, queryOrgId, ownOrgId)`) — for `roleLevel > 2` the query param is silently ignored |

---

## Probe results

### Probe A — serra-honda admin, NO orgId override (own-org default)

```
$ curl -sS -X GET "http://localhost:5000/api/vin/leads/summary" -H "Authorization: Bearer <serra-honda-admin-token>"
{"period":{"start":"2026-04-10","end":"2026-05-10"},"totalLeads":649,"totalLeadsChange":43,"newLeads":33,"newLeadsChange":-17,"activeLeads":367,"activeLeadsChange":104,"soldLeads":7,"soldLeadsChange":-36,"lostLeads":0,"waitingForResponse":159,"appointments":0,"conversionRate":100,"syncedAt":"2026-05-10T19:00:24.810Z"}
HTTP 200
```

### Probe B — serra-honda admin, orgId=serra-nissan override (IDOR attempt)

```
$ curl -sS -X GET "http://localhost:5000/api/vin/leads/summary?orgId=4a23d5ad-38ff-4016-8af5-f4cfc9fd88cd" -H "Authorization: Bearer <serra-honda-admin-token>"
{"period":{"start":"2026-04-10","end":"2026-05-10"},"totalLeads":649,"totalLeadsChange":43,"newLeads":33,"newLeadsChange":-17,"activeLeads":367,"activeLeadsChange":104,"soldLeads":7,"soldLeadsChange":-36,"lostLeads":0,"waitingForResponse":159,"appointments":0,"conversionRate":100,"syncedAt":"2026-05-10T19:00:24.810Z"}
HTTP 200
```

**Key observation:** Probe A and Probe B return **identical** data (totalLeads:649, syncedAt identical). The `?orgId=` override was silently ignored for the org_admin role (roleLevel=3 > 2).

### Control C — super_admin, orgId=serra-nissan override (legitimate cross-tenant)

```
$ curl -sS -X GET "http://localhost:5000/api/vin/leads/summary?orgId=4a23d5ad-38ff-4016-8af5-f4cfc9fd88cd" -H "Authorization: Bearer <super-admin-token>"
{"period":{"start":"2026-04-10","end":"2026-05-10"},"totalLeads":460,"totalLeadsChange":21,"newLeads":13,"newLeadsChange":0,"activeLeads":307,"activeLeadsChange":73,"soldLeads":4,"soldLeadsChange":-60,"lostLeads":1,"waitingForResponse":114,"appointments":0,"conversionRate":80,"syncedAt":"2026-05-10T19:04:23.298Z"}
HTTP 200
```

**Key observation:** Super admin gets the ACTUAL serra-nissan data (totalLeads:460), proving the two orgs really do have different lead counts. The serra-honda admin in Probe B did NOT get this data — confirming the IDOR is now closed.

### Control D — super_admin, orgId=serra-honda override (sanity)

```
$ curl -sS -X GET "http://localhost:5000/api/vin/leads/summary?orgId=24d64f99-ba04-4b43-af35-fd06f555ac86" -H "Authorization: Bearer <super-admin-token>"
{"period":...,"totalLeads":649,...}
HTTP 200
```

Confirms serra-honda's 649 figure is reproducible.

---

## Verdict

**PASS.** Pre-fix expectation: serra-honda admin's Probe B would have returned serra-nissan's 460 leads. Post-fix observed: Probe B returned serra-honda's 649. The role-gated `resolveEffectiveOrgId` correctly silent-drops the override for `roleLevel > 2` and enforces `req.user.organizationId` instead. Super_admin path remains functional (Control C/D).
