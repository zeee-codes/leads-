# 📋 Prowider Mini — Task Roadmap & Progress Tracker

> Track progress by checking off tasks as they are completed.  
> Each task includes acceptance criteria to verify correctness.

---

## ⚙️ Prerequisites (Before Starting)

| Requirement | Status | Notes |
|-------------|--------|-------|
| Node.js ≥ 18.x installed | ✅ | Checked: Node.js 22.x |
| PostgreSQL running | ✅ | Checked: PostgreSQL 16 docker container running |
| Database connection string ready | ✅ | Checked: configured in `.env` |
| Git initialized | ✅ | Checked |

---

## Phase 0: Project Scaffolding ⏱️ ~15 min

| # | Task | Status | Acceptance Criteria |
|---|------|--------|---------------------|
| 0.1 | Create Next.js App Router project | ✅ | `npm run dev` serves on localhost:3000 |
| 0.2 | Install Prisma + @prisma/client | ✅ | `npx prisma --version` works |
| 0.3 | Install react-hot-toast | ✅ | Package in `node_modules` |
| 0.4 | Install tsx (dev dependency) | ✅ | Can run `.ts` files directly |
| 0.5 | Initialize Prisma with PostgreSQL | ✅ | `prisma/schema.prisma` created |
| 0.6 | Configure `.env` with DATABASE_URL | ✅ | Prisma can connect to DB |
| 0.7 | Create folder structure (lib, types, api dirs) | ✅ | All directories exist |

**Phase 0 Complete:** ✅

---

## Phase 1: Database Layer ⏱️ ~30 min

| # | Task | Status | Acceptance Criteria |
|---|------|--------|---------------------|
| 1.1 | Define Service model in schema.prisma | ✅ | Has `id`, `name` (unique), `leads[]`, `providers[]` |
| 1.2 | Define Provider model in schema.prisma | ✅ | Has `id`, `name`, `leadsCount`, `maxQuota`, `lastAssignedAt`, `services[]` |
| 1.3 | Define Lead model with @@unique([phone, serviceId]) | ✅ | Unique constraint enforced at DB level |
| 1.4 | Define LeadAssignment model with @@unique([leadId, providerId]) | ✅ | `isMandatory` boolean field present |
| 1.5 | Define WebhookLog model with unique eventId | ✅ | `eventId` column is unique |
| 1.6 | Run `npx prisma migrate dev --name init` | ✅ | Migration succeeds, tables created |
| 1.7 | Create Prisma singleton client (`src/lib/prisma.ts`) | ✅ | No "too many clients" in dev mode |
| 1.8 | Write seed script (`prisma/seed.ts`) | ✅ | Creates 3 services, 8 providers |
| 1.9 | Configure seed command in package.json | ✅ | `"prisma": { "seed": "tsx prisma/seed.ts" }` |
| 1.10 | Run `npx prisma db seed` | ✅ | Prisma Studio shows correct data |
| 1.11 | Verify seed idempotency (run seed twice) | ✅ | No duplicate errors on second run |

**Phase 1 Complete:** ✅

### Seed Data Reference

```
Service 1 → Pool: [Provider 1*, Provider 2, Provider 3]
Service 2 → Pool: [Provider 4, Provider 5*, Provider 6]
Service 3 → Pool: [Provider 1*, Provider 4*, Provider 7, Provider 8]

* = Mandatory provider for that service
```

---

## Phase 2: Core Allocation Engine ⏱️ ~60 min

| # | Task | Status | Acceptance Criteria |
|---|------|--------|---------------------|
| 2.1 | Create service-rules.ts with mandatory mappings | ✅ | Exports `MANDATORY_RULES` and `TARGET_ASSIGNMENTS` |
| 2.2 | Create TypeScript types (src/types/index.ts) | ✅ | All API request/response types defined |
| 2.3 | Implement allocation-engine.ts core function | ✅ | Takes `{name, phone, serviceId}`, returns assignments |
| 2.4 | Add `FOR UPDATE` row lock inside Prisma transaction | ✅ | Uses `$queryRawUnsafe` for SELECT...FOR UPDATE |
| 2.5 | Implement duplicate check (phone + serviceId) | ✅ | Throws structured error on duplicate |
| 2.6 | Implement mandatory provider selection | ✅ | Checks quota before including |
| 2.7 | Implement pool-based round-robin (lastAssignedAt ASC) | ✅ | Providers sorted by `lastAssignedAt` ascending |
| 2.8 | Implement Lead + LeadAssignment creation | ✅ | Records created atomically in transaction |
| 2.9 | Implement provider counter updates | ✅ | `leadsCount += 1`, `lastAssignedAt = now()` |
| 2.10 | Create POST /api/request-service route | ✅ | Validates input, calls engine, returns structured JSON |
| 2.11 | Implement all error response shapes | ✅ | 400, 409, 503 with code + message |

