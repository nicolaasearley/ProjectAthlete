Project Athlete — PRD & Implementation Plan (v2)

Status: Draft

Author: ChatGPT (for developer handoff to Claude AI)

⸻

1. Purpose & Background

Rebuild the existing Project Athlete web app from the ground up with a clean, maintainable architecture and strong UX. The current application was pieced together and needs a proper Product Requirements Document (PRD), architecture, data migration plan, and implementation checklist so Claude AI (or an engineering team) can build a reliable v2 that is self-hosted in Docker on a home server.

Goals:
	•	Preserve existing user & workout data.
	•	Provide robust role-based features (User, Coach, Admin).
	•	Enable social interactions, leaderboard/challenges, and logging with modern UI.
	•	Deliver a secure, maintainable, and easy-to-deploy Docker-based app.

Success metrics (examples to measure later):
	•	Data migration success: 100% of active user accounts and workouts available in v2.
	•	Functional: All feature acceptance criteria pass QA.
	•	Performance: App responds within 300ms for primary endpoints on home server hardware.
	•	Uptime/Recoverability: Backups & restore validated monthly.

⸻

2. Personas
	•	Regular User: Creates personal workouts, logs weights, participates in monthly challenges, posts to social feed.
	•	Coach: Creates community workouts, sets monthly challenges, can moderate content, view challenge analytics.
	•	Admin: Full access to system settings, user management, backups, and system logs.

⸻

3. Key Features & Acceptance Criteria

3.1 Authentication & Authorization
	•	Email/password sign up and login.
	•	Optional social OAuth (Google) later.
	•	Roles: user, coach, admin.
	•	Account verification flow (email).

Acceptance: Users can register, verify via email, and sign in; role-based routes protected.

3.2 User-created workouts (private)
	•	CRUD for workouts that belong to a user and default to private.
	•	Workouts have metadata: title, description, exercises (ordered), sets/reps, estimated time, tags, notes.

Acceptance: A user can create/edit/delete a workout and it is visible only to them.

3.3 Coach-created workouts (community)
	•	Coaches create workouts flagged as “community” or “public”.
	•	Community workouts are visible to all users and can be favorited or copied to personal library.

Acceptance: Coaches can publish community workouts; users can copy and run them.

3.4 Weight logging
	•	Allow users to record weight per exercise per workout/session.
	•	History and simple graphs (client-side charting from API data).

Acceptance: Users save and retrieve weight entries; chart displays historical progression.

3.5 Leaderboards on community workouts
	•	When a community workout includes a measurable metric (time, reps, load), users can submit results and be ranked.
	•	Support workout result type tags (time, reps, weight, distance).

Acceptance: Users submit results for community workouts; leaderboard ranks users and supports pagination and filters (month/overall).

3.6 Monthly Challenges
	•	Coaches create monthly challenges (start/end date + metric type + target or cumulative goal).
	•	Users log progress against the challenge (manual entry or attach from workout/steps import in future).
	•	Challenge leaderboard shows aggregated totals and ranks users.

Acceptance: Coach can create a challenge; users submit progress; leaderboard updates.

3.7 Social Feed
	•	Users post text + optional photo/video upload (limited size), caption, exercise tags, and privacy options (public/private/friends-only if implemented later).
	•	Posts support comments and reactions (like/emoji).
	•	Content moderation flags and coach/admin tools to remove content.

Acceptance: Users create posts; other users can comment and react; coaches/admins can moderate.

3.8 Notifications
	•	In-app notifications for comments, reactions, challenge leaderboard updates, coach announcements.
	•	Email notifications for important events (welcome, password reset, major announcements).

Acceptance: Notifications are delivered and viewable in-app; email templates can be triggered.

3.9 File Uploads
	•	Photo and short video uploads for social posts (limits: e.g., 10MB image, 25MB video — configurable).
	•	Store uploads on local filesystem (or optional cloud) with versioned path and purge/retention policy.

Acceptance: Files upload, stream to clients, and are safely stored on server volumes.

3.10 Admin Tools
	•	User management, content moderation, system status, backups and restore.

Acceptance: Admin can list, suspend, or delete users and manage content.

⸻

