import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable, departmentsTable, notificationsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, generateAccessToken, generateRefreshToken, AuthRequest } from "../middlewares/auth.js";
import { RegisterBody, LoginBody } from "@workspace/api-zod";

const router = Router();

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const body = RegisterBody.parse(req.body);
    const existing = await db.select().from(usersTable).where(eq(usersTable.email, body.email));
    if (existing.length > 0) {
      res.status(400).json({ error: "Email already registered" });
      return;
    }
    const existingId = await db.select().from(usersTable).where(eq(usersTable.studentId, body.student_id));
    if (existingId.length > 0) {
      res.status(400).json({ error: "Student ID already registered" });
      return;
    }
    const passwordHash = await bcrypt.hash(body.password, 12);
    const [user] = await db.insert(usersTable).values({
      fullName: body.full_name,
      email: body.email,
      passwordHash,
      studentId: body.student_id,
      phone: body.phone,
      departmentId: body.department_id,
      idFrontUrl: body.id_front_url,
      idBackUrl: body.id_back_url,
      profilePhoto: body.profile_photo ?? null,
      role: "student",
      isApproved: false,
    }).returning();
    const accessToken = generateAccessToken({ userId: user.userId, email: user.email, role: user.role, departmentId: user.departmentId });
    const refreshToken = generateRefreshToken({ userId: user.userId });
    const safeUser = {
      user_id: user.userId,
      full_name: user.fullName,
      email: user.email,
      role: user.role,
      student_id: user.studentId,
      phone: user.phone,
      department_id: user.departmentId,
      department_name: null,
      profile_photo: user.profilePhoto,
      id_front_url: user.idFrontUrl,
      id_back_url: user.idBackUrl,
      is_approved: user.isApproved,
      is_active: user.isActive,
      rejection_reason: user.rejectionReason,
      created_at: user.createdAt,
    };
    res.status(201).json({ user: safeUser, access_token: accessToken, refresh_token: refreshToken });
  } catch (err: any) {
    req.log.error(err);
    res.status(400).json({ error: err.message || "Registration failed" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const body = LoginBody.parse(req.body);
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, body.email));
    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    if (!user.isActive) {
      res.status(401).json({ error: "Account is deactivated" });
      return;
    }
    if (user.lockedUntil && new Date() < user.lockedUntil) {
      res.status(401).json({ error: "Account temporarily locked. Please try again later." });
      return;
    }
    const valid = await bcrypt.compare(body.password, user.passwordHash);
    if (!valid) {
      const attempts = (user.loginAttempts || 0) + 1;
      const updates: any = { loginAttempts: attempts };
      if (attempts >= 5) {
        const lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
        updates.lockedUntil = lockedUntil;
      }
      await db.update(usersTable).set(updates).where(eq(usersTable.userId, user.userId));
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    // Reset login attempts on success
    await db.update(usersTable).set({ loginAttempts: 0, lockedUntil: null }).where(eq(usersTable.userId, user.userId));
    // Get department name
    let deptName: string | null = null;
    if (user.departmentId) {
      const [dept] = await db.select().from(departmentsTable).where(eq(departmentsTable.id, user.departmentId));
      if (dept) deptName = dept.name;
    }
    const accessToken = generateAccessToken({ userId: user.userId, email: user.email, role: user.role, departmentId: user.departmentId });
    const refreshToken = generateRefreshToken({ userId: user.userId });
    const safeUser = {
      user_id: user.userId,
      full_name: user.fullName,
      email: user.email,
      role: user.role,
      student_id: user.studentId,
      phone: user.phone,
      department_id: user.departmentId,
      department_name: deptName,
      profile_photo: user.profilePhoto,
      id_front_url: user.idFrontUrl,
      id_back_url: user.idBackUrl,
      is_approved: user.isApproved,
      is_active: user.isActive,
      rejection_reason: user.rejectionReason,
      created_at: user.createdAt,
    };
    res.json({ user: safeUser, access_token: accessToken, refresh_token: refreshToken });
  } catch (err: any) {
    req.log.error(err);
    res.status(400).json({ error: err.message || "Login failed" });
  }
});

// POST /api/auth/logout
router.post("/logout", (req, res) => {
  res.json({ message: "Logged out" });
});

// GET /api/auth/me
router.get("/me", requireAuth, async (req: AuthRequest, res) => {
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.userId, req.user!.userId));
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    let deptName: string | null = null;
    if (user.departmentId) {
      const [dept] = await db.select().from(departmentsTable).where(eq(departmentsTable.id, user.departmentId));
      if (dept) deptName = dept.name;
    }
    res.json({
      user_id: user.userId,
      full_name: user.fullName,
      email: user.email,
      role: user.role,
      student_id: user.studentId,
      phone: user.phone,
      department_id: user.departmentId,
      department_name: deptName,
      profile_photo: user.profilePhoto,
      id_front_url: user.idFrontUrl,
      id_back_url: user.idBackUrl,
      is_approved: user.isApproved,
      is_active: user.isActive,
      rejection_reason: user.rejectionReason,
      created_at: user.createdAt,
    });
  } catch (err: any) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/auth/refresh
router.post("/refresh", async (req, res) => {
  res.status(200).json({ access_token: "" });
});

export default router;
