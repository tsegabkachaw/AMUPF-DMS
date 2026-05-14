import { Router } from "express";
import { db, tasksTable, usersTable, departmentsTable, notificationsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth, requireRoles, AuthRequest } from "../middlewares/auth.js";
import { CreateTaskBody, UpdateTaskBody } from "@workspace/api-zod";

const router = Router();

async function formatTask(t: any) {
  let assignedToName: string | null = null;
  let assignedByName: string | null = null;
  let deptName: string | null = null;
  const [assignedTo] = await db.select().from(usersTable).where(eq(usersTable.userId, t.assignedTo));
  if (assignedTo) assignedToName = assignedTo.fullName;
  const [assignedBy] = await db.select().from(usersTable).where(eq(usersTable.userId, t.assignedBy));
  if (assignedBy) assignedByName = assignedBy.fullName;
  if (t.departmentId) {
    const [dept] = await db.select().from(departmentsTable).where(eq(departmentsTable.id, t.departmentId));
    if (dept) deptName = dept.name;
  }
  return {
    task_id: t.taskId,
    title: t.title,
    description: t.description,
    assigned_to: t.assignedTo,
    assigned_to_name: assignedToName,
    assigned_by: t.assignedBy,
    assigned_by_name: assignedByName,
    department_id: t.departmentId,
    department_name: deptName,
    priority: t.priority,
    status: t.status,
    due_date: t.dueDate,
    related_report_id: t.relatedReportId,
    completed_at: t.completedAt,
    created_at: t.createdAt,
  };
}

// GET /api/tasks
router.get("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { assigned_to, department_id, status, priority } = req.query as any;
    let tasks = await db.select().from(tasksTable).orderBy(desc(tasksTable.createdAt));
    const user = req.user!;
    if (user.role === "member") {
      tasks = tasks.filter(t => t.assignedTo === user.userId);
    } else if (user.role === "executive") {
      tasks = tasks.filter(t => t.departmentId === user.departmentId || t.assignedBy === user.userId);
    }
    if (assigned_to) tasks = tasks.filter(t => t.assignedTo === assigned_to);
    if (department_id) tasks = tasks.filter(t => t.departmentId === parseInt(department_id));
    if (status) tasks = tasks.filter(t => t.status === status);
    if (priority) tasks = tasks.filter(t => t.priority === priority);
    const result = await Promise.all(tasks.map(formatTask));
    res.json(result);
  } catch (err: any) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/tasks
router.post("/", requireAuth, requireRoles("president", "executive"), async (req: AuthRequest, res) => {
  try {
    const body = CreateTaskBody.parse(req.body);
    const [task] = await db.insert(tasksTable).values({
      title: body.title,
      description: body.description,
      assignedTo: body.assigned_to,
      assignedBy: req.user!.userId,
      departmentId: body.department_id,
      priority: body.priority,
      dueDate: body.due_date,
      relatedReportId: body.related_report_id,
      status: "pending",
    }).returning();
    await db.insert(notificationsTable).values({
      userId: body.assigned_to,
      type: "task_assigned",
      title: "New Task Assigned",
      message: `You have been assigned a new task: ${body.title}`,
      relatedId: task.taskId,
    });
    res.status(201).json(await formatTask(task));
  } catch (err: any) {
    req.log.error(err);
    res.status(400).json({ error: err.message });
  }
});

// GET /api/tasks/:id
router.get("/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const [task] = await db.select().from(tasksTable).where(eq(tasksTable.taskId, req.params.id));
    if (!task) { res.status(404).json({ error: "Not found" }); return; }
    res.json(await formatTask(task));
  } catch (err: any) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// PATCH /api/tasks/:id
router.patch("/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const body = UpdateTaskBody.parse(req.body);
    const updates: any = {};
    if (body.title !== undefined) updates.title = body.title;
    if (body.description !== undefined) updates.description = body.description;
    if (body.status !== undefined) {
      updates.status = body.status;
      if (body.status === "completed") updates.completedAt = new Date();
    }
    if (body.priority !== undefined) updates.priority = body.priority;
    if (body.due_date !== undefined) updates.dueDate = body.due_date;
    await db.update(tasksTable).set(updates).where(eq(tasksTable.taskId, req.params.id));
    const [task] = await db.select().from(tasksTable).where(eq(tasksTable.taskId, req.params.id));
    if (!task) { res.status(404).json({ error: "Not found" }); return; }
    res.json(await formatTask(task));
  } catch (err: any) {
    req.log.error(err);
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/tasks/:id
router.delete("/:id", requireAuth, requireRoles("president", "executive"), async (req: AuthRequest, res) => {
  try {
    await db.delete(tasksTable).where(eq(tasksTable.taskId, req.params.id));
    res.status(204).send();
  } catch (err: any) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
