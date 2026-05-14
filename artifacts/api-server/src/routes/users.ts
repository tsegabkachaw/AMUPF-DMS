import { Router } from "express";
import { db, usersTable, departmentsTable, notificationsTable } from "@workspace/db";
import { eq, and, ilike, or } from "drizzle-orm";
import { requireAuth, requireRoles, AuthRequest } from "../middlewares/auth.js";
import { UpdateUserBody, RejectKycBody } from "@workspace/api-zod";

const router = Router();

function formatUser(user: any, deptName?: string | null) {
  return {
    user_id: user.userId,
    full_name: user.fullName,
    email: user.email,
    role: user.role,
    student_id: user.studentId,
    phone: user.phone,
    department_id: user.departmentId,
    department_name: deptName ?? null,
    profile_photo: user.profilePhoto,
    id_front_url: user.idFrontUrl,
    id_back_url: user.idBackUrl,
    is_approved: user.isApproved,
    is_active: user.isActive,
    rejection_reason: user.rejectionReason,
    created_at: user.createdAt,
  };
}

// GET /api/users/kyc-queue
router.get("/kyc-queue", requireAuth, requireRoles("president", "executive"), async (req: AuthRequest, res) => {
  try {
    const pending = await db.select().from(usersTable).where(and(
      eq(usersTable.isApproved, false),
      eq(usersTable.isActive, true)
    ));
    const result = await Promise.all(pending.map(async u => {
      let deptName: string | null = null;
      if (u.departmentId) {
        const [d] = await db.select().from(departmentsTable).where(eq(departmentsTable.id, u.departmentId));
        if (d) deptName = d.name;
      }
      return formatUser(u, deptName);
    }));
    res.json(result);
  } catch (err: any) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/users
router.get("/", requireAuth, requireRoles("president", "executive"), async (req: AuthRequest, res) => {
  try {
    const { role, is_approved, department_id, search } = req.query as any;
    let query = db.select().from(usersTable);
    const conditions: any[] = [];
    if (role) conditions.push(eq(usersTable.role, role));
    if (is_approved !== undefined) conditions.push(eq(usersTable.isApproved, is_approved === "true"));
    if (department_id) conditions.push(eq(usersTable.departmentId, parseInt(department_id)));
    let users = conditions.length > 0
      ? await db.select().from(usersTable).where(and(...conditions))
      : await db.select().from(usersTable);
    if (search) {
      const s = search.toLowerCase();
      users = users.filter(u => u.fullName.toLowerCase().includes(s) || u.email.toLowerCase().includes(s) || u.studentId.toLowerCase().includes(s));
    }
    const result = await Promise.all(users.map(async u => {
      let deptName: string | null = null;
      if (u.departmentId) {
        const [d] = await db.select().from(departmentsTable).where(eq(departmentsTable.id, u.departmentId));
        if (d) deptName = d.name;
      }
      return formatUser(u, deptName);
    }));
    res.json(result);
  } catch (err: any) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/users/:id
router.get("/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.userId, req.params.id));
    if (!user) { res.status(404).json({ error: "Not found" }); return; }
    let deptName: string | null = null;
    if (user.departmentId) {
      const [d] = await db.select().from(departmentsTable).where(eq(departmentsTable.id, user.departmentId));
      if (d) deptName = d.name;
    }
    res.json(formatUser(user, deptName));
  } catch (err: any) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// PATCH /api/users/:id
router.patch("/:id", requireAuth, requireRoles("president"), async (req: AuthRequest, res) => {
  try {
    const body = UpdateUserBody.parse(req.body);
    const updates: any = {};
    if (body.full_name !== undefined) updates.fullName = body.full_name;
    if (body.phone !== undefined) updates.phone = body.phone;
    if (body.department_id !== undefined) updates.departmentId = body.department_id;
    if (body.profile_photo !== undefined) updates.profilePhoto = body.profile_photo;
    if (body.role !== undefined) updates.role = body.role;
    if (body.is_active !== undefined) updates.isActive = body.is_active;
    await db.update(usersTable).set(updates).where(eq(usersTable.userId, req.params.id));
    const [user] = await db.select().from(usersTable).where(eq(usersTable.userId, req.params.id));
    if (!user) { res.status(404).json({ error: "Not found" }); return; }
    let deptName: string | null = null;
    if (user.departmentId) {
      const [d] = await db.select().from(departmentsTable).where(eq(departmentsTable.id, user.departmentId));
      if (d) deptName = d.name;
    }
    res.json(formatUser(user, deptName));
  } catch (err: any) {
    req.log.error(err);
    res.status(400).json({ error: err.message });
  }
});

// POST /api/users/:id/approve
router.post("/:id/approve", requireAuth, requireRoles("president", "executive"), async (req: AuthRequest, res) => {
  try {
    await db.update(usersTable).set({
      isApproved: true,
      approvedBy: req.user!.userId,
      approvedAt: new Date(),
      rejectionReason: null,
    }).where(eq(usersTable.userId, req.params.id));
    const [user] = await db.select().from(usersTable).where(eq(usersTable.userId, req.params.id));
    if (!user) { res.status(404).json({ error: "Not found" }); return; }
    // Send notification
    await db.insert(notificationsTable).values({
      userId: user.userId,
      type: "kyc_result",
      title: "KYC Approved",
      message: "Your registration has been approved. Welcome to AMUPF!",
    });
    let deptName: string | null = null;
    if (user.departmentId) {
      const [d] = await db.select().from(departmentsTable).where(eq(departmentsTable.id, user.departmentId));
      if (d) deptName = d.name;
    }
    res.json(formatUser(user, deptName));
  } catch (err: any) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/users/:id/reject
router.post("/:id/reject", requireAuth, requireRoles("president", "executive"), async (req: AuthRequest, res) => {
  try {
    const body = RejectKycBody.parse(req.body);
    await db.update(usersTable).set({
      isApproved: false,
      rejectionReason: body.rejection_reason,
    }).where(eq(usersTable.userId, req.params.id));
    const [user] = await db.select().from(usersTable).where(eq(usersTable.userId, req.params.id));
    if (!user) { res.status(404).json({ error: "Not found" }); return; }
    // Send notification
    await db.insert(notificationsTable).values({
      userId: user.userId,
      type: "kyc_result",
      title: "KYC Rejected",
      message: `Your registration was rejected: ${body.rejection_reason}`,
    });
    res.json(formatUser(user, null));
  } catch (err: any) {
    req.log.error(err);
    res.status(400).json({ error: err.message });
  }
});

export default router;
