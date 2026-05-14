import { Router } from "express";
import { db, attendanceRecordsTable, eventsTable, membersTable, usersTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth, requireRoles, AuthRequest } from "../middlewares/auth.js";
import { RecordAttendanceBody } from "@workspace/api-zod";

const router = Router();

async function formatRecord(r: any) {
  let eventName: string | null = null;
  let memberName: string | null = null;
  if (r.eventId) {
    const [evt] = await db.select().from(eventsTable).where(eq(eventsTable.id, r.eventId));
    if (evt) eventName = evt.name;
  }
  if (r.memberId) {
    const [m] = await db.select().from(membersTable).where(eq(membersTable.memberId, r.memberId));
    if (m) {
      const [u] = await db.select().from(usersTable).where(eq(usersTable.userId, m.userId));
      if (u) memberName = u.fullName;
    }
  }
  return {
    id: r.id,
    event_id: r.eventId,
    event_name: eventName,
    member_id: r.memberId,
    member_name: memberName,
    status: r.status,
    notes: r.notes,
    created_at: r.createdAt,
  };
}

// GET /api/attendance
router.get("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { event_id, member_id } = req.query as any;
    let records = await db.select().from(attendanceRecordsTable).orderBy(desc(attendanceRecordsTable.createdAt));
    if (event_id) records = records.filter(r => r.eventId === parseInt(event_id));
    if (member_id) records = records.filter(r => r.memberId === member_id);
    const result = await Promise.all(records.map(formatRecord));
    res.json(result);
  } catch (err: any) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/attendance
router.post("/", requireAuth, requireRoles("president", "executive"), async (req: AuthRequest, res) => {
  try {
    const body = RecordAttendanceBody.parse(req.body);
    const [record] = await db.insert(attendanceRecordsTable).values({
      eventId: body.event_id,
      memberId: body.member_id,
      status: body.status,
      notes: body.notes,
    }).returning();
    res.status(201).json(await formatRecord(record));
  } catch (err: any) {
    req.log.error(err);
    res.status(400).json({ error: err.message });
  }
});

export default router;
