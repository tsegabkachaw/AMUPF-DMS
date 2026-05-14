import { pgTable, text, boolean, integer, timestamp, uuid } from "drizzle-orm/pg-core";
import { pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const reportCategoryEnum = pgEnum("report_category", ["physical", "verbal", "property", "mental_health", "other"]);
export const reportStatusEnum = pgEnum("report_status", ["pending", "in_progress", "on_hold", "resolved", "rejected", "escalated"]);
export const handlingMethodEnum = pgEnum("handling_method", ["in_person", "phone", "email", "other"]);

export const reportsTable = pgTable("reports", {
  reportId: uuid("report_id").primaryKey().defaultRandom(),
  studentId: uuid("student_id"),
  departmentId: integer("department_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  location: text("location").notNull(),
  incidentDate: timestamp("incident_date", { withTimezone: true }).notNull(),
  category: reportCategoryEnum("category").notNull(),
  status: reportStatusEnum("status").notNull().default("pending"),
  evidenceUrls: text("evidence_urls").array(),
  isAnonymous: boolean("is_anonymous").notNull().default(false),
  anonymousToken: text("anonymous_token"),
  resolvedBy: uuid("resolved_by"),
  resolutionSummary: text("resolution_summary"),
  rejectionReason: text("rejection_reason"),
  presidentNotes: text("president_notes"),
  executiveNotes: text("executive_notes"),
  handlingMethod: handlingMethodEnum("handling_method"),
  feedbackRating: integer("feedback_rating"),
  feedbackComment: text("feedback_comment"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertReportSchema = createInsertSchema(reportsTable).omit({ reportId: true, createdAt: true });
export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reportsTable.$inferSelect;
