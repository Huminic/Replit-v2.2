# T-016 AC1: VAPI ↔ DB Alignment Audit

**Date:** 2026-03-27T01:35:00Z
**Agent:** T-016 Integration Verification

## DB Agents with VAPI IDs (from GET /api/agents)

| DB Agent Name | DB Agent ID | vapiAssistantId |
|---|---|---|
| Caroline | 34c24869-ebf0-4fc7-94c6-81d3ac290cae | 90a876c0-0f11-4424-abfe-9ac82b264d88 |
| Nancy Gaston | 8a326ca0-7536-4f45-b8a8-a07a2e744f47 | c777f029-8c4c-4a23-98e4-3adfd4112a61 |

## DB Agents WITHOUT VAPI IDs (chat-only / no voice)

| DB Agent Name | Department | Channels |
|---|---|---|
| Data Guru | sales | chat |
| Sales Coach | sales | chat |
| Communication Writer | sales | chat |
| Photo Studio | marketing | chat |
| Video Producer | marketing | chat |
| Copywriter | marketing | chat |
| Creative Director | marketing | chat |
| Market Intel | marketing | chat |
| Unauthorized Agent | sales | voice, video (but no vapiAssistantId — misconfigured) |

## VAPI Assistants (from VAPI API direct + MCP vapi_list_assistants)

| VAPI ID | VAPI Name | Matched in DB? |
|---|---|---|
| 90a876c0-0f11-4424-abfe-9ac82b264d88 | Caroline - Serra Honda | YES → Caroline |
| c777f029-8c4c-4a23-98e4-3adfd4112a61 | Nancy Serra Service | YES → Nancy Gaston |
| c303d993-bf42-4784-a8cb-247477b1cbdd | Elliott - Test Assistant | NO (orphan) |
| 10dbe3a9-0253-41f2-b41b-293dd6babb60 | Andor | NO (orphan) |
| ad478eb2-6602-42c5-9732-3d4648013307 | Georgia - Tony Serra Ford | NO (orphan, different dealership) |
| 2203b188-a549-417b-ab33-075766e1b5c1 | Magnolia - Serra Nissan | NO (orphan, different dealership) |
| 6216451c-e0a3-43d0-aece-ae382bd8df25 | Savannah — Ford of Columbia | NO (orphan, different dealership) |
| 6d12a8fa-0ed0-4ec1-bfdb-e84587ff86c0 | Elizabeth - Hyundia of Columbia | NO (orphan, different dealership) |
| cf756351-3db4-4e8a-a7d6-1e23ffbb4e62 | Old Liz | NO (orphan, legacy) |
| d019ff3d-201b-4e2b-bf6a-590c19569fc8 | Christine - Quality Check Specialist | NO (orphan) |
| a6cd73c6-9b70-4d69-8409-e78b3078ab8a | Jamie - Knowledge Assistant | NO (orphan) |
| efef092e-75a6-4a85-8bfe-466e269f1f74 | Riley | NO (orphan) |
| f499e129-759c-4303-a31e-f354e2d1ac6b | Gabrielle | NO (orphan) |
| fbca5062-eaa7-4288-8eb4-f152c2035c57 | Custom Dealership Assistant | NO (orphan) |
| eff8f361-9b64-4a3e-a7ac-75e1b431903a | Luxury Car Sales Assistant | NO (orphan) |
| d072c6b4-3f61-4556-a797-eda1c3e29a7f | Karen | NO (orphan) |
| 2729bd0e-4acc-4a21-93be-3445b21034e3 | Morgan | NO (orphan) |
| 03a35527-fe87-46ff-b41c-d6b77fe50f72 | D.A.R.I.A | NO (orphan) |
| 77f54294-9efc-4d09-b3c9-b63440772891 | Riley (duplicate name) | NO (orphan) |

## Summary

- **Matched:** 2 (Caroline, Nancy Gaston)
- **DB orphans (voice/video channels but no VAPI ID):** 1 (Unauthorized Agent)
- **VAPI orphans (not in Serra Honda DB):** 17
- **Note:** Most VAPI orphans appear to be from other dealerships or legacy/test assistants sharing the same VAPI account. The ELLIOTT_ASSISTANT_ID (c303d993) referenced in test specs exists in VAPI but is NOT linked to any DB agent.

## Issues Found

1. **Unauthorized Agent** has channels ["voice","video"] but no vapiAssistantId — will fail on voice/video attempts
2. **17 orphaned VAPI assistants** — these are active in VAPI but not mapped in the DB. Some are from other dealerships (multi-tenant VAPI key), others are legacy/test artifacts. Recommend cleanup or org-scoping.
3. **Elliott test assistant** is referenced in test specs but not in production DB — test-only artifact, acceptable.
