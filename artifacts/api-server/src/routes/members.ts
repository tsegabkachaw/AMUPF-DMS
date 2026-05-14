import { Router } from "express";
import { db, membersTable, usersTable, departmentsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, requireRoles, AuthRequest } from "../middlewares/auth.js";
import { CreateMemberBody, UpdateMemberBody } from "@workspace/api-zod";
import { v4 as uuidv4 } from "uuid";

const router = Router();

function generateMemberLink() {
  const year = new Date().getFullYear();
  return `NSR-${year}-${uuidv4()}`;
}

async function formatMember(m: any) {
  let fullName: string | null = null;
  let email: string | null = null;
  let phone: string | null = null;
  let profilePhoto: string | null = null;
  let deptName: string | null = null;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.userId, m.userId));
  if (user) {
    fullName = user.fullName;
    email = user.email;
    phone = user.phone;
    profilePhoto = user.profilePhoto;
  }
  if (m.departmentId) {
    const [dept] = await db.select().from(departmentsTable).where(eq(departmentsTable.id, m.departmentId));
    if (dept) deptName = dept.name;
  }
  return {
    member_id: m.memberId,
    user_id: m.userId,
    full_name: fullName,
    email,
    phone,
    profile_photo: profilePhoto,
    position: m.position,
    department_id: m.departmentId,
    department_name: deptName,
    join_date: m.joinDate,
    unique_link: m.uniqueLink,
    link_expiry: m.linkExpiry,
    responsibilities: m.responsibilities,
    is_active: m.isActive,
    created_at: m.createdAt,
  };
}

// GET /api/members
router.get("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { department_id, status, position, search } = req.query as any;
    let members = await db.select().from(membersTable);
    if (department_id) members = members.filter(m => m.departmentId === parseInt(department_id));
    if (status === "active") members = members.filter(m => m.isActive);
    if (status === "inactive") members = members.filter(m => !m.isActive);
    if (position) members = members.filter(m => m.position === position);
    const result = await Promise.all(members.map(formatMember));
    const filtered = search
      ? result.filter(m => m.full_name?.toLowerCase().includes(search.toLowerCase()) || m.email?.toLowerCase().includes(search.toLowerCase()))
      : result;
    res.json(filtered);
  } catch (err: any) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/members
router.post("/", requireAuth, requireRoles("president"), async (req: AuthRequest, res) => {
  try {
    const body = CreateMemberBody.parse(req.body);
    const [m] = await db.insert(membersTable).values({
      userId: body.user_id,
      position: body.position,
      departmentId: body.department_id,
      joinDate: body.join_date,
      uniqueLink: generateMemberLink(),
      responsibilities: body.responsibilities,
      linkExpiry: body.link_expiry,
      createdBy: req.user!.userId,
      isActive: true,
    }).returning();
    // Promote user role to "member"
    await db.update(usersTable).set({ role: "member" }).where(eq(usersTable.userId, body.user_id));
    res.status(201).json(await formatMember(m));
  } catch (err: any) {
    req.log.error(err);
    res.status(400).json({ error: err.message });
  }
});

// GET /api/members/link/:uniqueLink
router.get("/link/:uniqueLink", requireAuth, requireRoles("president", "executive"), async (req: AuthRequest, res) => {
  try {
    const [m] = await db.select().from(membersTable).where(eq(membersTable.uniqueLink, req.params.uniqueLink));
    if (!m) { res.status(404).json({ error: "Not found" }); return; }
    res.json(await formatMember(m));
  } catch (err: any) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/members/:id
router.get("/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const [m] = await db.select().from(membersTable).where(eq(membersTable.memberId, req.params.id));
    if (!m) { res.status(404).json({ error: "Not found" }); return; }
    res.json(await formatMember(m));
  } catch (err: any) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// PATCH /api/members/:id
router.patch("/:id", requireAuth, requireRoles("president", "executive"), async (req: AuthRequest, res) => {
  try {
    const body = UpdateMemberBody.parse(req.body);
    const updates: any = {};
    if (body.position !== undefined) updates.position = body.position;
    if (body.department_id !== undefined) updates.departmentId = body.department_id;
    if (body.responsibilities !== undefined) updates.responsibilities = body.responsibilities;
    if (body.is_active !== undefined) updates.isActive = body.is_active;
    if (body.link_expiry !== undefined) updates.linkExpiry = body.link_expiry;
    await db.update(membersTable).set(updates).where(eq(membersTable.memberId, req.params.id));
    const [m] = await db.select().from(membersTable).where(eq(membersTable.memberId, req.params.id));
    if (!m) { res.status(404).json({ error: "Not found" }); return; }
    res.json(await formatMember(m));
  } catch (err: any) {
    req.log.error(err);
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/members/:id
router.delete("/:id", requireAuth, requireRoles("president"), async (req: AuthRequest, res) => {
  try {
    await db.delete(membersTable).where(eq(membersTable.memberId, req.params.id));
    res.status(204).send();
  } catch (err: any) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/members/:id/regenerate-link
router.post("/:id/regenerate-link", requireAuth, requireRoles("president"), async (req: AuthRequest, res) => {
  try {
    await db.update(membersTable).set({ uniqueLink: generateMemberLink() }).where(eq(membersTable.memberId, req.params.id));
    const [m] = await db.select().from(membersTable).where(eq(membersTable.memberId, req.params.id));
    if (!m) { res.status(404).json({ error: "Not found" }); return; }
    res.json(await formatMember(m));
  } catch (err: any) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
