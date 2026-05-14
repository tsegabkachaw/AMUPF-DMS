import { Router } from "express";
import { db, eventsTable, eventRegistrationsTable, usersTable, attendanceRecordsTable } from "@workspace/db";
import { eq, count, desc } from "drizzle-orm";
import { requireAuth, requireRoles, AuthRequest } from "../middlewares/auth.js";
import { CreateEventBody, UpdateEventBody } from "@workspace/api-zod";

const router = Router();

async function formatEvent(e: any) {
  let createdByName: string | null = null;
  const [creator] = await db.select().from(usersTable).where(eq(usersTable.userId, e.createdBy));
  if (creator) createdByName = creator.fullName;
  const [regCount] = await db.select({ count: count() }).from(eventRegistrationsTable).where(eq(eventRegistrationsTable.eventId, e.id));
  return {
    id: e.id,
    name: e.name,
    description: e.description,
    event_date: e.eventDate,
    location: e.location,
    max_attendees: e.maxAttendees,
    target_audience: e.targetAudience,
    created_by: e.createdBy,
    created_by_name: createdByName,
    attendee_count: Number(regCount?.count ?? 0),
    created_at: e.createdAt,
  };
}

// GET /api/events
router.get("/", async (req, res) => {
  try {
    const events = await db.select().from(eventsTable).orderBy(desc(eventsTable.eventDate));
    const result = await Promise.all(events.map(formatEvent));
    res.json(result);
  } catch (err: any) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/events
router.post("/", requireAuth, requireRoles("president", "executive"), async (req: AuthRequest, res) => {
  try {
    const body = CreateEventBody.parse(req.body);
    const [e] = await db.insert(eventsTable).values({
      name: body.name,
      description: body.description,
      eventDate: new Date(body.event_date),
      location: body.location,
      maxAttendees: body.max_attendees,
      targetAudience: body.target_audience,
      createdBy: req.user!.userId,
    }).returning();
    res.status(201).json(await formatEvent(e));
  } catch (err: any) {
    req.log.error(err);
    res.status(400).json({ error: err.message });
  }
});

// GET /api/events/:id
router.get("/:id", async (req, res) => {
  try {
    const [e] = await db.select().from(eventsTable).where(eq(eventsTable.id, parseInt(req.params.id)));
    if (!e) { res.status(404).json({ error: "Not found" }); return; }
    res.json(await formatEvent(e));
  } catch (err: any) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// PATCH /api/events/:id
router.patch("/:id", requireAuth, requireRoles("president", "executive"), async (req: AuthRequest, res) => {
  try {
    const body = UpdateEventBody.parse(req.body);
    const updates: any = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.description !== undefined) updates.description = body.description;
    if (body.event_date !== undefined) updates.eventDate = new Date(body.event_date);
    if (body.location !== undefined) updates.location = body.location;
    if (body.max_attendees !== undefined) updates.maxAttendees = body.max_attendees;
    await db.update(eventsTable).set(updates).where(eq(eventsTable.id, parseInt(req.params.id)));
    const [e] = await db.select().from(eventsTable).where(eq(eventsTable.id, parseInt(req.params.id)));
    if (!e) { res.status(404).json({ error: "Not found" }); return; }
    res.json(await formatEvent(e));
  } catch (err: any) {
    req.log.error(err);
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/events/:id
router.delete("/:id", requireAuth, requireRoles("president"), async (req: AuthRequest, res) => {
  try {
    await db.delete(eventsTable).where(eq(eventsTable.id, parseInt(req.params.id)));
    res.status(204).send();
  } catch (err: any) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/events/:id/register
router.post("/:id/register", requireAuth, async (req: AuthRequest, res) => {
  try {
    const eventId = parseInt(req.params.id);
    await db.insert(eventRegistrationsTable).values({
      eventId,
      userId: req.user!.userId,
    });
    res.json({ message: "Registered" });
  } catch (err: any) {
    req.log.error(err);
    res.status(400).json({ error: err.message });
  }
});

export default router;
