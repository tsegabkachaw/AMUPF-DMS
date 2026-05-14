import { Router } from "express";
import { db, announcementsTable, usersTable, departmentsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, requireRoles, AuthRequest } from "../middlewares/auth.js";
import { CreateAnnouncementBody, UpdateAnnouncementBody } from "@workspace/api-zod";

const router = Router();

async function formatAnnouncement(a: any) {
  let authorName: string | null = null;
  let deptName: string | null = null;
  const [author] = await db.select().from(usersTable).where(eq(usersTable.userId, a.authorId));
  if (author) authorName = author.fullName;
  if (a.departmentId) {
    const [dept] = await db.select().from(departmentsTable).where(eq(departmentsTable.id, a.departmentId));
    if (dept) deptName = dept.name;
  }
  return {
    id: a.id,
    title: a.title,
    content: a.content,
    type: a.type,
    department_id: a.departmentId,
    department_name: deptName,
    author_id: a.authorId,
    author_name: authorName,
    created_at: a.createdAt,
  };
}

// GET /api/announcements
router.get("/", async (req: any, res) => {
  try {
    const { type, department_id } = req.query as any;
    let items = await db.select().from(announcementsTable).orderBy(desc(announcementsTable.createdAt));
    if (type) items = items.filter(a => a.type === type);
    if (department_id) items = items.filter(a => a.departmentId === parseInt(department_id));
    // Public items don't need auth
    const result = await Promise.all(items.map(formatAnnouncement));
    res.json(result);
  } catch (err: any) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/announcements
router.post("/", requireAuth, requireRoles("president", "executive"), async (req: AuthRequest, res) => {
  try {
    const body = CreateAnnouncementBody.parse(req.body);
    const [a] = await db.insert(announcementsTable).values({
      title: body.title,
      content: body.content,
      type: body.type,
      departmentId: body.department_id,
      authorId: req.user!.userId,
    }).returning();
    res.status(201).json(await formatAnnouncement(a));
  } catch (err: any) {
    req.log.error(err);
    res.status(400).json({ error: err.message });
  }
});

// GET /api/announcements/:id
router.get("/:id", async (req, res) => {
  try {
    const [a] = await db.select().from(announcementsTable).where(eq(announcementsTable.id, parseInt(req.params.id)));
    if (!a) { res.status(404).json({ error: "Not found" }); return; }
    res.json(await formatAnnouncement(a));
  } catch (err: any) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// PATCH /api/announcements/:id
router.patch("/:id", requireAuth, requireRoles("president", "executive"), async (req: AuthRequest, res) => {
  try {
    const body = UpdateAnnouncementBody.parse(req.body);
    const updates: any = {};
    if (body.title !== undefined) updates.title = body.title;
    if (body.content !== undefined) updates.content = body.content;
    if (body.type !== undefined) updates.type = body.type;
    await db.update(announcementsTable).set(updates).where(eq(announcementsTable.id, parseInt(req.params.id)));
    const [a] = await db.select().from(announcementsTable).where(eq(announcementsTable.id, parseInt(req.params.id)));
    if (!a) { res.status(404).json({ error: "Not found" }); return; }
    res.json(await formatAnnouncement(a));
  } catch (err: any) {
    req.log.error(err);
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/announcements/:id
router.delete("/:id", requireAuth, requireRoles("president"), async (req: AuthRequest, res) => {
  try {
    await db.delete(announcementsTable).where(eq(announcementsTable.id, parseInt(req.params.id)));
    res.status(204).send();
  } catch (err: any) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
