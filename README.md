# 🚀 Prowider Mini Lead Distribution System

An automated B2B marketplace lead distribution engine built with Next.js (App Router), TypeScript, Prisma ORM, and PostgreSQL (Neon Serverless). 

The system guarantees fairness, database-level consistency, robust concurrency handling, and real-time dashboard updates.

---

## 🔗 Live Application & Repository
* **Live Demo URL**: [https://leads-7zy8.vercel.app/](https://leads-7zy8.vercel.app/)
* **Dashboard View**: [https://leads-7zy8.vercel.app/dashboard](https://leads-7zy8.vercel.app/dashboard)
* **Stress Test Suite**: [https://leads-7zy8.vercel.app/test-tools](https://leads-7zy8.vercel.app/test-tools)

---

## 🛠️ Key Features & Business Logic

### 1. Lead Intake Form (`/` and `/request-service`)
* Fields: Name, Phone Number, City, Service Category (dropdown), and Description.
* **Database-Level Duplicate Prevention**: Enforces a database unique constraint (`@@unique([phone, serviceId])`). A client cannot submit a duplicate lead for the *same* service, preventing spam.

### 2. Fair Lead Allocation Engine
* **Quota Cap (Non-negotiable)**: Every provider has a strict monthly quota of **10** leads. Once reached, they are automatically excluded from future allocations.
* **Mandatory Assignment Rules**:
  * **Service 1** $\rightarrow$ Always assigns **Provider 1** (VIP).
  * **Service 2** $\rightarrow$ Always assigns **Provider 5** (VIP).
  * **Service 3** $\rightarrow$ Always assigns **Provider 1** AND **Provider 4** (VIPs).
* **Round-Robin Pool Rotation**: The remaining slots (ensuring exactly **3** unique assignments per lead) are filled by sorting eligible pool providers by `lastAssignedAt ASC` (the provider who has waited the longest receives the next lead).
* **Pool definitions**:
  * Service 1 Pool: Providers 2, 3, 4
  * Service 2 Pool: Providers 6, 7, 8
  * Service 3 Pool: Providers 2, 3, 5, 6, 7, 8

### 3. Real-Time Provider Dashboard (`/dashboard`)
* Auto-refreshes every **2 seconds** using optimized short-polling.
* Displays live state for all 8 providers:
  * **Leads Received Count**
  * **Remaining Quota** (resets to 10 when a webhook resets their leads count to 0)
  * **Assigned Leads List** (scrollable drawer inside each card displaying Lead ID, Customer Name, Phone, City, Description, and Timestamp)
* Dynamic UX: Newly assigned leads trigger instant green-flash highlight animations on the provider's card and live toast notifications.

### 4. Admin Webhook Simulator & Test Panel (`/test-tools`)
Includes a scrolling developer console logging raw engine outputs, plus single-click quick actions:
* **Generate 10 Leads Instantly** (concurrency/stress test).
* **Reset Provider 1 Quota to 10** (webhook quota reset simulation).
* **Call Webhook 3x Simultaneously** (sends 3 concurrent requests with duplicate `eventId` keys to verify backend transaction-level idempotency).

---

## 🧠 Engineering & Architecture Highlights

### ⚡ Concurrency Handling (Atomic PostgreSQL Locking)
To handle heavy traffic and simultaneous lead submissions safely, the engine uses **Prisma interactive transactions** paired with row-level locks:
```sql
SELECT * FROM "Provider" FOR UPDATE;
```
This blocks concurrent operations from reading stale quota states, ensuring that lead distribution and quota increments occur atomically and prevent double-allocations or quota breaches.

### 🔄 Webhook Idempotency
Every payment webhook contains a unique transaction key (`eventId`).
* We maintain a unique constraint on `WebhookLog.eventId`.
* Upon receiving a webhook, the engine attempts to write the key inside an interactive transaction. 
* If a duplicate `eventId` is sent (even concurrently), the database blocks the second write, returns a `200 OK` with code `ALREADY_PROCESSED`, and skips processing the quota reset again.

---

## 📦 Local Setup Instructions

### 1. Clone & Install
```bash
git clone https://github.com/zeee-codes/leads-.git
cd leads-
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory:
```env
DATABASE_URL="YOUR_POSTGRESQL_CONNECTION_STRING"
```

### 3. Deploy Migrations & Seed Database
Initialize schema structures and populate providers and services:
```bash
npx prisma migrate dev --name init
npx prisma db seed
```

### 4. Launch Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🚢 Deployment to Vercel
This codebase is ready for Vercel out-of-the-box:
* Build command is configured as `prisma generate && next build` to guarantee compilation safety.
* Set the `DATABASE_URL` environment variable in Vercel to point to your PostgreSQL (or Neon) instance.
