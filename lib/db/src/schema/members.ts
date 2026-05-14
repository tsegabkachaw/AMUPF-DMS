import { pgTable, text, boolean, integer, timestamp, uuid, date } from "drizzle-orm/pg-core";
import { pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const memberPositionEnum = pgEnum("member_position", ["member", "secretary", "coordinator", "vice_president", "president"]);
export const memberStatusEnum = pgEnum("member_status", ["active", "inactive", "suspended"]);

export const membersTable = pgTable("members", {
  memberId: uuid("member_id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().unique(),
  position: memberPositionEnum("position").notNull().default("member"),
  departmentId: integer("department_id").notNull(),
  joinDate: date("join_date").notNull(),
  uniqueLink: text("unique_link").notNull().unique(),
  linkExpiry: date("link_expiry"),
  responsibilities: text("responsibilities"),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: uuid("created_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertMemberSchema = createInsertSchema(membersTable).omit({ memberId: true, createdAt: true });
export type InsertMember = z.infer<typeof insertMemberSchema>;
export type Member = typeof membersTable.$inferSelect;
