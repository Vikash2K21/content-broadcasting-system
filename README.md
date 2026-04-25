# Content Broadcasting System

A backend system for broadcasting educational content from teachers to students,
built with Node.js, Express, and PostgreSQL.

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** PostgreSQL
- **Auth:** JWT + bcrypt
- **File Upload:** Multer (local storage)
- **Security:** Helmet, express-rate-limit, CORS

---

## Setup Instructions

### Prerequisites

- Node.js v18+
- PostgreSQL 14+

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd content-broadcasting-system
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your DB credentials and JWT secret
```

**Required `.env` values:**
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=content_broadcasting
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_strong_secret
PORT=3000
```

### 3. Create Database

```sql
-- In psql:
CREATE DATABASE content_broadcasting;
```

### 4. Run Migrations

```bash
npm run migrate
```

### 5. Seed Demo Data

```bash
npm run seed
```

Demo credentials after seeding:
| Role      | Email                      | Password     |
|-----------|----------------------------|--------------|
| Principal | principal@school.com       | principal123 |
| Teacher 1 | teacher1@school.com        | teacher123   |
| Teacher 2 | teacher2@school.com        | teacher123   |

### 6. Start Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Server runs at: `

---

## API Reference

### Auth Endpoints`http://localhost:3000

| Method | Endpoint             | Auth    | Description          |
|--------|----------------------|---------|----------------------|
| POST   | /api/auth/register   | None    | Register new user    |
| POST   | /api/auth/login      | None    | Login + get token    |
| GET    | /api/auth/me         | Bearer  | Get current user     |

#### POST /api/auth/login
```json
{
  "email": "teacher1@school.com",
  "password": "teacher123"
}
```
Response includes a `token` — use it as `Authorization: Bearer <token>`.

---

### Content Endpoints (Protected)

| Method | Endpoint                | Role        | Description               |
|--------|-------------------------|-------------|---------------------------|
| POST   | /api/content/upload     | Teacher     | Upload new content        |
| GET    | /api/content/my         | Teacher     | View own uploaded content |
| GET    | /api/content            | Principal   | View all content          |
| GET    | /api/content/pending    | Principal   | View pending content      |
| GET    | /api/content/:id        | Both        | Get single content item   |

#### POST /api/content/upload
`Content-Type: multipart/form-data`

| Field             | Type    | Required | Description                     |
|-------------------|---------|----------|---------------------------------|
| title             | string  | Yes      | Content title                   |
| file              | file    | Yes      | JPG, PNG, or GIF (max 10MB)     |
| subject           | string  | Yes      | e.g., maths, science            |
| description       | string  | No       | Optional description            |
| start_time        | ISO date| No*      | When content becomes active     |
| end_time          | ISO date| No*      | When content becomes inactive   |
| rotation_duration | integer | No       | Minutes per rotation slot (default: 5) |

*start_time and end_time must both be provided or both omitted.
Without them, content will never go live.

---

### Approval Endpoints (Principal Only)

| Method | Endpoint                  | Description              |
|--------|---------------------------|--------------------------|
| PATCH  | /api/approval/:contentId  | Approve or reject content|

#### PATCH /api/approval/:contentId
```json
// To approve:
{ "action": "approve" }

// To reject (reason required):
{ "action": "reject", "rejection_reason": "Low quality image" }
```

---

### Public Broadcasting API (No Auth)

| Method | Endpoint                          | Description                         |
|--------|-----------------------------------|-------------------------------------|
| GET    | /content/live                     | List all teachers + their endpoints |
| GET    | /content/live/teacher-1           | Get live content for teacher 1      |
| GET    | /content/live/teacher-2           | Get live content for teacher 2      |
| GET    | /content/live/:uuid               | Get live content by teacher UUID    |
| GET    | /content/live/teacher-1?subject=maths | Filter by subject               |

**Response when content is live:**
```json
{
  "success": true,
  "message": "Content retrieved successfully.",
  "data": {
    "available": true,
    "teacher": { "id": "...", "name": "Teacher One" },
    "content": [
      {
        "id": "...",
        "title": "Chapter 5 Quiz",
        "subject": "maths",
        "file_url": "http://localhost:3000/uploads/abc123.png",
        "file_type": "png",
        "rotation_duration_minutes": 5,
        "active_until": "2026-04-25T10:35:00.000Z"
      }
    ]
  }
}
```

**Response when no content is available:**
```json
{
  "success": true,
  "message": "No content available.",
  "data": null
}
```

---

## Content Lifecycle

```
Teacher uploads → pending → Principal approves/rejects
                              ↓
                           approved → Live if within start_time/end_time window
                           rejected → Reason stored, content removed from rotation
```

## Scheduling Logic

- Each teacher/subject combination has its own rotation channel.
- Multiple approved content items rotate based on their `rotation_duration` (minutes).
- Rotation is continuous and deterministic — all students see the same content at the same time.
- The `active_until` field in the response tells clients when to refresh.

## Edge Cases Handled

| Scenario                            | Response                    |
|-------------------------------------|-----------------------------|
| No approved content for teacher     | `"No content available."`   |
| Approved but no time window set     | `"No content available."`   |
| Approved but outside time window    | `"No content available."`   |
| Invalid subject query               | `"No content available."`   |
| Unknown teacher identifier          | `"No content available."`   |

---

## Project Structure

```
src/
├── index.js               # App entry point
├── config/
│   ├── database.js        # PostgreSQL connection pool
│   ├── migrate.js         # Database schema migration
│   └── seed.js            # Demo data seeder
├── controllers/           # Request/response handling
├── routes/                # Route definitions
├── services/              # Business logic
├── middlewares/           # Auth, upload, validation
├── models/                # Database queries
├── utils/                 # JWT, response helpers, scheduler
└── uploads/               # Local file storage
```

See `architecture-notes.txt` for deep architectural decisions.

---

## Assumptions & Notes

1. Teachers must set `start_time` and `end_time` for content to go live — content without scheduling is never broadcasted (per spec).
2. The rotation epoch is anchored to the earliest `start_time` within each subject group for deterministic rotation.
3. Teacher aliases (`teacher-1`, `teacher-2`) are assigned by registration order (created_at ASC).
4. S3 upload, Redis caching, and analytics are documented as bonus features but use local storage by default.
5. File types are validated by both MIME type and file extension to prevent spoofing.