4. Non-Functional Requirements
	•	Self-hosting: App runs inside Docker Compose or Docker Swarm on home server.
	•	Data store: Primary database should be PostgreSQL running as a Docker container (persistent volume) — better long-term reliability than a single-file DB for concurrent writes and scaling. SQLite may be supported for single-user dev setups only.
	•	Authentication security: Passwords hashed with bcrypt/Argon2. JWT or session cookies for auth; HTTPS enforced by reverse proxy (Traefik or Nginx) with automated certs.
	•	Backups: Nightly DB dumps to a mounted backup volume, rotate last N copies; option to sync backups to an external storage (USB/NAS) or cloud.
	•	Monitoring: Lightweight metrics/health endpoints; basic logging aggregated to files; optional Grafana/Prometheus later.
	•	Privacy & compliance: Opt-in email and proper data deletion flow.
	•	Performance: Reasonable concurrency for a small community (100–1000 users).

⸻

5. Tech Stack Recommendations
	•	Backend: Node.js + TypeScript with NestJS or Express + TypeORM/Prisma OR Python (FastAPI) + SQLAlchemy. Recommendation: Node + TypeScript + Prisma for rapid schema migrations and good DX.
	•	Database: PostgreSQL (Docker). Use a managed DB only if you want cloud-hosted; otherwise local Postgres with proper backups.
	•	Auth: JWT + HTTP-only refresh token cookie; email verification via SMTP (local Postfix or external SMTP provider).
	•	File storage: Local filesystem under a Docker volume (e.g., /data/uploads). Optionally integrate S3-compatible (MinIO) for easier scaling.
	•	Frontend: React (Vite) + TypeScript. Styling: Tailwind CSS and component tokens that reflect Apple iOS 26 Liquid Glass aesthetic (glassmorphism, depth, frosted blur, soft gradients). Consider headless UI or shadcn components.
	•	Media processing: FFmpeg in a worker container for thumbnail extraction and transcoding of uploads.
	•	Reverse proxy / TLS: Traefik or Nginx as Docker container with Let’s Encrypt (or local certs for LAN).
	•	Orchestration: Docker Compose for simplicity. Leave option to move to Docker Swarm or k8s later.

⸻

6. Data Migration Strategy
	1.	Audit current DB file: Determine current DB type (likely SQLite or JSON files) located in project folder. Export full dump or CSVs for each table.
	2.	Schema mapping: Compare old schema to new schema. Create migrations in Prisma/TypeORM.
	3.	Sanitize & transform: Normalize user IDs, handle duplicate emails, map workout fields, media file paths (copy media to new uploads folder and update DB paths).
	4.	Test migration locally: Run migration on a copy dataset and validate integrity (users match, workouts count matches, media loads).
	5.	Cutover: Put old app into read-only mode, run migration, validate, then switch DNS / reverse proxy to v2.
	6.	Rollback plan: Keep a DB dump and snapshot of uploads before cutover.

Notes: If the current DB is a single-file SQLite and the dataset is small, a direct SQLite -> Postgres migration script can be used. For consistent long-term use, prefer Postgres.

⸻

7. High-Level Architecture
	•	Client (React) <–> API Gateway (Express/NestJS) <–> Postgres DB
	•	File uploads saved to shared volume or MinIO.
	•	Worker container for video processing and heavy tasks.
	•	Traefik reverse proxy with TLS termination and optional BasicAuth for admin endpoints.
	•	Docker Compose defines services: web, api, db, redis (optional for caching/session), worker, traefik, mailer, backups.

⸻

8. Data Model (high level)
	•	users: id, email, password_hash, display_name, role, created_at, last_active, profile_picture_path
	•	workouts: id, owner_user_id (nullable if coach/global), title, type (personal/community), exercises (json or normalized tables), created_at, tags
	•	exercises: id, name, description, default_metrics (weight/reps/time/distance)
	•	workout_runs / sessions: id, user_id, workout_id, date, results (json), notes
	•	weight_logs: id, user_id, exercise_id, workout_run_id (nullable), weight, reps, date
	•	posts: id, user_id, text, media_paths[], created_at
	•	comments: id, post_id, user_id, text, created_at
	•	reactions: id, target_type, target_id, user_id, reaction_type
	•	challenges: id, coach_id, metric_type, start_at, end_at, description
	•	challenge_entries: id, challenge_id, user_id, value, date

