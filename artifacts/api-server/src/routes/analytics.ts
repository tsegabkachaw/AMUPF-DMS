import { Router } from "express";
import { db, reportsTable, membersTable, usersTable, tasksTable, eventsTable, departmentsTable } from "@workspace/db";
import { eq, and, count, desc, gte, lte, sql } from "drizzle-orm";
import { requireAuth, AuthRequest } from "../middlewares/auth.js";

const router = Router();

// GET /api/analytics/public-stats
router.get("/public-stats", async (req, res) => {
  try {
    const [memberCount] = await db.select({ count: count() }).from(membersTable);
    const [activeCount] = await db.select({ count: count() }).from(membersTable).where(eq(membersTable.isActive, true));
    const [resolvedCount] = await db.select({ count: count() }).from(reportsTable).where(eq(reportsTable.status, "resolved"));
    const [deptCount] = await db.select({ count: count() }).from(departmentsTable);
    res.json({
      total_members: Number(memberCount?.count ?? 0),
      resolved_cases: Number(resolvedCount?.count ?? 0),
      active_members: Number(activeCount?.count ?? 0),
      departments: Number(deptCount?.count ?? 0),
    });
  } catch (err: any) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/analytics/dashboard
router.get("/dashboard", requireAuth, async (req: AuthRequest, res) => {
  try {
    const [totalReports] = await db.select({ count: count() }).from(reportsTable);
    const [pendingReports] = await db.select({ count: count() }).from(reportsTable).where(eq(reportsTable.status, "pending"));
    const [inProgressReports] = await db.select({ count: count() }).from(reportsTable).where(eq(reportsTable.status, "in_progress"));
    const [resolvedReports] = await db.select({ count: count() }).from(reportsTable).where(eq(reportsTable.status, "resolved"));
    const [totalMembers] = await db.select({ count: count() }).from(membersTable);
    const [activeMembers] = await db.select({ count: count() }).from(membersTable).where(eq(membersTable.isActive, true));
    const [pendingKyc] = await db.select({ count: count() }).from(usersTable).where(and(eq(usersTable.isApproved, false), eq(usersTable.isActive, true)));
    const [totalTasks] = await db.select({ count: count() }).from(tasksTable);
    const upcomingEvents = await db.select().from(eventsTable).where(gte(eventsTable.eventDate, new Date()));
    const total = Number(totalReports?.count ?? 0);
    const resolved = Number(resolvedReports?.count ?? 0);
    res.json({
      total_reports: total,
      pending_reports: Number(pendingReports?.count ?? 0),
      in_progress_reports: Number(inProgressReports?.count ?? 0),
      resolved_reports: resolved,
      total_members: Number(totalMembers?.count ?? 0),
      active_members: Number(activeMembers?.count ?? 0),
      pending_kyc: Number(pendingKyc?.count ?? 0),
      total_tasks: Number(totalTasks?.count ?? 0),
      upcoming_events: upcomingEvents.length,
      resolution_rate: total > 0 ? Math.round((resolved / total) * 100) : 0,
    });
  } catch (err: any) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/analytics/reports-summary
router.get("/reports-summary", requireAuth, async (req: AuthRequest, res) => {
  try {
    const all = await db.select().from(reportsTable).orderBy(desc(reportsTable.createdAt));
    const statuses = ["pending", "in_progress", "on_hold", "resolved", "rejected", "escalated"];
    const by_status = statuses.map(s => ({ status: s, count: all.filter(r => r.status === s).length }));
    const categories = ["physical", "verbal", "property", "mental_health", "other"];
    const by_category = categories.map(c => ({ category: c, count: all.filter(r => r.category === c).length }));
    const depts = await db.select().from(departmentsTable);
    const by_department = await Promise.all(depts.map(async d => ({
      department_name: d.name,
      count: all.filter(r => r.departmentId === d.id).length,
    })));
    const recent_reports = await Promise.all(all.slice(0, 10).map(async r => {
      let deptName: string | null = null;
      if (r.departmentId) {
        const [d] = depts.filter(d => d.id === r.departmentId);
        if (d) deptName = d.name;
      }
      return {
        report_id: r.reportId,
        student_id: r.isAnonymous ? null : r.studentId,
        student_name: r.isAnonymous ? "Anonymous" : null,
        department_id: r.departmentId,
        department_name: deptName,
        title: r.title,
        description: r.description,
        location: r.location,
        incident_date: r.incidentDate,
        category: r.category,
        status: r.status,
        evidence_urls: r.evidenceUrls ?? [],
        is_anonymous: r.isAnonymous,
        resolved_by: r.resolvedBy,
        resolution_summary: r.resolutionSummary,
        rejection_reason: r.rejectionReason,
        executive_notes: r.executiveNotes,
        president_notes: r.presidentNotes,
        feedback_rating: r.feedbackRating,
        feedback_comment: r.feedbackComment,
        created_at: r.createdAt,
      };
    }));
    res.json({ by_status, by_category, by_department, recent_reports });
  } catch (err: any) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/analytics/member-activity
router.get("/member-activity", requireAuth, async (req: AuthRequest, res) => {
  try {
    const [active] = await db.select({ count: count() }).from(membersTable).where(eq(membersTable.isActive, true));
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    const all = await db.select().from(membersTable);
    const newThisMonth = all.filter(m => m.joinDate >= firstOfMonth).length;
    const positions = ["member", "secretary", "coordinator", "vice_president", "president"];
    const positions_breakdown = positions.map(p => ({ position: p, count: all.filter(m => m.position === p).length }));
    res.json({
      new_joins_this_month: newThisMonth,
      active_members: Number(active?.count ?? 0),
      positions_breakdown,
    });
  } catch (err: any) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/analytics/department-performance
router.get("/department-performance", requireAuth, async (req: AuthRequest, res) => {
  try {
    const depts = await db.select().from(departmentsTable);
    const allReports = await db.select().from(reportsTable);
    const result = depts.map(d => {
      const deptReports = allReports.filter(r => r.departmentId === d.id);
      const total = deptReports.length;
      const resolved = deptReports.filter(r => r.status === "resolved").length;
      const pending = deptReports.filter(r => r.status === "pending").length;
      const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
      return {
        department_name: d.name,
        total_cases: total,
        resolved_cases: resolved,
        pending_cases: pending,
        resolution_rate: resolutionRate,
        avg_resolution_days: 0,
      };
    });
    res.json(result);
  } catch (err: any) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
