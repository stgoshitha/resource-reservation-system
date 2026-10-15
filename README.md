<div align="center">

<img src="public/ReserveHub-Logo.png" alt="ReserveHub Logo" width="150" />

# ReserveHub

### Resource booking, simplified.

A full-stack resource reservation platform for organizing shared spaces and resources, managing availability, and keeping bookings in one place.

**Next.js 16 · React 19 · TypeScript · PostgreSQL · Prisma 7 · Tailwind CSS 4**

[🌐 Live Demo](https://reservehub-portal.vercel.app/) · [Getting Started](#-getting-started) · [Features](#-features) · [Tech Stack](#-tech-stack) · [Project Structure](#-project-structure)

</div>

---

## 🌐 Live Demo

Explore the deployed application here:

**[Launch ReserveHub →](https://reservehub-portal.vercel.app/)**

### 👤 User access

To explore the user experience, open the live demo, register a new account, and sign in. You can then browse resources, select available time slots, and manage your reservations.

### 🛠️ Admin demo access

Use the following **demo-only** credentials to explore the administration features:

| Field | Demo credentials |
| --- | --- |
| Email | `admin@gmail.com` |
| Password | `admin@123` |

> **Demo security:** These credentials must only belong to a dedicated demonstration account with no sensitive or production data. Do not reuse this password for any other account. For a publicly accessible demo, restrict destructive admin actions or use disposable demo data.

## ✨ Overview

**ReserveHub** brings resource discovery, scheduling, and reservation administration into a single responsive web application. It separates the experience into two roles: **users**, who make and manage reservations, and **administrators**, who manage resources, categories, users, and reservation activity.

The application uses server-verified sessions and role-based checks to restrict access to protected pages and administrative APIs.

## 🚀 Features

### 👤 User experience

- Register, sign in, and sign out.
- Browse available resources and organize reservations.
- Create reservations for selected resources and time slots.
- View and manage personal reservation activity.
- Use a responsive interface on desktop and mobile.

### 🛠️ Administration

- Admin dashboard with operational statistics and recent reservations.
- Manage **resources** and **resource categories**.
- Configure booking intervals and operating hours, including standard, weekly, and always-open schedules.
- Review and manage reservations.
- Manage user accounts and account status.
- Role-restricted admin pages and API endpoints.

### 🔐 Authentication and security

- Password hashing using **Argon2id**.
- Database-backed sessions with randomly generated tokens.
- Hashed session tokens stored in the database; session cookies are **HttpOnly**.
- Expired sessions and inactive accounts are rejected.
- `ADMIN` / `USER` role-based access checks on protected routes.
- Public registration creates `USER` accounts, not administrators.
- Server-side input validation using **Zod**.

## 🧰 Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router) |
| Frontend | React 19, TypeScript |
| Styling | Tailwind CSS 4 |
| UI components | Radix UI, Lucide React |
| Database | PostgreSQL |
| ORM | Prisma 7 with PostgreSQL adapter |
| Authentication | Custom database-backed sessions, Argon2id |
| Validation | Zod |
| Notifications | Sonner |
| Date utilities | date-fns, React DayPicker |
| PDF utilities | jsPDF |

## ⚙️ Getting Started

### Prerequisites

- A compatible **Node.js** version for Next.js 16 (Node.js **20.9+**).
- **npm**.
- A running **PostgreSQL** database.

### 1. Clone the repository

```bash
git clone https://github.com/stgoshitha/resource-reservation-system.git
cd resource-reservation-system
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public"
```

Replace the example credentials and host with your PostgreSQL connection details. Check any additional environment variables required by the version you are running.

> **Security:** Never commit `.env`, passwords, session tokens, or production credentials to Git.

### 4. Prepare the database

Generate the Prisma client:

```bash
npx prisma generate
```

Apply the database schema using the approach configured for your environment:

```bash
# For an existing migration history
npx prisma migrate deploy

# OR, for a local development database without migrations
npx prisma db push
```

Use **one** of the schema-application approaches appropriate to your database. Avoid `db push` against production without reviewing the schema changes and your migration strategy first.

### 5. Start the development server

```bash
npm run dev
```

Open **http://localhost:3000** in your browser.

> New accounts created through public registration receive the `USER` role. An administrative account must be provisioned through a trusted, controlled process; changing the registration request body is not a valid way to create an admin.

## 📁 Project Structure

```text
resource-reservation-system/
├── app/
│   ├── admin/                 # Admin pages
│   ├── api/                   # Server-side API routes
│   ├── dashboard/             # User pages
│   ├── login/                 # Sign-in page and form
│   ├── register/              # Registration page and form
│   └── globals.css            # Global styles
├── components/                # Reusable UI and layout components
├── prisma/
│   └── schema.prisma          # Database models and enums
├── src/
│   ├── generated/prisma/      # Generated Prisma client
│   └── lib/                   # Database, auth, and shared logic
└── package.json
```

## 🗄️ Core Data Models

The Prisma schema includes:

| Model | Purpose |
| --- | --- |
| `User` | Accounts, roles, and active status |
| `UserSession` | Database-backed login sessions |
| `ResourceCategory` | Grouping, intervals, and operating hours |
| `ResourceCategorySchedule` | Day-of-week scheduling rules |
| `Resource` | Reservable resources and their status |
| `Reservation` | Confirmed and cancelled bookings |
| `ReservationHold` | Temporary slot holds with expiry |

## 🧪 Development Commands

```bash
npm run dev       # Start development server
npm run build     # Create production build
npm run start     # Run production build
npm run lint      # Run ESLint
npx prisma generate  # Regenerate Prisma client
```

## 🛡️ Access Control

| Account | Pages | Permissions |
| --- | --- | --- |
| Guest | Login and registration | Create an account and sign in |
| User | User dashboard | Access personal booking workflows |
| Admin | Admin dashboard | Manage administrative workflows |

Route access is checked on the server against the current session. Administrative API routes should independently enforce `ADMIN` permissions; hiding menu items alone is not an authorization boundary.

## 📌 Project Status

**Actively developed.** Features, setup requirements, and deployment details may change as the project evolves.

## 📄 License

No license has been specified for this repository. Please contact the repository owner before reusing or redistributing the source code.

---

<div align="center">

**ReserveHub** — A more organized way to manage shared resources.

Built with Next.js, TypeScript, and PostgreSQL.

</div>
