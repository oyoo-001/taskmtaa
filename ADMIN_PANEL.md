# Admin Console

A complete moderation area for TaskMtaa administrators.

## 1. Set up the database

The migration adds the admin/moderation columns and the audit log table:

```bash
npm run migrate
```

New columns on `users`:

| Column | Purpose |
| --- | --- |
| `is_admin` | Grants access to `/admin` and the admin API |
| `is_suspended` | Blocks login and authenticated API access |
| `suspension_reason` | Reason shown to the suspended user |
| `suspended_at` | When the suspension started |
| `verified_at` | When the verification badge was granted |
| `is_verified` | Controls the blue badge next to the user's name (already existed) |

Also created: `admin_audit_logs` for recording every moderation action.

## 2. Create the first admin

```bash
npm run create-admin -- admin@taskmtaa.com "StrongPassword123!" "Platform Admin"
```

Or with environment variables:

```bash
ADMIN_EMAIL=admin@taskmtaa.com ADMIN_PASSWORD="StrongPassword123!" ADMIN_NAME="Platform Admin" npm run create-admin
```

Running the command again with an existing email promotes that account instead of
creating a duplicate.

## 3. Access

Sign in with the admin account, open the user menu (avatar, top-right), and choose
**Admin Console**. Direct URL: `/admin/dashboard`.

## Permissions

| Area | What admins can do |
| --- | --- |
| Dashboard | Platform counts, newest users/jobs, recent admin actions |
| Users | Search/filter every account, see ratings and activity, verify/unverify, suspend/reinstate with a reason, delete |
| Posted Jobs | View every job with poster, budget, bids and status; delete any job |
| Feedback | Read written reviews and all platform chat messages; delete either |
| Ratings | Per-user average, review count and 1–5 star distribution |
| Audit log | `GET /api/v1/admin/audit-logs` (also surfaced on the dashboard) |

Suspension takes effect immediately: `authenticateToken` checks the account state in
the database on every authenticated request, and login is rejected for suspended
accounts. Admins cannot suspend or delete their own account, and admin accounts
cannot be deleted.

## Verification badge

`client/src/components/VerifiedBadge.jsx` renders a blue `BadgeCheck` next to a
user's name whenever `is_verified` is true. It is used in:

- Navbar (desktop user menu and mobile menu)
- Task cards and task details (poster and applicants)
- Messages (conversation list and chat header)
- Home page featured taskers
- Profile page
- Admin dashboard, users, jobs, feedback and ratings tables

The backend exposes `poster_verified`, `tasker_verified`, `sender_verified`,
`receiver_verified`, `other_user_verified` and `reviewer_verified` /
`reviewee_verified` fields on the relevant queries so the badge can be shown
wherever a name appears.

## API summary

All routes require `authenticateToken` + `requireAdmin`.

```
GET    /api/v1/admin/stats
GET    /api/v1/admin/users
GET    /api/v1/admin/users/:id
PATCH  /api/v1/admin/users/:id/verify      { is_verified }
PATCH  /api/v1/admin/users/:id/suspend     { suspend, reason }
DELETE /api/v1/admin/users/:id
GET    /api/v1/admin/tasks
DELETE /api/v1/admin/tasks/:id
GET    /api/v1/admin/feedback/reviews
DELETE /api/v1/admin/feedback/reviews/:id
GET    /api/v1/admin/feedback/messages
DELETE /api/v1/admin/feedback/messages/:id
GET    /api/v1/admin/ratings
GET    /api/v1/admin/audit-logs
```

List endpoints accept `page`, `limit`, and `search`; users accept `status`
(`verified`, `unverified`, `suspended`, `active`, `admin`); jobs accept `status`
and `category`.
