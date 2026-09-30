# Solvian Digital Command Centre

Internal Work & Outcome Management for Solvian Group — connecting **people → work → process → tasks → documents → outcomes** across nine verticals.

Leadership can answer:

- What work exists, and who is doing it?
- Which process does it belong to, and what is the status?
- Why is it delayed, and who is overloaded?
- What outcome was achieved?

## Architecture

```text
work-management-platform/
  apps/web          React + Vite + MUI
  apps/api          NestJS + Prisma + Socket.IO
  packages/types    Shared enums
  prisma/           Schema, migrations, seed
  docker/           Container build files
```

## Prerequisites

- Node.js 20+
- npm 10+
- Docker Desktop (for PostgreSQL, or the full stack)

## 1. Install dependencies

From the repository root:

```bash
npm install
```

## 2. Configure environment

Copy the example file (already present as `.env.example`):

```bash
copy .env.example .env
```

On macOS/Linux:

```bash
cp .env.example .env
```

Required variables:

```text
DATABASE_URL=postgresql://wmp:wmp_dev_password@127.0.0.1:5434/work_management
JWT_SECRET=change-me-access-secret-min-32-characters
JWT_REFRESH_SECRET=change-me-refresh-secret-min-32-characters
PORT=3001
FRONTEND_URL=http://localhost:5173
FILE_STORAGE_PATH=./uploads
MAX_FILE_SIZE=10485760
```

Never commit real secrets. `.env` is gitignored.

## 3. Start PostgreSQL

```bash
docker compose up postgres -d
```

PostgreSQL is published on host port **5434** (container 5432) so it does not collide with a local Postgres install. If you prefer another port, change the mapping in `docker-compose.yml` and `DATABASE_URL`.

## 4. Generate the Prisma client, run migrations, seed

```bash
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed
```

If the database already exists and you only need schema apply:

```bash
npx prisma migrate deploy
npm run prisma:seed
```

## 5. Start backend

```bash
npm run dev:api
```

API: `http://localhost:3001/api`  
Swagger: `http://localhost:3001/api/docs`  
Health: `http://localhost:3001/api/health`

## 6. Start frontend

In a second terminal:

```bash
npm run dev:web
```

App: `http://localhost:5173`

Or run both:

```bash
npm run dev
```

## Demo accounts

Password for all seed users: **`Welcome123!`**

| Role | Email |
| --- | --- |
| Group Leadership | `vinay.phadnis@solvian.local` |
| Admin | `admin@solvian.local` |
| Super Admin | `superadmin@solvian.local` |
| Vertical CEO (Arica) | `sahil.phadnis@solvian.local` |
| Operating CEO (SIPL) | `uday.kulkarni@solvian.local` |
| Project manager | `kunal.dhonge@solvian.local` |

The seed includes departments, teams, processes, work items, tasks, outcomes, comments, documents metadata, notifications, and audit history.

## Tests

```bash
npm run test:api
npm run test:web
npm test
```

## Production build

```bash
npx prisma generate
npm run build
```

Backend output: `apps/api/dist`  
Frontend output: `apps/web/dist`

Start the API in production:

```bash
npm run start:prod -w @wmp/api
```

Serve the frontend with any static host (or the nginx container below).

## Docker (full stack)

```bash
docker compose up --build
```

- Web: `http://localhost:5173`
- API: `http://localhost:3001/api`

The API container runs migrations and seed on start.

## Authorization model

| Role | Access |
| --- | --- |
| VP | Company-wide visibility: work, outcomes, reports, resources |
| Department Head | Department work, assignment, outcome review |
| Manager | Team work, assign/update tasks, reviews |
| Employee | Own work, documents, comments, permitted outcome updates |
| Admin / Super Admin | Users, roles, permissions, org structure, processes, settings |

Permissions are enforced on the API (`JwtAuthGuard` + `PermissionsGuard`). The UI hides navigation the user cannot use, but it is not the security boundary.

## Real-time

Socket.IO events:

- `work.created` / `work.updated` / `work.statusChanged`
- `task.updated`
- `document.uploaded`
- `comment.created`
- `notification.created`

## Documents

Files are stored on disk via `DocumentStorageService` (local adapter). Swap the provider later for S3, Azure Blob, or MinIO without changing controllers. PostgreSQL stores metadata only.

Allowed types: PDF, DOC/DOCX, XLS/XLSX, CSV, PPT/PPTX, PNG, JPG, TXT. Default max size: 10 MB.

## API overview

| Method | Path |
| --- | --- |
| POST | `/api/auth/login` |
| POST | `/api/auth/refresh` |
| POST | `/api/auth/logout` |
| GET | `/api/users` |
| GET/POST | `/api/departments` |
| GET/POST | `/api/teams` |
| GET/POST | `/api/processes` |
| GET/POST | `/api/work-items` |
| GET/PUT | `/api/work-items/:id` |
| GET/POST | `/api/tasks` |
| GET/POST | `/api/work-items/:id/documents` |
| GET/POST | `/api/work-items/:id/comments` |
| PUT | `/api/work-items/:id/outcome` |
| GET | `/api/dashboard/executive` |
| GET | `/api/dashboard/manager` |
| GET | `/api/dashboard/employee` |
| GET | `/api/reports/work` |
| GET | `/api/reports/outcomes` |
| GET | `/api/search?q=` |

Error shape:

```json
{
  "success": false,
  "message": "Work item could not be updated",
  "code": "WORK_ITEM_UPDATE_FAILED"
}
```

## AI-ready later

Work items, processes, outcomes, audit logs, and comments are first-class entities with stable IDs and filters. Future features (executive summaries, bottleneck detection, natural-language dashboards) can query the same APIs without a schema rewrite.

## License

Internal use.
