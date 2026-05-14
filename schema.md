# AMUPF Digital Management System — Database Schema

> Generated: May 2026  
> Database: PostgreSQL via Drizzle ORM  
> Location: `lib/db/src/schema/`

---

## Enums

| Enum | Values |
|------|--------|
| `user_role` | `student`, `member`, `executive`, `president`, `higher_official` |
| `report_category` | `physical`, `verbal`, `property`, `mental_health`, `other` |
| `report_status` | `pending`, `in_progress`, `on_hold`, `resolved`, `rejected`, `escalated` |
| `handling_method` | `in_person`, `phone`, `email`, `other` |
| `member_position` | `member`, `secretary`, `coordinator`, `vice_president`, `president` |
| `member_status` | `active`, `inactive`, `suspended` |
| `task_priority` | `low`, `medium`, `high`, `urgent` |
| `task_status` | `pending`, `in_progress`, `completed`, `cancelled` |
| `announcement_type` | `public`, `members_only`, `department`, `executive`, `urgent` |
| `event_audience` | `all`, `members`, `executives` |
| `attendance_status` | `present`, `absent`, `excused` |
| `delegation_permission` | `kyc_approval`, `member_edit`, `case_reassign`, `announcement`, `data_export` |
| `notification_type` | `new_report`, `status_update`, `task_assigned`, `announcement`, `kyc_result`, `general` |

---

## Tables

### `users`
| Column | Type | Notes |
|--------|------|-------|
| `user_id` | `uuid` PK | Auto-generated UUID |
| `full_name` | `text` | NOT NULL |
| `email` | `text` | NOT NULL, UNIQUE |
| `password_hash` | `text` | bcrypt hashed |
| `role` | `user_role` | Default: `student` |
| `student_id` | `text` | NOT NULL, UNIQUE |
| `phone` | `text` | NOT NULL |
| `department_id` | `integer` | FK → departments.id (nullable) |
| `profile_photo` | `text` | URL (nullable) |
| `id_front_url` | `text` | KYC document front |
| `id_back_url` | `text` | KYC document back |
| `is_approved` | `boolean` | Default: `false` (KYC gate) |
| `approved_by` | `uuid` | FK → users.user_id (nullable) |
| `approved_at` | `timestamptz` | nullable |
| `rejection_reason` | `text` | nullable |
| `login_attempts` | `integer` | Default: `0` (rate limiting) |
| `locked_until` | `timestamptz` | nullable (lockout expiry) |
| `is_active` | `boolean` | Default: `true` |
| `created_at` | `timestamptz` | Default: NOW() |

---

### `departments`
| Column | Type | Notes |
|--------|------|-------|
| `id` | `serial` PK | Auto-increment |
| `name` | `text` | NOT NULL, UNIQUE |
| `description` | `text` | nullable |
| `executive_id` | `uuid` | FK → users.user_id (nullable) |

---

### `reports`
| Column | Type | Notes |
|--------|------|-------|
| `report_id` | `uuid` PK | Auto-generated UUID |
| `student_id` | `uuid` | FK → users.user_id (nullable for anon) |
| `department_id` | `integer` | FK → departments.id, NOT NULL |
| `title` | `text` | NOT NULL |
| `description` | `text` | NOT NULL |
| `location` | `text` | NOT NULL |
| `incident_date` | `timestamptz` | NOT NULL |
| `category` | `report_category` | NOT NULL |
| `status` | `report_status` | Default: `pending` |
| `evidence_urls` | `text[]` | Array of URL strings |
| `is_anonymous` | `boolean` | Default: `false` |
| `anonymous_token` | `text` | nullable (anonymous tracking) |
| `resolved_by` | `uuid` | FK → users.user_id (nullable) |
| `resolution_summary` | `text` | nullable |
| `rejection_reason` | `text` | nullable |
| `president_notes` | `text` | nullable |
| `executive_notes` | `text` | nullable |
| `handling_method` | `handling_method` | nullable |
| `feedback_rating` | `integer` | 1–5 (nullable) |
| `feedback_comment` | `text` | nullable |
| `created_at` | `timestamptz` | Default: NOW() |

---

### `members`
| Column | Type | Notes |
|--------|------|-------|
| `member_id` | `uuid` PK | Auto-generated UUID |
| `user_id` | `uuid` | FK → users.user_id, UNIQUE, NOT NULL |
| `position` | `member_position` | Default: `member` |
| `department_id` | `integer` | FK → departments.id, NOT NULL |
| `join_date` | `date` | NOT NULL |
| `unique_link` | `text` | UNIQUE (digital membership link) |
| `link_expiry` | `date` | nullable |
| `responsibilities` | `text` | nullable |
| `is_active` | `boolean` | Default: `true` |
| `created_by` | `uuid` | FK → users.user_id, NOT NULL |
| `created_at` | `timestamptz` | Default: NOW() |

---

