# Pre-Execution Report: G-8.3 — Agent Prompt Tuning

**Sprint:** G-8.3
**Phase:** 8 — AI Chat & Agents
**Type:** Gap (content/data change)
**Date:** 2026-03-23

## Objective

Set agent-specific instructions for all 5 agents so each has a distinct personality and useful, contextual responses. Currently all 5 agents have `instructions: null`.

## Agents to Update

| Agent | ID | Department | Channels | Role |
|-------|-----|-----------|----------|------|
| CRM Guru | c997a384-... | sales | chat | VIN/CRM data expert |
| Caroline | 34c24869-... | sales | voice, video | Inbound leads, appointments |
| Service Agent | 57226715-... | service | chat | Service knowledge |
| Marketing Agent | dfbd4d45-... | marketing | chat | Campaign analytics |
| Carol (Nancy Gaston) | 8a326ca0-... | service | voice, video, sms | Service appointments, recalls |

## Declared Files

- `evidence/G-8.3/` — evidence output (no application code; updates via PATCH /api/agents/:id API calls)

## Approach

Use PATCH /api/agents/:id to set `instructions` field for each agent. Instructions will:
- Define the agent's personality and communication style
- Reference the dealership context (org name, dealer type)
- Describe what data/tools the agent can access
- Provide response formatting guidelines
- Include domain-specific knowledge

## Success Criteria

- All 5 agents have non-null instructions
- Each agent's instructions are distinct and role-appropriate
- Chat with each agent produces role-specific responses
- Agents reference the dealership name naturally