**Phase 2 Complete:** ✅

### Critical Tests for Phase 2

```
Test A: Submit lead → 200, assignments.length === 3
Test B: Submit duplicate → 409, code === "DUPLICATE_LEAD_SUBMISSION"
Test C: Same phone, different service → 200
Test D: Mandatory provider in assignments with isMandatory === true
Test E: Submit 10 leads → Provider hits quota → excluded from further leads
Test F: Pool providers rotate (not random)
```

---

## Phase 3: Customer Form (Frontend) ⏱️ ~30 min

| # | Task | Status | Acceptance Criteria |
|---|------|--------|---------------------|
| 3.1 | Design globals.css (dark theme, variables, animations) | ✅ | Premium look with glassmorphism |
| 3.2 | Update layout.tsx (nav, fonts, meta tags, toaster) | ✅ | Navigation links work |
| 3.3 | Build customer form page (page.tsx) | ✅ | Service selector, name, phone, submit |
| 3.4 | Add loading state to submit button | ✅ | Button shows spinner during API call |
| 3.5 | Show success confirmation with assignment details | ✅ | Displays which providers were assigned |
| 3.6 | Show error toast on duplicate/failure | ✅ | Toast with descriptive error message |
| 3.7 | Make form responsive (mobile-friendly) | ✅ | Looks good at 375px width |

**Phase 3 Complete:** ✅

---

## Phase 4: Provider Dashboard ⏱️ ~45 min

| # | Task | Status | Acceptance Criteria |
|---|------|--------|---------------------|
| 4.1 | Create GET /api/leads endpoint | ✅ | Returns providers, assignments, stats |
| 4.2 | Build dashboard layout with provider cards | ✅ | 8 provider cards in responsive grid |
| 4.3 | Add quota progress bars (leadsCount/maxQuota) | ✅ | Visual bar fills proportionally |
| 4.4 | Add Active/Frozen status badges | ✅ | Green = active, Red = frozen (10/10) |
| 4.5 | Add recent assignments feed | ✅ | Scrollable list with timestamps |
| 4.6 | Implement 2-second short polling | ✅ | `setInterval` with fetch, cleanup on unmount |
| 4.7 | Detect new assignments (compare poll data) | ✅ | Tracks previous state, calculates delta |
| 4.8 | Fire toast on new assignment (X-Factor 2) | ✅ | 🎉 toast with provider name |
| 4.9 | Flash green glow on updated cards (X-Factor 2) | ✅ | CSS animation triggers on update |
| 4.10 | Add loading skeleton on initial load | ✅ | Placeholder UI before first data fetch |

**Phase 4 Complete:** ✅

---

## Phase 5: Webhook & Quota Reset ⏱️ ~30 min

| # | Task | Status | Acceptance Criteria |
|---|------|--------|---------------------|
| 5.1 | Create POST /api/webhook/payment endpoint | ✅ | Accepts `eventId`, `providerId`, `action` |
| 5.2 | Implement idempotency check (WebhookLog lookup) | ✅ | Duplicate eventId returns ALREADY_PROCESSED |
| 5.3 | Reset provider's leadsCount to 0 | ✅ | Provider can receive leads again |
| 5.4 | Return structured success/error responses | ✅ | Includes `code` and `message` fields |

**Phase 5 Complete:** ✅

---

## Phase 6: Test Tools ⏱️ ~30 min

