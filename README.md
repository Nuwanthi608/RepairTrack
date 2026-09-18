# RepairTrack

A job tracking system for phone and laptop repair shops.

Repair shops lose time answering the same question all day: *"is my device ready
yet?"*. With 30 devices on the bench, the owner also loses track of which device
belongs to whom. RepairTrack solves both: every device gets a job number, the
owner manages everything from one dashboard, and customers check their own
status online instead of calling.

## Features

- **Job tracking** — every device gets a unique job number (e.g. `RT-4L5RSK`)
- **Owner dashboard** — status counts, search by job number / name / phone, filter by status
- **Public tracking page** — customers enter their job number and the last 4 digits of
  their phone to see a progress tracker, cost breakdown and update history. No login needed.
- **SMS notifications** — sent when a job is created and whenever the status changes
- **Spare part cost breakdown** — parts, labour, advance paid and balance due
- **Printable receipt** — handed to the customer when the device is dropped off
- **JWT login** — the dashboard and all job APIs are protected

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React 19, Vite, React Router |
| Backend | Node.js, Express 5 |
| Database | MySQL |
| Auth | JWT, bcrypt |
| SMS | Notify.lk, with a console mode for development |

## Security notes

- Passwords are stored as bcrypt hashes, never in plain text
- All SQL uses parameterised queries, so user input can't be injected
- The public tracking page needs the job number **and** 4 phone digits, and returns the
  same error for a wrong job number and for wrong digits, so job numbers can't be
  guessed. It is rate limited to 30 attempts per 15 minutes.
- Login is rate limited to 10 attempts per 15 minutes
- Customers never see full phone numbers, serial/IMEI numbers or internal notes
- Parts and costs are locked once a job is delivered or cancelled

## Screenshots



## Getting started

### Requirements

Node.js 18+, MySQL 8+

### 1. Database

```bash
mysql -u root -p < server/database/schema.sql
```

### 2. Backend

```bash
cd server
npm install
```

Create a `server/.env` file:

```
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=repairtrack
JWT_SECRET=generate_this_with_the_command_below
SMS_PROVIDER=console
PUBLIC_URL=http://localhost:5173
NOTIFY_USER_ID=
NOTIFY_API_KEY=
NOTIFY_SENDER_ID=NotifyDEMO
```

Generate a JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Create the owner account and start the server:

```bash
node scripts/createUser.js "Shop Owner" owner@example.com YourPassword
npm run dev
```

### 3. Frontend

```bash
cd client
npm install
npm run dev
```

Open the URL Vite prints. Log in with the account created above.

`SMS_PROVIDER=console` prints messages to the server terminal instead of sending
them, so no SMS credits are used during development. Set it to `notifylk` and fill in
the `NOTIFY_*` values to send real messages.

## API

All `/api/jobs` routes require an `Authorization: Bearer <token>` header.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Log in, returns a JWT |
| `GET` | `/api/auth/me` | Current user |
| `GET` | `/api/jobs` | List jobs, optional `?status=` |
| `POST` | `/api/jobs` | Create a job |
| `GET` | `/api/jobs/:id` | Job details, parts, history, SMS log and totals |
| `PATCH` | `/api/jobs/:id/status` | Change status, sends an SMS if it changed |
| `POST` | `/api/jobs/:id/parts` | Add a spare part |
| `DELETE` | `/api/jobs/:id/parts/:partId` | Remove a spare part |
| `PATCH` | `/api/jobs/:id/payment` | Update labour cost and advance paid |
| `POST` | `/api/public/track` | Public status lookup, no auth |

## Database

Six tables: `users`, `customers`, `jobs`, `job_parts`, `status_history`, `sms_logs`.

Money is stored as `DECIMAL(10,2)` rather than `FLOAT` to avoid rounding errors.
Line totals are calculated in queries from `quantity × unit_cost` instead of being
stored, so the bill can never disagree with the parts list. Job creation and status
changes run inside transactions, so a job is never saved without its history entry.

## Status flow

```
received → diagnosing → waiting_for_parts → repairing → ready → delivered
                                                      ↘ cancelled
```