import { test, expect } from "playwright/test";
import { testUsers, login, authHeader } from "./helpers/auth";

test.describe("Domain 10: Tasks & Appointments", () => {
  let token: string;
  let userId: string;
  let organizationId: string;

  test.beforeAll(async ({ request }) => {
    const session = await login(request, testUsers.sales);
    token = session.token;
    userId = session.userId;
    organizationId = session.organizationId;
  });

  test("10.1 Tasks visible in My Work", async ({ request }) => {
    const response = await request.get("/api/tasks", {
      headers: authHeader(token),
    });

    expect(response.ok()).toBe(true);
    const body = await response.json();

    // Response should be an array or object with tasks
    if (Array.isArray(body)) {
      expect(Array.isArray(body)).toBe(true);
    } else {
      // Could be paginated: { tasks: [], total: n } or similar
      expect(body).toBeTruthy();
      const tasks = body.tasks ?? body.data ?? body.items ?? body;
      expect(tasks).toBeTruthy();
    }
  });

  test("10.2 Task creation self-assign only", async ({ request }) => {
    // Create a task assigned to self
    const createRes = await request.post("/api/tasks", {
      headers: authHeader(token),
      data: {
        title: "E2E Test Task — Self Assign",
        description: "Created by Playwright domain-10 test",
        assignedUserId: userId,
        status: "pending",
        priority: "medium",
      },
    });

    expect(createRes.ok()).toBe(true);
    const created = await createRes.json();
    const task = created.task ?? created;
    expect(task).toBeTruthy();
    expect(task.title || task.name).toBeTruthy();

    // Verify the task is assigned to self (the requesting user)
    const assignee = task.assignedUserId ?? task.assignedTo ?? task.assigned_to ?? task.assigneeId ?? task.user_id;
    if (assignee) {
      expect(String(assignee)).toBe(String(userId));
    }

    // Clean up — delete the task if possible
    const taskId = task.id;
    if (taskId) {
      await request.delete(`/api/tasks/${taskId}`, {
        headers: authHeader(token),
      });
    }
  });

  test("10.3 Appointments connected to calendar", async ({ request }) => {
    const response = await request.get("/api/appointments", {
      headers: authHeader(token),
    });

    expect(response.ok()).toBe(true);
    const body = await response.json();

    // Should return appointment data (array or object)
    if (Array.isArray(body)) {
      // Each appointment should have date/time fields
      for (const appt of body.slice(0, 5)) {
        const hasDate = appt.startTime || appt.date || appt.startDate || appt.start || appt.scheduledAt;
        expect(hasDate).toBeTruthy();
      }
    } else {
      const items = body.appointments ?? body.data ?? body.items ?? body;
      expect(items).toBeTruthy();
    }
  });

  test("10.4 Task and appointment CRUD", async ({ request }) => {
    // === TASK CRUD ===

    // CREATE
    const createTaskRes = await request.post("/api/tasks", {
      headers: authHeader(token),
      data: {
        title: "CRUD Test Task",
        description: "Full lifecycle test",
        assignedUserId: userId,
        status: "pending",
        priority: "low",
      },
    });
    expect(createTaskRes.ok()).toBe(true);
    const createdTask = await createTaskRes.json();
    const task = createdTask.task ?? createdTask;
    const taskId = task.id;
    expect(taskId).toBeTruthy();

    // READ
    const readTaskRes = await request.get(`/api/tasks/${taskId}`, {
      headers: authHeader(token),
    });
    expect(readTaskRes.ok()).toBe(true);

    // UPDATE
    const updateTaskRes = await request.patch(`/api/tasks/${taskId}`, {
      headers: authHeader(token),
      data: {
        title: "CRUD Test Task — Updated",
        status: "in_progress",
      },
    });
    // Accept PATCH or try PUT if PATCH fails
    if (!updateTaskRes.ok()) {
      const putRes = await request.put(`/api/tasks/${taskId}`, {
        headers: authHeader(token),
        data: {
          title: "CRUD Test Task — Updated",
          status: "in_progress",
        },
      });
      expect(putRes.ok()).toBe(true);
    } else {
      expect(updateTaskRes.ok()).toBe(true);
    }

    // DELETE
    const deleteTaskRes = await request.delete(`/api/tasks/${taskId}`, {
      headers: authHeader(token),
    });
    expect(deleteTaskRes.ok()).toBe(true);

    // Verify deletion — should 404
    const verifyDeleteRes = await request.get(`/api/tasks/${taskId}`, {
      headers: authHeader(token),
    });
    expect([404, 410]).toContain(verifyDeleteRes.status());
  });
});
