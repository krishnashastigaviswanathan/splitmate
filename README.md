# 🏠 SplitMate — Shared Roommate & Household Expense Splitter

> A modern, fintech-grade Splitwise alternative designed specifically for roommates, apartments, and shared households. Built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **Prisma ORM**, and **PostgreSQL / SQLite**.

---

## ✨ Key Features & User Flow

### 1. 🔐 Authentication & Onboarding
- Sleek split-screen auth with product highlights and **1-click demo login accounts**.
- Protected dashboard and group routes via **NextAuth.js (Auth.js)** Credentials provider.
- Profile management with customizable **UPI ID** (`name@okhdfcbank`) for direct roommate payments.

### 2. 🏠 Group Management & Budgets
- Create groups (e.g. *"Apartment 4B"*, *"Goa Trip"*) with custom cover emojis and currencies (`₹ INR`, `$ USD`, `€ EUR`, `£ GBP`).
- **6-character unique invite codes** (e.g. `APT4B9`) with one-click clipboard copying.
- Shareable invite links (`/join/[inviteCode]`).
- Set and quick-edit a **Monthly Expense Goal / Budget** (e.g., `₹35,000/month`).

### 3. ➕ Advanced Expense Logging
- Floating action button or instant keyboard shortcut (`N`).
- Colorful category badges: `Rent & Utilities`, `Groceries`, `Food & Dining`, `Travel`, `Entertainment`, `Other`.
- Payer selector with initials avatars, date picker, and optional receipt image URL.
- **4 Split Modes:**
  1. `EQUAL`: Divides evenly among selected members, distributing remainder paise cleanly (+1 paise to first members) so the sum is exact.
  2. `EXACT`: Custom exact currency amounts per person with live remaining allocation badge.
  3. `PERCENTAGE`: Custom percentage shares strictly validating to 100%.
  4. `ITEMIZED`: Line items (dishes, groceries) assigned to specific consumers, with **shared taxes/delivery fees split proportionally** to each person's subtotal.
- **Strict Integer Smallest Units:** Stored in database as integers (paise/cents, e.g. `₹250.50` = `25050`) to eradicate floating-point rounding errors.

### 4. 📊 Monthly Expenses vs. Goal Bar Graph & Over-Budget Alerts
- Interactive **Recharts bar graph** comparing the last 6 months' spending against a horizontal dashed budget reference line.
- Dynamic color-coding:
  - 🟢 **Emerald**: &lt;80% of monthly goal
  - 🟡 **Warm Amber**: 80%–100% of goal
  - 🔴 **Vibrant Rose**: Exceeds monthly goal
- **Pulsing Over-Budget Alert Banner**: Displays immediately at the top of the dashboard and Analytics tab when spending crosses the monthly limit.
- **Live Warning Toast**: Triggers automatically whenever a newly saved expense pushes the month over budget.

### 5. 🔁 Recurring Household Bills
- Mark bills as recurring (`MONTHLY` or `WEEKLY`) for Rent, Wi-Fi, Cook/Maid salary, or Electricity.
- Countdown pills (*"Due in 2 days"*, *"Due Today"*, *"Overdue by 1d"*).
- **One-click "Log This Month's Bill"** button to log upcoming utilities in seconds.

### 6. ⚡ Greedy Debt-Simplification & Instant UPI Settle-Up
- Computes each roommate's net balance:
  $$\text{Net Balance} = (\text{Total Paid} + \text{Settlements Sent}) - (\text{Total Share} + \text{Settlements Received})$$
- Greedy matching algorithm matches the largest debtor with the largest creditor to minimize the total number of transactions needed.
- **Instant UPI Deep Links** (`upi://pay?pa=...&am=...&cu=INR`) and generated **UPI QR Code** modal for Google Pay, PhonePe, Paytm, and BHIM.
- **"Mark as Paid"** records the settlement and fires celebratory confetti (`canvas-confetti`).

### 7. 📈 Spending Analytics & CSV Export
- Donut chart displaying category spending distributions.
- **"Export to CSV"** button to download full group expense and settlement history (RFC 4180 format).
- Filterable and searchable chronological activity feed with expandable comment threads.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ or 20+
- npm or pnpm

### 1. Clone & Install Dependencies
```bash
cd roommate-expense-splitter
npm install
```

### 2. Environment Setup
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Configuration in `.env`:
```env
# Default zero-config SQLite for local dev
DATABASE_URL="file:./dev.db"

# For PostgreSQL in production, set:
# DATABASE_URL="postgresql://postgres:password@localhost:5432/splitter_db?schema=public"

NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-generated-nextauth-secret-here"
```

### 3. Initialize Database & Seed Demo Data
```bash
# Push Prisma schema to create tables
npx prisma db push

# Seed realistic roommate data spanning 6 months
npm run prisma:seed
```

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 👥 Pre-Seeded Demo Accounts

You can test the app instantly by clicking the **1-Click Demo Accounts** on the login page:

| Roommate Name | Email | Password | Role / Balance Status | UPI ID |
|---|---|---|---|---|
| **Rahul Sharma** | `rahul@roommates.app` | `password123` | Creditor (Owed money) | `rahul.sharma@okhdfcbank` |
| **Priya Patel** | `priya@roommates.app` | `password123` | Roommate | `priya.patel@okaxis` |
| **Arjun Verma** | `arjun@roommates.app` | `password123` | Debtor (Owes money) | `arjun.verma@icici` |
| **Sneha Iyer** | `sneha@roommates.app` | `password123` | Roommate | `sneha.iyer@paytm` |

---

## 🗄️ Database Schema (`prisma/schema.prisma`)

- **`User`**: `id`, `name`, `email`, `passwordHash`, `upiId` (nullable), `createdAt`
- **`Group`**: `id`, `name`, `emoji`, `currency`, `monthlyGoal` (Int, in smallest currency unit), `inviteCode` (unique), `createdAt`
- **`GroupMember`**: `id`, `userId`, `groupId`, `joinedAt` (unique compound index on `[userId, groupId]`)
- **`Expense`**: `id`, `description`, `amount` (Int in paise), `category`, `splitType`, `receiptUrl`, `isRecurring`, `recurringInterval`, `nextDueDate`, `groupId`, `paidById`, `expenseDate`, `createdAt`
- **`ExpenseSplit`**: `id`, `expenseId`, `userId`, `amount` (Int in paise) — cascade delete
- **`ExpenseComment`**: `id`, `expenseId`, `userId`, `content`, `createdAt` — cascade delete
- **`Settlement`**: `id`, `groupId`, `fromUserId`, `toUserId`, `amount` (Int in paise), `note`, `createdAt`

---

## 🔌 API Route Handlers

- `GET /api/groups` — List user's groups with monthly stats and net balances
- `POST /api/groups` — Create a new group with auto-generated 6-char invite code
- `GET /api/groups/[groupId]` — Full group details, debts, members, and budget pulse
- `PUT /api/groups/[groupId]/goal` — Quick-edit monthly spending goal
- `POST /api/groups/join` — Join group using 6-character invite code
- `GET /api/groups/[groupId]/export` — Export group history to CSV
- `GET /api/expenses` — Filterable group expenses feed
- `POST /api/expenses` — Create expense and splits in atomic transaction with over-budget detection
- `DELETE /api/expenses/[expenseId]` — Delete expense (cascades splits)
- `POST /api/expenses/[expenseId]/comments` — Add comment to expense
- `GET /api/settlements` — List settlements for a group
- `POST /api/settlements` — Record payment settlement between roommates
- `GET /api/analytics` — 6-month historical spending data and category donut breakdown
