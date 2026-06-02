# EquiHub

Full-stack equity management platform for startups, VCs, and angel investors. Inspired by Mini Carta.

## Tech Stack
- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS + Recharts + Lucide + Zustand
- **Backend**: Next.js API routes + Prisma (schema defined, runs against mock store in dev)
- **AWS Integration (ready, not live)**: Cognito (auth), S3 (docs), RDS (PostgreSQL via Prisma), SES (email)
- **Validation**: Zod for env + form payloads
- **Styling**: deep blue (#1E3A8A) + gold (#F59E0B) on Inter

## Architecture: 4 AWS Services

This project is architected to run on just 4 AWS services:

| Service | Used For | Files |
|---|---|---|
| **EC2** | Next.js server (`npm run build && npm start`) | `Dockerfile`, `package.json` |
| **RDS (PostgreSQL)** | All data via Prisma | `prisma/schema.prisma`, `lib/db/prisma.ts` |
| **S3** | Document storage, presigned uploads | `lib/aws/s3.ts`, `app/api/documents/upload/route.ts` |
| **Cognito** | Auth, role-based groups → main_admin / startup_admin / investor | `lib/aws/cognito.ts`, `lib/auth.ts` |

### Optional / Replaced
- **SES** (email) — code present in `lib/aws/ses.ts`, logs to console in dev
- **Bedrock** (AI doc generation) — uses template strings for now, replace with `InvokeModelCommand` in production
- **Lambda** (vesting cron) — `lib/utils/vesting.ts#optionsVested` computes daily; can be moved to Lambda

## Run locally (mock mode — no AWS required)
```bash
npm install
npm run dev
# open http://localhost:3000
```

If `node` is not on your PATH:
```powershell
$env:Path = "C:\path\to\node-v20.11.1-win-x64;$env:Path"
$env:NODE  = "C:\path\to\node.exe"
cd C:\riddle\equihub
& "$env:NODE" "$env:NODE\..\node_modules\npm\bin\npm-cli.js" install
& "$env:NODE" "$env:NODE\..\node_modules\npm\bin\npm-cli.js" run dev
```

## Deploy to AWS (4 services)
1. **RDS**: create a PostgreSQL instance, set `DATABASE_URL` in `.env`
2. **S3**: create two buckets (`equihub-documents`, `equihub-public`), set `S3_BUCKET_*` in `.env`
3. **Cognito**: create a user pool with 3 groups (main_admin, startup_admin, investor), set `COGNITO_USER_POOL_ID` and `COGNITO_CLIENT_ID`
4. **EC2**: launch t3.small, install Node 22, clone repo, `npm ci && npm run build && pm2 start npm -- start`
5. Set `USE_MOCK_DB=false` in production env to switch from in-memory store to Prisma
6. `npx prisma migrate deploy` to apply schema

## Roles & Access Control
| Role | Access |
|---|---|
| `main_admin` | All companies, all users, audit logs, settings, AI generator (exclusive) |
| `startup_admin` | Only their own company (cap table, funding rounds, ESOP, team, docs) |
| `investor` | Only their own portfolio holdings |

## Demo Accounts (password: any value in mock mode)
- Main Admin: `admin@equihub.com`
- Startup Admin: `alex@neuralpath.io` (NeuralPath AI)
- Investor: `david@accel.vc` (Accel Ventures)

## API Routes (17 endpoints, all under `/api`)
```
GET    /                                Endpoint catalog
POST   /auth/login                      Mock + production Cognito
GET    /auth/me                         Counts
GET    /companies                       List (role-filtered)
POST   /companies                       Create (main_admin)
GET    /companies/:id                   Detail with related
PUT    /companies/:id                   Update
GET    /shareholders                    List (role-filtered)
POST   /shareholders                    Add (creates ledger entry)
DELETE /shareholders/:id                Remove
GET    /funding-rounds                  List
POST   /funding-rounds                  Add
GET    /option-grants                   List
POST   /option-grants                   Add
GET    /investments                     List
POST   /investments                     Add
GET    /documents                       List (role-filtered)
DELETE /documents?id=                   Void
POST   /documents/upload                Upload to S3
POST   /documents/:id/sign              Sign a document
POST   /documents/generate              AI-generated doc
GET    /files/:key                      Local-mode file serving (S3 presigned in prod)
GET    /users                           List (main_admin)
PATCH  /users                           Update role/status
```

## Project Structure
```
equihub/
├─ app/                                Next.js App Router pages
│  ├─ login/                           Role-based login with demo accounts
│  ├─ dashboard/                       3 role-specific dashboards
│  ├─ companies/                       Main Admin: all companies
│  │  └─ [id]/                         Cap table, funding rounds, ESOP
│  ├─ documents/                       Library + AI generator + upload
│  │  └─ [id]/                         Document detail with sign flow
│  ├─ portfolio/                       Investor-only portfolio view
│  ├─ users/                           Main Admin: user management
│  ├─ audit-logs/                      Main Admin: full activity log
│  ├─ settings/                        Main Admin: AWS config (saves to localStorage)
│  ├─ ai-generator/                    Main Admin: dedicated AI page
│  ├─ notifications/                   Per-user notifications
│  └─ my-*/                            Startup admin shortcuts
├─ components/
│  ├─ layout/                          Sidebar, Navbar, DashboardLayout
│  ├─ shared/                          StatCard, RoleBadge, ExportButton, Modal, ToastContainer
│  ├─ captable/                        Pie chart, tables, ESOP tracker
│  └─ documents/                       AIGeneratorPanel
├─ lib/
│  ├─ types.ts                         All TypeScript types & enums
│  ├─ env.ts                           Zod env validation
│  ├─ auth.ts                          Mock + production Cognito auth
│  ├─ server-auth.ts                   API route auth helper (Bearer token)
│  ├─ api-client.ts                    Browser fetch wrapper
│  ├─ mock/db.ts                       In-memory store + seed data
│  ├─ store/                           Zustand stores (auth, toast)
│  ├─ utils/                           calc, vesting, formatters
│  ├─ db/prisma.ts                     Prisma client (real RDS in prod)
│  └─ aws/                             AWS service helpers
│     ├─ config.ts                     Region + creds
│     ├─ cognito.ts                    Sign-in, group→role mapping
│     ├─ s3.ts                         Upload, presigned URLs
│     └─ ses.ts                        Transactional email
├─ prisma/
│  └─ schema.prisma                    Full schema for all 10 tables
└─ .env.local.example                  Documented env vars
```

## Features (all working)

### Cap table
- ✅ Live ownership % (auto-calculated, never entered manually)
- ✅ Pre/post-money valuation, price-per-share
- ✅ Add shareholder (creates immutable ledger entry)
- ✅ Remove shareholder (audit logged)
- ✅ CSV export

### Funding rounds
- ✅ Add round (pre-money, amount, price, lead investor, date)
- ✅ Post-money = pre + raised (computed)
- ✅ Dilution history chart
- ✅ CSV export

### ESOP
- ✅ Daily-vested calculation (cliff respected)
- ✅ Add option grant (grantee, num options, strike, vesting schedule)
- ✅ Progress bars

### Documents
- ✅ Upload to S3 (with local fallback)
- ✅ AI generation (Bedrock templates for SHA, SAFE, Term Sheet, Option Grant, Board Resolution)
- ✅ E-sign flow with status updates
- ✅ Void document (main_admin)
- ✅ Locked when fully signed

### Admin
- ✅ User CRUD with role + company assignment
- ✅ Activate/deactivate toggle
- ✅ Audit log (every action)
- ✅ Settings (saved to localStorage; in prod, AWS Secrets Manager)

### UI
- ✅ Toast/notification system (Zustand)
- ✅ Error/loading/not-found pages
- ✅ Mobile-responsive sidebar
- ✅ Deep blue + gold brand colors
- ✅ Inter font

## Switching from mock to real AWS

1. Fill in `.env.local` with real AWS values
2. Set `USE_MOCK_DB=false`
3. Replace `import { db } from '@/lib/mock/db'` with `import { prisma } from '@/lib/db/prisma'` in API routes
4. Run `npx prisma migrate deploy` against your RDS instance
5. The same UI will work — no client-side changes needed

## Build
```bash
npm run build
npm start
```

## License
MIT
