import { pgTable, text, boolean, timestamp, uuid, date } from "drizzle-orm/pg-core";
import { pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const delegationPermissionEnum = pgEnum("delegation_permission", ["kyc_approval", "member_edit", "case_reassign", "announcement", "data_export"]);

export const delegationsTable = pgTable("delegations", {
  delegationId: uuid("delegation_id").primaryKey().defaultRandom(),
  grantedBy: uuid("granted_by").notNull(),
  grantedTo: uuid("granted_to").notNull(),
  permission: delegationPermissionEnum("permission").notNull(),
  expiresAt: date("expires_at"),
  isActive: boolean("is_active").notNull().default(true),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertDelegationSchema = createInsertSchema(delegationsTable).omit({ delegationId: true, createdAt: true });
export type InsertDelegation = z.infer<typeof insertDelegationSchema>;
export type Delegation = typeof delegationsTable.$inferSelect;