| # | Task | Status | Acceptance Criteria |
|---|------|--------|---------------------|
| 6.1 | Create POST /api/test/reset-system endpoint | ✅ | Deletes all leads, assignments, logs; resets providers |
| 6.2 | Create POST /api/test/generate-leads endpoint | ✅ | Generates N leads sequentially, returns log |
| 6.3 | Build test-tools page layout | ✅ | Clean admin panel look |
| 6.4 | "Generate 10 Leads" button + API integration | ✅ | Calls endpoint, receives log data |
| 6.5 | Terminal-style allocation log display (X-Factor 1) | ✅ | Monospace, dark bg, auto-scroll |
| 6.6 | "Reset System" button | ✅ | Clears everything, confirms with toast |
| 6.7 | Webhook trigger form (providerId + eventId) | ✅ | Sends webhook, shows response |
| 6.8 | System state snapshot (provider quotas table) | ✅ | Shows current state at a glance |

**Phase 6 Complete:** ✅

---

## Phase 7: Final Polish ⏱️ ~30 min

| # | Task | Status | Acceptance Criteria |
|---|------|--------|---------------------|
| 7.1 | Audit all API routes for consistent error shapes | ✅ | No raw 500 errors anywhere |
| 7.2 | Add SEO meta tags to all pages | ✅ | Title, description on each page |
| 7.3 | Ensure responsive design on all pages | ✅ | Tested and verified |
| 7.4 | Add micro-animations (hover, transitions) | ✅ | Buttons, cards have smooth interactions |
| 7.5 | Remove debug console.logs | ✅ | Clean console in production |
| 7.6 | Add JSDoc to key functions | ✅ | Documents present |
| 7.7 | Run full integration test sequence | ✅ | Completed successfully |
| 7.8 | Final visual review | ✅ | Verified in browser with subagent |

**Phase 7 Complete:** ✅

---

## 🏁 Final Smoke Test Protocol

Execute this exact sequence after all phases are complete:

| Step | Action | Expected Result | Status |
|------|--------|-----------------|---|
| 1 | `npx prisma migrate reset --force` | Clean database | ✅ |
| 2 | `npx prisma db seed` | 3 services, 8 providers seeded | ✅ |
| 3 | `npm run dev` | App starts on localhost:3000 | ✅ |
| 4 | Visit `/dashboard` | 8 providers shown, all at 0/10 | ✅ |
| 5 | Visit `/`, submit lead for Service 1 (phone: 1111111111) | 200 OK, 3 providers assigned | ✅ |
| 6 | Check `/dashboard` | Provider 1 (mandatory) + 2 others at 1/10 | ✅ |
| 7 | Submit same phone + Service 1 again | 409 error with clear message | ✅ |
| 8 | Submit same phone + Service 2 | 200 OK (different service allowed) | ✅ |
| 9 | Visit `/test-tools`, generate 10 leads for Service 1 | Terminal log shows all allocations | ✅ |
| 10 | Verify terminal log | Round-robin order visible, mandatory providers marked | ✅ |
| 11 | Check `/dashboard` | Quotas updated, toasts fired | ✅ |
| 12 | Keep generating until Provider 1 hits 10/10 | Provider 1 shows "Frozen" | ✅ |
| 13 | Submit another Service 1 lead | Provider 1 NOT in assignments | ✅ |
| 14 | Trigger payment webhook for Provider 1 | Quota reset to 0/10 | ✅ |
| 15 | Trigger same webhook (same eventId) | Returns "ALREADY_PROCESSED" | ✅ |
| 16 | Submit Service 1 lead | Provider 1 back in rotation | ✅ |
| 17 | Final dashboard check | All data accurate and live | ✅ |

---

## 📊 Progress Summary

| Phase | Tasks | Completed | Progress |
|-------|-------|-----------|----------|
| Phase 0: Scaffolding | 7 | 7 | ✅ 100% |
| Phase 1: Database | 11 | 11 | ✅ 100% |
| Phase 2: Engine | 11 | 11 | ✅ 100% |
| Phase 3: Form | 7 | 7 | ✅ 100% |
| Phase 4: Dashboard | 10 | 10 | ✅ 100% |
| Phase 5: Webhooks | 4 | 4 | ✅ 100% |
| Phase 6: Test Tools | 8 | 8 | ✅ 100% |
| Phase 7: Polish | 8 | 8 | ✅ 100% |
| **TOTAL** | **66** | **66** | **✅ 100%** |

---

> **Implementation Verified and Complete.**