### `tasks`
| Column | Type | Notes |
|--------|------|-------|
| `task_id` | `uuid` PK | Auto-generated UUID |
| `title` | `text` | NOT NULL |
| `description` | `text` | NOT NULL |
| `assigned_to` | `uuid` | FK → users.user_id, NOT NULL |
| `assigned_by` | `uuid` | FK → users.user_id, NOT NULL |
| `department_id` | `integer` | FK → departments.id (nullable) |
| `priority` | `task_priority` | NOT NULL |
| `status` | `task_status` | Default: `pending` |
| `due_date` | `date` | nullable |
| `related_report_id` | `uuid` | FK → reports.report_id (nullable) |
| `completed_at` | `timestamptz` | nullable |
| `created_at` | `timestamptz` | Default: NOW() |

---

### `announcements`
| Column | Type | Notes |
|--------|------|-------|
| `id` | `serial` PK | Auto-increment |
| `title` | `text` | NOT NULL |
| `content` | `text` | NOT NULL |
| `type` | `announcement_type` | NOT NULL |
| `department_id` | `integer` | FK → departments.id (nullable, for dept-scoped) |
| `author_id` | `uuid` | FK → users.user_id, NOT NULL |
| `created_at` | `timestamptz` | Default: NOW() |

---

### `events`
| Column | Type | Notes |
|--------|------|-------|
| `id` | `serial` PK | Auto-increment |
| `name` | `text` | NOT NULL |
| `description` | `text` | nullable |
| `event_date` | `timestamptz` | NOT NULL |
| `location` | `text` | NOT NULL |
| `max_attendees` | `integer` | nullable (open if null) |
| `target_audience` | `event_audience` | Default: `all` |
| `created_by` | `uuid` | FK → users.user_id, NOT NULL |
| `created_at` | `timestamptz` | Default: NOW() |

---

### `event_registrations`
| Column | Type | Notes |
|--------|------|-------|
| `id` | `serial` PK | Auto-increment |
| `event_id` | `integer` | FK → events.id, NOT NULL |
| `user_id` | `uuid` | FK → users.user_id, NOT NULL |
| `created_at` | `timestamptz` | Default: NOW() |

---

### `attendance_records`
| Column | Type | Notes |
|--------|------|-------|
| `id` | `serial` PK | Auto-increment |
| `event_id` | `integer` | FK → events.id, NOT NULL |
| `member_id` | `uuid` | FK → members.member_id, NOT NULL |
| `status` | `attendance_status` | NOT NULL |
| `notes` | `text` | nullable |
| `created_at` | `timestamptz` | Default: NOW() |

---

### `delegations`
| Column | Type | Notes |
|--------|------|-------|
| `delegation_id` | `uuid` PK | Auto-generated UUID |
| `granted_by` | `uuid` | FK → users.user_id, NOT NULL (president) |
| `granted_to` | `uuid` | FK → users.user_id, NOT NULL (executive) |
| `permission` | `delegation_permission` | NOT NULL |
| `expires_at` | `date` | nullable (null = no expiry) |
| `is_active` | `boolean` | Default: `true` |
| `revoked_at` | `timestamptz` | nullable |
| `created_at` | `timestamptz` | Default: NOW() |

---

### `notifications`
| Column | Type | Notes |
|--------|------|-------|
| `id` | `serial` PK | Auto-increment |
| `user_id` | `uuid` | FK → users.user_id, NOT NULL |
| `type` | `notification_type` | NOT NULL |
| `title` | `text` | NOT NULL |
| `message` | `text` | NOT NULL |
| `related_id` | `text` | nullable (ID of related entity) |
| `is_read` | `boolean` | Default: `false` |
| `created_at` | `timestamptz` | Default: NOW() |

---

### `audit_logs`
| Column | Type | Notes |
|--------|------|-------|
| `log_id` | `serial` PK | Auto-increment |
| `user_id` | `uuid` | FK → users.user_id (nullable — system actions) |
| `action_type` | `text` | e.g. `CREATE`, `UPDATE`, `DELETE` |
| `entity_type` | `text` | e.g. `report`, `user`, `member` |
| `entity_id` | `text` | ID of the affected record |
| `old_values` | `jsonb` | nullable (before state) |
| `new_values` | `jsonb` | nullable (after state) |
| `ip_address` | `text` | nullable |
| `user_agent` | `text` | nullable |
| `created_at` | `timestamptz` | Default: NOW() |

---

## Relationships Summary

```
users ──< reports (student_id)
users ──< members (user_id, 1:1)
users ──< tasks (assigned_to, assigned_by)
users ──< notifications (user_id)
users ──< delegations (granted_by, granted_to)
users ──< announcements (author_id)
users ──< events (created_by)
users ──< event_registrations (user_id)
users ──< audit_logs (user_id)

departments ──< users (department_id)
departments ──< reports (department_id)
departments ──< members (department_id)
departments ──< tasks (department_id)
departments ──< announcements (department_id)

reports ──< tasks (related_report_id)

events ──< event_registrations (event_id)
events ──< attendance_records (event_id)

members ──< attendance_records (member_id)
```

