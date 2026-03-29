# BL-084: Remove Tasks from UI

**Date:** 2026-03-28

## Files Modified
| File | What changed |
|------|-------------|
| teambox.tsx | Removed Tasks tab from view mode toggle, task type/priority configs, TaskListSkeleton component, task query + state variables (activeTaskType, selectedTaskId, allTasks, filteredTasks, selectedTask, getTaskTypeCount, updateTaskMutation), task sidebar filters, task list rendering in column 2, task detail view in column 3, task references in empty state. Removed dead imports (CheckSquare, AlertTriangle, MailX, ChevronRight, Clock, Task type). |
| chat.ts | No changes needed -- no createTask tool exists in chat tool schema. Chat tools are: web_search, vin_query_leads, vin_lead_summary, query_campaigns. |

## Verification
- Conversations view intact: YES
- Tasks tab removed: YES
- Chat createTask tool removed: N/A (did not exist)

## Lines removed
318 (1253 -> 935)
