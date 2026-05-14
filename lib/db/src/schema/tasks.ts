import { pgTable, text, timestamp, uuid, integer, date } from "drizzle-orm/pg-core";
import { pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const taskPriorityEnum = pgEnum("task_priority", ["low", "medium", "high", "urgent"]);
export const taskStatusEnum = pgEnum("task_status", ["pending", "in_progress", "completed", "cancelled"]);

export const tasksTable = pgTable("tasks", {
  taskId: uuid("task_id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  assignedTo: uuid("assigned_to").notNull(),
  assignedBy: uuid("assigned_by").notNull(),
  departmentId: integer("department_id"),
  priority: taskPriorityEnum("priority").notNull(),
  status: taskStatusEnum("status").notNull().default("pending"),
  dueDate: date("due_date"),
  relatedReportId: uuid("related_report_id"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTaskSchema = createInsertSchema(tasksTable).omit({ taskId: true, createdAt: true });
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasksTable.$inferSelect;