---

## API Routes Summary

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/healthz` | None | Health check |
| POST | `/api/auth/register` | None | Student registration + KYC submission |
| POST | `/api/auth/login` | None | Login, returns JWT |
| POST | `/api/auth/logout` | Auth | Logout |
| GET | `/api/auth/me` | Auth | Get current user |
| POST | `/api/auth/refresh` | None | Refresh access token |
| GET | `/api/departments` | None | List all departments |
| POST | `/api/departments` | President | Create department |
| GET | `/api/departments/:id` | None | Get department |
| PATCH | `/api/departments/:id` | President | Update department |
| GET | `/api/users` | Executive+ | List users (filterable) |
| GET | `/api/users/kyc-queue` | Executive+ | KYC pending queue |
| GET | `/api/users/:id` | Auth | Get user profile |
| PATCH | `/api/users/:id` | President | Update user |
| POST | `/api/users/:id/approve` | Executive+ | Approve KYC |
| POST | `/api/users/:id/reject` | Executive+ | Reject KYC with reason |
| GET | `/api/reports` | Auth | List reports (role-filtered) |
| POST | `/api/reports` | Auth | Submit incident report |
| GET | `/api/reports/:id` | Auth | Get report detail |
| PATCH | `/api/reports/:id` | Auth | Update report fields |
| PATCH | `/api/reports/:id/status` | Executive+ | Update report status |
| POST | `/api/reports/:id/feedback` | Auth | Submit resolution feedback |
| GET | `/api/members` | Auth | List peace forum members |
| POST | `/api/members` | President | Add new member |
| GET | `/api/members/link/:uniqueLink` | Executive+ | Get member by secure link |
| GET | `/api/members/:id` | Auth | Get member profile |
| PATCH | `/api/members/:id` | Executive+ | Update member |
| DELETE | `/api/members/:id` | President | Remove member |
| POST | `/api/members/:id/regenerate-link` | President | Regenerate member link |
| GET | `/api/tasks` | Auth | List tasks (role-filtered) |
| POST | `/api/tasks` | Executive+ | Create task |
| GET | `/api/tasks/:id` | Auth | Get task |
| PATCH | `/api/tasks/:id` | Auth | Update task |
| DELETE | `/api/tasks/:id` | Executive+ | Delete task |
| GET | `/api/announcements` | None | List announcements |
| POST | `/api/announcements` | Executive+ | Create announcement |
| GET | `/api/announcements/:id` | None | Get announcement |
| PATCH | `/api/announcements/:id` | Executive+ | Update announcement |
| DELETE | `/api/announcements/:id` | President | Delete announcement |
| GET | `/api/events` | None | List events |
| POST | `/api/events` | Executive+ | Create event |
| GET | `/api/events/:id` | None | Get event |
| PATCH | `/api/events/:id` | Executive+ | Update event |
| DELETE | `/api/events/:id` | President | Delete event |
| POST | `/api/events/:id/register` | Auth | Register for event |
| GET | `/api/attendance` | Auth | List attendance records |
| POST | `/api/attendance` | Executive+ | Record attendance |
| GET | `/api/delegations` | President | List delegations |
| POST | `/api/delegations` | President | Create delegation |
| POST | `/api/delegations/:id/revoke` | President | Revoke delegation |
| GET | `/api/notifications` | Auth | List notifications |
| POST | `/api/notifications/read-all` | Auth | Mark all as read |
| POST | `/api/notifications/:id/read` | Auth | Mark one as read |
| GET | `/api/analytics/public-stats` | None | Public statistics |
| GET | `/api/analytics/dashboard` | Auth | Dashboard KPIs |
| GET | `/api/analytics/reports-summary` | Auth | Reports breakdown |
| GET | `/api/analytics/member-activity` | Auth | Member activity stats |
| GET | `/api/analytics/department-performance` | Auth | Dept performance table |

---

## User Role Permissions

| Action | Student | Member | Executive | President | Higher Official |
|--------|---------|--------|-----------|-----------|-----------------|
| Submit report | ✓ | ✓ | ✓ | ✓ | — |
| View own reports | ✓ | ✓ | ✓ | ✓ | — |
| View dept reports | — | — | ✓ | ✓ | ✓ |
| Update report status | — | — | ✓ | ✓ | — |
| Approve/reject KYC | — | — | ✓* | ✓ | — |
| Manage members | — | — | ✓ | ✓ | — |
| Create announcements | — | — | ✓ | ✓ | — |
| Create events | — | — | ✓ | ✓ | — |
| Assign tasks | — | — | ✓ | ✓ | — |
| View analytics | — | — | ✓ | ✓ | ✓ |
| Manage departments | — | — | — | ✓ | — |
| Manage delegations | — | — | — | ✓ | — |
| Export data | — | — | — | ✓* | ✓ |

*With delegation from President
