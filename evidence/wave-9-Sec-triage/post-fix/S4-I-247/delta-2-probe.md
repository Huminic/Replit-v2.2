# S4 — I-247 — One-curl probe (companion to delta-2-codetrace.md)

**Probe time:** 2026-05-10T19:09Z

```
$ curl -sS -w "%{http_code}" -X PATCH "http://localhost:5000/api/organizations/24d64f99-ba04-4b43-af35-fd06f555ac86" \
    -H "Authorization: Bearer <serra-honda-admin-token>" \
    -H "Content-Type: application/json" \
    -d '{"slug":"NEW-EVIL-SLUG"}'

HTTP 200
Response: { ..., "slug": "serra-honda", "updatedAt": "2026-05-10T19:09:13.229Z", ... }
```

DB pre/post via psql:

```
PRE:  slug = "serra-honda"   updated_at = 2026-05-10T19:06:11.747Z
POST: slug = "serra-honda"   updated_at = 2026-05-10T19:09:13.229Z
```

Slug unchanged; row touched (zod stripped slug, route called updateOrganization with empty / non-slug data, generating a no-op-on-slug update with refreshed updated_at).

**PASS.** Slug not modified despite slug field in PATCH body.