⸻

9. API Design (selected endpoints)
	•	POST /api/auth/register — register
	•	POST /api/auth/login — login
	•	GET /api/users/me — profile
	•	POST /api/workouts — create workout
	•	GET /api/workouts?type=community — list community workouts
	•	POST /api/workouts/:id/run — submit result
	•	POST /api/weight — log weight
	•	POST /api/posts — create post (multipart)
	•	GET /api/leaderboards/workout/:id — leaderboard
	•	POST /api/challenges — coach create challenge
	•	POST /api/challenges/:id/entry — user submit

Include pagination, filtering, and consistent error responses.

⸻

10. Dev & Release Checklist
	•	Initialize monorepo: packages/frontend, packages/backend, packages/shared (types)
	•	Create Prisma schema & initial migrations
	•	Implement auth flow and role middleware
	•	Implement core workout CRUD + workout runs
	•	Implement weight logging + basic charting on frontend
	•	Social feed (post/comment/reaction)
	•	Monthly challenges & leaderboards
	•	Media uploads + worker for processing
	•	Admin panel + moderation tools
	•	Tests: unit + integration for critical endpoints
	•	Docker Compose files and .env.example
	•	DB backup & restore scripts
	•	Healthchecks & logging
	•	Migration script for old DB and media
	•	QA checklist and acceptance tests

⸻

11. Security & Privacy
	•	Hash passwords with Argon2 or bcrypt.
	•	Rate-limit auth endpoints.
	•	Use HTTPS always.
	•	Validate and sanitize file uploads and text fields to prevent XSS and injection.
	•	Provide account deletion endpoint that removes user data and media.

⸻

12. Monitoring & Maintenance
	•	Log errors to files; rotate logs.
	•	Periodic DB vacuum/pg_repack when needed.
	•	Simple health endpoint /healthz returning service status.
	•	Scheduled DB backup job running inside backup container.

⸻

13. Design Guidance
	•	Aim for a clean, modern look based on iOS 26 Liquid Glass: glassy cards, frosted blur backgrounds, soft shadows, minimal iconography, large readable typography.
	•	Use Tailwind for tokens; create a design token config for glass colors, blur levels, and elevation.
	•	Provide a small design system (buttons, cards, inputs, modals) and component library to keep styling consistent.

⸻

14. Additional Feature Suggestions (optional)
	•	Friends / Following: let users follow each other for a more curated feed.
	•	Import Steps / Wearable data: CSV import or step integrations later.
	•	Public Profiles: sharable public profile pages for user highlights.
	•	Webhooks / Integrations: allow exporting results to external services or Slack.
	•	Dark Mode: essential for modern UIs.

⸻

15. Migration & Handoff Notes for Claude AI
	•	Provide Claude with the Old_Site folder. The migration script should read the existing DB file(s) and media folder(s), transform rows to the new schema, and copy media to /data/uploads/<user_id>/... updating DB paths.
	•	Share env.example and docker-compose.yml templates for the home server.
	•	Include an admin CLI script for running the migration and verifying counts.

⸻

16. Next Steps (developer actions)
	1.	Inventory: Confirm the current DB type and size; provide an export or the DB file.
	2.	Project skeleton: create monorepo and basic Docker Compose with Postgres and API shell.
	3.	Migration test: run migration locally with subset of data.
	4.	Implement core auth and workout flows.
	5.	Iterate UI with design tokens and demo pages.

⸻

Appendix A — Example docker-compose services (sketch)

version: '3.8'
services:
  traefik:
    image: traefik:latest
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - ./traefik/traefik.yml:/traefik.yml
  db:
    image: postgres:15
    volumes:
      - pgdata:/var/lib/postgresql/data
  api:
    build: ./packages/backend
    depends_on: [db]
    volumes:
      - ./packages/backend:/app
  web:
    build: ./packages/frontend
    depends_on: [api]
  worker:
    build: ./packages/worker
    depends_on: [api]
  backups:
    image: appropriate/curl
    volumes:
      - ./backups:/backups
volumes:
  pgdata:


⸻

End of PRD draft.