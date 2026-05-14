import { Router } from "express";
import { db, notificationsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth, AuthRequest } from "../middlewares/auth.js";

const router = Router();

// GET /api/notifications
router.get("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const items = await db.select().from(notificationsTable)
      .where(eq(notificationsTable.userId, req.user!.userId))
      .orderBy(desc(notificationsTable.createdAt));
    res.json(items.map(n => ({
      id: n.id,
      user_id: n.userId,
      type: n.type,
      title: n.title,
      message: n.message,
      related_id: n.relatedId,
      is_read: n.isRead,
      created_at: n.createdAt,
    })));
  } catch (err: any) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/notifications/read-all
router.post("/read-all", requireAuth, async (req: AuthRequest, res) => {
  try {
    await db.update(notificationsTable).set({ isRead: true }).where(eq(notificationsTable.userId, req.user!.userId));
    res.json({ message: "All marked as read" });
  } catch (err: any) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/notifications/:id/read
router.post("/:id/read", requireAuth, async (req: AuthRequest, res) => {
  try {
    await db.update(notificationsTable).set({ isRead: true }).where(
      and(eq(notificationsTable.id, parseInt(req.params.id)), eq(notificationsTable.userId, req.user!.userId))
    );
    res.json({ message: "Marked as read" });
  } catch (err: any) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
