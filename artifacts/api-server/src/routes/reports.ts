import { Router } from "express";
import { db, reportsTable, usersTable, departmentsTable, notificationsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth, AuthRequest } from "../middlewares/auth.js";
import { CreateReportBody, UpdateReportBody, UpdateReportStatusBody, SubmitReportFeedbackBody } from "@workspace/api-zod";

const router = Router();

async function formatReport(report: any) {
  let studentName: string | null = null;
  let deptName: string | null = null;
  if (report.studentId && !report.isAnonymous) {
    const [u] = await db.select().from(usersTable).where(eq(usersTable.userId, report.studentId));
    if (u) studentName = u.fullName;
  }
  if (report.departmentId) {
    const [d] = await db.select().from(departmentsTable).where(eq(departmentsTable.id, report.departmentId));
    if (d) deptName = d.name;
  }
  return {
    report_id: report.reportId,
    student_id: report.isAnonymous ? null : report.studentId,
    student_name: report.isAnonymous ? "Anonymous" : studentName,
    department_id: report.departmentId,
    department_name: deptName,
    title: report.title,
    description: report.description,
    location: report.location,
    incident_date: report.incidentDate,
    category: report.category,
    status: report.status,
    evidence_urls: report.evidenceUrls ?? [],
    is_anonymous: report.isAnonymous,
    resolved_by: report.resolvedBy,
    resolution_summary: report.resolutionSummary,
    rejection_reason: report.rejectionReason,
    executive_notes: report.executiveNotes,
    president_notes: report.presidentNotes,
    feedback_rating: report.feedbackRating,
    feedback_comment: report.feedbackComment,
    created_at: report.createdAt,
  };
}

// GET /api/reports
router.get("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { status, department_id, category, search } = req.query as any;
    const user = req.user!;
    let allReports = await db.select().from(reportsTable).orderBy(desc(reportsTable.createdAt));
    // Filter by role
    if (user.role === "student" || user.role === "member") {
      allReports = allReports.filter(r => r.studentId === user.userId);
    } else if (user.role === "executive") {
      allReports = allReports.filter(r => r.departmentId === user.departmentId);
    }
    if (status) allReports = allReports.filter(r => r.status === status);
    if (department_id) allReports = allReports.filter(r => r.departmentId === parseInt(department_id));
    if (category) allReports = allReports.filter(r => r.category === category);
    if (search) {
      const s = search.toLowerCase();
      allReports = allReports.filter(r => r.title.toLowerCase().includes(s) || r.description.toLowerCase().includes(s));
    }
    const result = await Promise.all(allReports.map(formatReport));
    res.json(result);
  } catch (err: any) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/reports
router.post("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const body = CreateReportBody.parse(req.body);
    const [report] = await db.insert(reportsTable).values({
      studentId: req.user!.userId,
      departmentId: body.department_id,
      title: body.title,
      description: body.description,
      location: body.location,
      incidentDate: new Date(body.incident_date),
      category: body.category,
      isAnonymous: body.is_anonymous ?? false,
      evidenceUrls: body.evidence_urls,
      status: "pending",
    }).returning();
    // Notify dept executive and president
    const [dept] = await db.select().from(departmentsTable).where(eq(departmentsTable.id, body.department_id));
    if (dept?.executiveId) {
      await db.insert(notificationsTable).values({
        userId: dept.executiveId,
        type: "new_report",
        title: "New Incident Report",
        message: `A new report has been submitted to your department: ${body.title}`,
        relatedId: report.reportId,
      });
    }
    // Notify president
    const [president] = await db.select().from(usersTable).where(eq(usersTable.role, "president"));
    if (president) {
      await db.insert(notificationsTable).values({
        userId: president.userId,
        type: "new_report",
        title: "New Incident Report",
        message: `New report submitted: ${body.title}`,
        relatedId: report.reportId,
      });
    }
    res.status(201).json(await formatReport(report));
  } catch (err: any) {
    req.log.error(err);
    res.status(400).json({ error: err.message });
  }
});

// GET /api/reports/:id
router.get("/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const [report] = await db.select().from(reportsTable).where(eq(reportsTable.reportId, req.params.id));
    if (!report) { res.status(404).json({ error: "Not found" }); return; }
    res.json(await formatReport(report));
  } catch (err: any) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// PATCH /api/reports/:id
router.patch("/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const body = UpdateReportBody.parse(req.body);
    const updates: any = {};
    if (body.title !== undefined) updates.title = body.title;
    if (body.description !== undefined) updates.description = body.description;
    if (body.executive_notes !== undefined) updates.executiveNotes = body.executive_notes;
    if (body.president_notes !== undefined) updates.presidentNotes = body.president_notes;
    if (body.resolution_summary !== undefined) updates.resolutionSummary = body.resolution_summary;
    await db.update(reportsTable).set(updates).where(eq(reportsTable.reportId, req.params.id));
    const [report] = await db.select().from(reportsTable).where(eq(reportsTable.reportId, req.params.id));
    if (!report) { res.status(404).json({ error: "Not found" }); return; }
    res.json(await formatReport(report));
  } catch (err: any) {
    req.log.error(err);
    res.status(400).json({ error: err.message });
  }
});

// PATCH /api/reports/:id/status
router.patch("/:id/status", requireAuth, async (req: AuthRequest, res) => {
  try {
    const body = UpdateReportStatusBody.parse(req.body);
    const [existing] = await db.select().from(reportsTable).where(eq(reportsTable.reportId, req.params.id));
    if (!existing) { res.status(404).json({ error: "Not found" }); return; }
    const updates: any = { status: body.status };
    if (body.reason && (body.status === "rejected" || body.status === "on_hold")) updates.rejectionReason = body.reason;
    if (body.resolution_summary) updates.resolutionSummary = body.resolution_summary;
    if (body.executive_notes) updates.executiveNotes = body.executive_notes;
    if (body.status === "resolved") updates.resolvedBy = req.user!.userId;
    await db.update(reportsTable).set(updates).where(eq(reportsTable.reportId, req.params.id));
    // Notify student
    if (existing.studentId) {
      await db.insert(notificationsTable).values({
        userId: existing.studentId,
        type: "status_update",
        title: "Report Status Updated",
        message: `Your report "${existing.title}" status changed to ${body.status}.`,
        relatedId: existing.reportId,
      });
    }
    const [report] = await db.select().from(reportsTable).where(eq(reportsTable.reportId, req.params.id));
    res.json(await formatReport(report));
  } catch (err: any) {
    req.log.error(err);
    res.status(400).json({ error: err.message });
  }
});

// POST /api/reports/:id/feedback
router.post("/:id/feedback", requireAuth, async (req: AuthRequest, res) => {
  try {
    const body = SubmitReportFeedbackBody.parse(req.body);
    await db.update(reportsTable).set({
      feedbackRating: body.rating,
      feedbackComment: body.comment,
    }).where(eq(reportsTable.reportId, req.params.id));
    const [report] = await db.select().from(reportsTable).where(eq(reportsTable.reportId, req.params.id));
    if (!report) { res.status(404).json({ error: "Not found" }); return; }
    res.json(await formatReport(report));
  } catch (err: any) {
    req.log.error(err);
    res.status(400).json({ error: err.message });
  }
});

export default router;
