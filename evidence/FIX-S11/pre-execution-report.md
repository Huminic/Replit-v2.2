# Pre-Execution Report: FIX-S11

Sprint: FIX-S11 — Wave 2 bug fix (all remaining defects)

## Consolidated Bug List

### Code fixes (this repo):
1. VAPI webhook: change validation from VAPI_PRIVATE_KEY to VAPI_WEBHOOK_SECRET + add key to .env
2. Org switch: full page refresh and redirect to "/" 
3. Left menu locked mode: hover should not change locked column
4. Remove "Credits" menu item from sidebar
5. Sales RBAC: block /management access via direct URL for level 4+ roles
6. Add "User Chats" page under Manage (admin-only, chat activity by user)
7. Rename current Activities to "System Log"
8. TextMagic webhook: improve unknown phone routing for multi-org

### Code fixes (investigate scope):
9. TeamBox column/popup layout — inversion fix
10. Marketing duplicate agent sections — remove second section
11. Agent department assignments — audit and fix per dealer
12. Submenu links not navigating correctly (widespread)
13. Sales missing 3 agents (Communication, Coach, Writing) — may be seed/config
14. Service missing chat agent — may be seed/config

### Config/data fixes (not code):
15. VAPI assistant server URLs: update from nexxusv2 to launch URL
16. Tavus duplicate personas: cleanup in dashboard
17. Ford of Columbia + Hyundai of Columbia: need VIN backfill or integration check
18. Huminic org creation

### Deferred/backlog:
19. Demand Score metric (US-025) — new feature, not a bug fix
20. D2 central-mcp vin_create_contact — FIXED by user
21. D3 central-mcp tm_list_chats — FIXED by user

## Status: READY TO FIX
