import { Router } from "express";
import { db, departmentsTable, usersTable, reportsTable, membersTable } from "@workspace/db";
import { eq, count, sql } from "drizzle-orm";
import { requireAuth, requireRoles, AuthRequest } from "../middlewares/auth.js";
import { CreateDepartmentBody, UpdateDepartmentBody } from "@workspace/api-zod";

const router = Router();

async function getDeptWithStats(id: number) {
  const [dept] = await db.select().from(departmentsTable).where(eq(departmentsTable.id, id));
  if (!dept) return null;
  let executiveName: string | null = null;
  if (dept.executiveId) {
    const [exec] = await db.select({ fullName: usersTable.fullName }).from(usersTable).where(eq(usersTable.userId, dept.executiveId));
    if (exec) executiveName = exec.fullName;
  }
  const [memCount] = await db.select({ count: count() }).from(membersTable).where(eq(membersTable.departmentId, id));
  const [repCount] = await db.select({ count: count() }).from(reportsTable).where(eq(reportsTable.departmentId, id));
  return {
    id: dept.id,
    name: dept.name,
    description: dept.description,
    executive_id: dept.executiveId,
    executive_name: executiveName,
    member_count: Number(memCount?.count ?? 0),
    report_count: Number(repCount?.count ?? 0),
  };
}

// GET /api/departments
router.get("/", async (req, res) => {
  try {
    const depts = await db.select().from(departmentsTable);
    const result = await Promise.all(depts.map(d => getDeptWithStats(d.id)));
    res.json(result.filter(Boolean));
  } catch (err: any) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/departments
router.post("/", requireAuth, requireRoles("president"), async (req: AuthRequest, res) => {
  try {
    const body = CreateDepartmentBody.parse(req.body);
    const [dept] = await db.insert(departmentsTable).values({
      name: body.name,
      description: body.description,
      executiveId: body.executive_id,
    }).returning();
    const result = await getDeptWithStats(dept.id);
    res.status(201).json(result);
  } catch (err: any) {
    req.log.error(err);
    res.status(400).json({ error: err.message });
  }
});

// GET /api/departments/:id
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const result = await getDeptWithStats(id);
    if (!result) { res.status(404).json({ error: "Not found" }); return; }
    res.json(result);
  } catch (err: any) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// PATCH /api/departments/:id
router.patch("/:id", requireAuth, requireRoles("president"), async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const body = UpdateDepartmentBody.parse(req.body);
    await db.update(departmentsTable).set({
      name: body.name,
      description: body.description,
      executiveId: body.executive_id,
    }).where(eq(departmentsTable.id, id));
    const result = await getDeptWithStats(id);
    if (!result) { res.status(404).json({ error: "Not found" }); return; }
    res.json(result);
  } catch (err: any) {
    req.log.error(err);
    res.status(400).json({ error: err.message });
  }
});

export default router;
