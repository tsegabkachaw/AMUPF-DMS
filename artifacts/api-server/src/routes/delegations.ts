import { Router } from "express";
import { db, delegationsTable, usersTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth, requireRoles, AuthRequest } from "../middlewares/auth.js";
import { CreateDelegationBody } from "@workspace/api-zod";

const router = Router();

async function formatDelegation(d: any) {
  let grantedByName: string | null = null;
  let grantedToName: string | null = null;
  const [grantedBy] = await db.select().from(usersTable).where(eq(usersTable.userId, d.grantedBy));
  if (grantedBy) grantedByName = grantedBy.fullName;
  const [grantedTo] = await db.select().from(usersTable).where(eq(usersTable.userId, d.grantedTo));
  if (grantedTo) grantedToName = grantedTo.fullName;
  return {
    delegation_id: d.delegationId,
    granted_by: d.grantedBy,
    granted_by_name: grantedByName,
    granted_to: d.grantedTo,
    granted_to_name: grantedToName,
    permission: d.permission,
    expires_at: d.expiresAt,
    is_active: d.isActive,
    revoked_at: d.revokedAt,
    created_at: d.createdAt,
  };
}

// GET /api/delegations
router.get("/", requireAuth, requireRoles("president"), async (req: AuthRequest, res) => {
  try {
    const items = await db.select().from(delegationsTable).orderBy(desc(delegationsTable.createdAt));
    const result = await Promise.all(items.map(formatDelegation));
    res.json(result);
  } catch (err: any) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/delegations
router.post("/", requireAuth, requireRoles("president"), async (req: AuthRequest, res) => {
  try {
    const body = CreateDelegationBody.parse(req.body);
    const [d] = await db.insert(delegationsTable).values({
      grantedBy: req.user!.userId,
      grantedTo: body.granted_to,
      permission: body.permission,
      expiresAt: body.expires_at,
      isActive: true,
    }).returning();
    res.status(201).json(await formatDelegation(d));
  } catch (err: any) {
    req.log.error(err);
    res.status(400).json({ error: err.message });
  }
});

// POST /api/delegations/:id/revoke
router.post("/:id/revoke", requireAuth, requireRoles("president"), async (req: AuthRequest, res) => {
  try {
    await db.update(delegationsTable).set({
      isActive: false,
      revokedAt: new Date(),
    }).where(eq(delegationsTable.delegationId, req.params.id));
    const [d] = await db.select().from(delegationsTable).where(eq(delegationsTable.delegationId, req.params.id));
    if (!d) { res.status(404).json({ error: "Not found" }); return; }
    res.json(await formatDelegation(d));
  } catch (err: any) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
