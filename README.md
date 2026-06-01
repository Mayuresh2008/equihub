# EquiHub

Full-stack equity management platform for startups, VCs, and angel investors. Inspired by Mini Carta.

## Tech Stack
- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS + Recharts + Lucide Icons + Zustand
- **Backend (mock)**: in-memory store via `lib/mock/db.ts` (no DB required for the prototype)
- **Backend (production-ready)**: Prisma schema (`prisma/schema.prisma`) for AWS RDS PostgreSQL; AWS Cognito for auth; S3 for documents; SES for email; Bedrock (Claude 3) for AI
- **Styling**: deep blue (#1E3A8A) + gold (#F59E0B) on Inter

## Roles & Access Control
| Role | Access |
|---|---|
| `main_admin` | All companies, all users, audit logs, settings, AI generator (exclusive) |
| `startup_admin` | Only their own company (cap table, funding rounds, ESOP, team, docs) |
| `investor` | Only their own portfolio holdings |

## Demo Accounts (password: any value, mock auth)
- Main Admin: `admin@equihub.com`
- Startup Admin: `alex@neuralpath.io` (NeuralPath AI)
- Investor: `david@accel.vc` (Accel Ventures)

## Run locally
```bash
npm install
npm run dev
# open http://localhost:3000
```

If `node` is not on your PATH, set `NODE` env var first:
```bash
$env:NODE = "C:\path\to\node.exe"
npm install
npm run dev
```

## Build
```bash
npm run build
```

## Features
- Cap table with live ownership % (auto-calculated), pre/post-money valuation, price-per-share
- Funding rounds (SAFE, priced seed, Series A, etc.) with dilution tracking
- ESOP tracker with daily-vested calculation, cliff, accelerator
- Document library with AI generator (Bedrock/Claude 3 simulated; produces SHA, SAFE, Term Sheet, Option Grant, Board Resolution)
- E-signature flow (sequential or parallel signatories) with status updates
- Immutable equity ledger (`EquityTransaction` table — append-only)
- Full audit log of every action
- Notifications on key events

## Project Structure
```
equihub/
├─ app/                    Next.js App Router pages
│  ├─ login/               Role-based login with demo accounts
│  ├─ dashboard/           3 role-specific dashboards
│  ├─ companies/           Main Admin: all companies
│  │  └─ [id]/             Cap table, funding rounds, ESOP, team
│  ├─ documents/           Library + AI generator (main_admin only)
│  │  └─ [id]/             Document detail with sign flow
│  ├─ portfolio/           Investor-only portfolio view
│  ├─ users/               Main Admin: user management
│  ├─ audit-logs/          Main Admin: full activity log
│  ├─ settings/            Main Admin: AWS config
│  ├─ ai-generator/        Main Admin: dedicated AI page
│  ├─ notifications/       Per-user notifications
│  └─ my-*/                Startup admin shortcuts
├─ components/
│  ├─ layout/              Sidebar, Navbar, DashboardLayout
│  ├─ shared/              StatCard, RoleBadge, ExportButton
│  ├─ captable/            Pie chart, tables, ESOP tracker
│  └─ documents/           AIGeneratorPanel
├─ lib/
│  ├─ types.ts             All TypeScript types & enums
│  ├─ auth.ts              Mock JWT + role checks
│  ├─ mock/db.ts           In-memory store + seed data
│  ├─ store/auth.ts        Zustand auth store
│  ├─ utils/               calc, vesting, formatters
│  └─ db/prisma.ts         Prisma client (stub for now; see "Real DB" below)
├─ prisma/
│  └─ schema.prisma        Full schema for all 10 tables
└─ .env.local.example      Documented env vars
```

## Real DB (optional)
The app currently uses an in-memory mock store. To switch to real PostgreSQL:
1. Set `DATABASE_URL` in `.env.local` (format: `postgresql://user:pass@host:5432/equihub`)
2. `npx prisma generate` and `npx prisma migrate dev`
3. Replace `import { db } from '@/lib/mock/db'` usages with Prisma client calls

## API (mock)
The mock store is `globalThis.__EQUIHUB_DB__` — survives HMR but resets on server restart. Mutations like signing a document are local to the current session.

In production, replace the mock layer with API routes (`/api/companies`, `/api/documents/[id]/sign`, etc.) backed by Prisma + Cognito + S3 + SES + Bedrock.
