# S5 — I-249 — One-curl probe (companion to delta-2-codetrace.md)

**Probe time:** 2026-05-10T19:10Z

```
$ curl -sS -w "%{http_code}" -X PATCH "http://localhost:5000/api/users/6249dbc6-bdbf-4dae-a962-04ae63002bea" \
    -H "Authorization: Bearer <serra-honda-admin-token>" \
    -H "Content-Type: application/json" \
    -d '{"isActive":false}'

HTTP 400
{"message":"Cannot deactivate yourself. Ask another admin to deactivate this account."}
```

DB pre/post:

```
PRE:  is_active = true
POST: is_active = true
```

**PASS.** Self-deactivation correctly blocked at route with operator-facing 400 and exact expected message. DB row untouched.
