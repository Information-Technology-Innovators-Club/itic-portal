# 🌐 Information Technology Innovators Club (ITIC) Portal

Welcome to the **Information Technology Innovators Club (ITIC) Portal**, a high-performance, full-stack monorepo designed to streamline community engagement, event management, member identification, and announcements. 

The ITIC Portal integrates a cross-platform **React Native (Expo) mobile app** with **Supabase**, an **Express REST API server** utilizing **Drizzle ORM**, and a standalone **Vite + Tailwind CSS UI mockup playground sandbox**. All packages are managed seamlessly via a monorepo workspace.

---

## 🏛️ Repository Architecture

This repository is structured as a modern monorepo separating client interfaces, server backends, mockups, and shared schemas/configurations.

```text
├── .agents/                    # AI agents workspace memory and docs
├── artifacts/                  # Primary application deliverables
│   ├── mobile/                 # React Native / Expo Go Mobile application
│   ├── api-server/             # Node.js + Express backend server
│   └── mockup-sandbox/         # Vite + React + Tailwind + shadcn component playground
├── lib/                        # Shared workspace libraries
│   ├── api-client-react/       # Generated React Query hooks for the REST API
│   ├── api-spec/               # OpenAPI specification and Orval configuration
│   ├── api-zod/                # OpenAPI-to-Zod schemas for backend validation
│   └── db/                     # Drizzle ORM schemas and database migrations
├── package.json                # Root package configuration
└── pnpm-workspace.yaml         # Monorepo workspaces definition (supports pnpm / npm)
```

---

## 📱 1. Mobile Application (`artifacts/mobile`)

The ITIC Mobile app serves as the main gateway for members, executives, and admins. It provides digital identities, live event notifications, scanning check-ins, and direct admin moderation tools.

### Key Mobile Features
- **🔮 Interactive Glassmorphic ID Card**: A fully-customized digital member card with a responsive spring-based **3D Flip Animation** (powered by React Native Reanimated). The front exhibits details and a QR code containing member verification metadata. The back flips around to show academic level, programme, and core technological interests.
- **🛡️ Dynamic Role-Based Navigation**: High-level tabs like the **QR Code Scanner** and the **Manage (Executive) Console** are entirely hidden or visible depending on the logged-in user's role (`member`, `executive`, or `admin`).
- **📅 Events Dashboard**: Lists upcoming workshops, hackathons, and general meetings. Features a real-time countdown timer, a visual capacity meter tracking attendee limits, and instant RSVP capabilities.
- **📢 Announcements & Categories**: Color-coordinated announcements categorized dynamically (e.g., General, Workshops, Urgent, Hackathons).
- **📝 Multi-Step Dynamic Registration**: A smooth, 3-stage user onboarding form split into Personal, Academic, and Technical Interests & social platforms. Includes a real-time completeness tracker.
- **🚀 Spring Toast Engine**: Zero external dependencies—utilizes a high-performance custom toast manager driven by React Context and Reanimated spring springs.

### Tech Stack & Dependencies
- **Runtime**: React Native 0.81 (Expo SDK 54)
- **Routing**: Expo Router v6 (using file-based navigation)
- **Animation**: React Native Reanimated
- **Database / Auth Client**: Supabase Client SDK (`@supabase/supabase-js`)
- **QR Code Gen**: `react-native-qrcode-svg`

---

## 🗄️ 2. Supabase Backend Setup

The mobile application utilizes **Supabase** for fully managed user authentication, durable Postgres storage, Row Level Security (RLS) data isolation, and instant real-time synchronization.

### Database Schema Structure
The underlying schema file is located at `artifacts/mobile/supabase_schema.sql`. It defines:
1. `profiles`: Contains detailed member directories (UUID linked to auth.users, student numbers, tech stacks, experience levels, roles, and status).
2. `events`: Contains titles, descriptions, categories, capacity limits, dates, and attendance counters.
3. `announcements`: Houses news updates, categorized urgency flags, pinned items, and author relationships.
4. `attendance`: Maps members to checked-in events, tracking timestamps and which executive logged the entry.

### Setup Instructions
1. **Initialize Supabase**: Sign up or log into [Supabase](https://supabase.com) and create a new project.
2. **Apply the Schema**: Open your project's **SQL Editor** in the Supabase Dashboard, copy the contents of `artifacts/mobile/supabase_schema.sql`, paste them, and hit **Run**.
3. **Disable Email Confirmations** (Optional for smooth local development):
   - Go to **Authentication** ➔ **Settings** ➔ **Email Provider**.
   - Turn OFF **Confirm Email** so that newly registered accounts can log in immediately without verifying email.
4. **Configure Environment Variables**:
   Create a `.env` or set the environment variables in your deployment setup:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
   ```


### Database Schema 

## Table `profiles`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `member_id` | `text` |  Unique |
| `full_name` | `text` |  |
| `student_number` | `text` |  Unique |
| `email` | `text` |  Unique |
| `phone` | `text` |  Nullable |
| `gender` | `text` |  Nullable |
| `date_of_birth` | `text` |  Nullable |
| `faculty` | `text` |  Nullable |
| `department` | `text` |  Nullable |
| `programme` | `text` |  Nullable |
| `academic_level` | `text` |  Nullable |
| `semester` | `text` |  Nullable |
| `technology_interests` | `_text` |  Nullable |
| `programming_languages` | `_text` |  Nullable |
| `experience_level` | `text` |  Nullable |
| `has_laptop` | `bool` |  Nullable |
| `github_username` | `text` |  Nullable |
| `linked_in` | `text` |  Nullable |
| `portfolio` | `text` |  Nullable |
| `profile_picture` | `text` |  Nullable |
| `role` | `text` |  Nullable |
| `status` | `text` |  Nullable |
| `joined_date` | `timestamptz` |  Nullable |
| `last_active` | `timestamptz` |  Nullable |
| `email_verified` | `bool` |  Nullable |
| `profile_completeness` | `int4` |  Nullable |

## Table `events`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `title` | `text` |  |
| `description` | `text` |  Nullable |
| `date` | `text` |  |
| `time` | `text` |  Nullable |
| `venue` | `text` |  Nullable |
| `category` | `text` |  Nullable |
| `status` | `text` |  Nullable |
| `attendee_count` | `int4` |  Nullable |
| `max_attendees` | `int4` |  Nullable |
| `organizer_id` | `uuid` |  Nullable |
| `tags` | `_text` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |

## Table `announcements`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `title` | `text` |  |
| `content` | `text` |  |
| `category` | `text` |  Nullable |
| `author_id` | `uuid` |  Nullable |
| `author_name` | `text` |  Nullable |
| `is_pinned` | `bool` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |
| `updated_at` | `timestamptz` |  Nullable |

## Table `attendance`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `member_id` | `uuid` |  Nullable |
| `event_id` | `uuid` |  Nullable |
| `event_title` | `text` |  Nullable |
| `checked_in_at` | `timestamptz` |  Nullable |
| `checked_in_by` | `uuid` |  Nullable |

## RLS Policies

### `profiles`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `profiles_update` | UPDATE | authenticated | PERMISSIVE | `((auth.uid() = id) OR (EXISTS ( SELECT 1    FROM profiles p   WHERE ((p.id = auth.uid()) AND (p.role = ANY (ARRAY['executive'::text, 'admin'::text]))))))` | — |
| `profiles_insert` | INSERT | authenticated | PERMISSIVE | — | `(auth.uid() = id)` |
| `profiles_read` | SELECT | authenticated | PERMISSIVE | `true` | — |

### `events`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `events_write` | ALL | authenticated | PERMISSIVE | `(EXISTS ( SELECT 1    FROM profiles p   WHERE ((p.id = auth.uid()) AND (p.role = ANY (ARRAY['executive'::text, 'admin'::text])))))` | — |
| `events_read` | SELECT | authenticated | PERMISSIVE | `true` | — |

### `announcements`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `ann_write` | ALL | authenticated | PERMISSIVE | `(EXISTS ( SELECT 1    FROM profiles p   WHERE ((p.id = auth.uid()) AND (p.role = ANY (ARRAY['executive'::text, 'admin'::text])))))` | — |
| `ann_read` | SELECT | authenticated | PERMISSIVE | `true` | — |

### `attendance`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `att_insert` | INSERT | authenticated | PERMISSIVE | — | `(EXISTS ( SELECT 1    FROM profiles p   WHERE ((p.id = auth.uid()) AND (p.role = ANY (ARRAY['executive'::text, 'admin'::text])))))` |
| `att_read` | SELECT | authenticated | PERMISSIVE | `((member_id = auth.uid()) OR (EXISTS ( SELECT 1    FROM profiles p   WHERE ((p.id = auth.uid()) AND (p.role = ANY (ARRAY['executive'::text, 'admin'::text]))))))` | — |


### Creating Your First Admin Account
Since standard sign-ups default to a `'member'` role with a `'pending'` status, follow these steps to bootstrap your primary Administrator:
1. Navigate to the **Authentication** tab ➔ **Users** ➔ **Add User** (Create User).
2. Copy the newly generated **User ID (UUID)**.
3. Open the **SQL Editor** and run the following insert statement (replace placeholders):
   ```sql
   INSERT INTO public.profiles (
     id, member_id, full_name, student_number, email, role, status, email_verified, profile_completeness
   ) VALUES (
     'YOUR-COPIED-USER-UUID-HERE',
     'ITIC-2026-0001',
     'Admin Name',
     'ADMIN-ST-001',
     'admin@yourdomain.com',
     'admin',
     'active',
     true,
     100
   );
   ```

---

## 💻 3. UI Mockup Sandbox (`artifacts/mockup-sandbox`)

The mockup sandbox is a localized prototyping playground. It provides visual isolation to iterate on components and responsive dashboard wireframes before porting them to mobile web formats or staging envs.

### Mockup Key Features
- **Vite-based Hot-Reloading**: Near-instant updates to styling and layout.
- **Infinite Grid UI**: Implements custom Tailwind CSS canvas patterns for endless spacing.
- **Custom Sandbox Plugin**: Runs an internal vite watch system tracking mockup modifications dynamically.

### Setup & Running
```bash
# Navigate to sandbox
cd artifacts/mockup-sandbox

# Start dev preview
pnpm run dev
# or
npm run dev
```

---

## ⚙️ 4. Express REST API Server (`artifacts/api-server`)

The `api-server` serves as the centralized backend option for relational data operations. It interfaces with PostgreSQL using **Drizzle ORM** for extreme safety, type matching, and query speed.

### Tech Stack & Features
- **Framework**: Express.js (strict TypeScript)
- **Database Engine**: PostgreSQL with Drizzle ORM
- **API Spec**: Documented with OpenAPI (`lib/api-spec/openapi.yaml`)
- **Code Generation**: Automated Zod validators (`lib/api-zod`) and type-safe Axios React Query clients (`lib/api-client-react`) using Orval.
- **Logger**: Pino-HTTP and custom pretty streams for reliable audit trails.

### Setup & Running
Ensure you have a local PostgreSQL instance running and configured in your `.env`:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/itic_db
PORT=5000
```
Run development tasks:
```bash
# Build & start api server
cd artifacts/api-server
pnpm run dev
# or
npm run dev
```

---

## 🛠️ Monorepo Usage & Staging

This project is set up to run using package managers that support workspaces.

### Initial Installation
Run this at the root directory:
```bash
# Using pnpm (highly recommended)
pnpm install

# Or using npm
npm install
```

### Running Applications
To spin up separate environments:
```bash
# Run Mobile App Metro Packager
cd artifacts/mobile
pnpm run dev

# Run Mockup Sandbox
cd artifacts/mockup-sandbox
pnpm run dev

# Run Backend Express API
cd artifacts/api-server
pnpm run dev
```

### Code Generation (OpenAPI schemas)
Whenever you modify the OpenAPI specification in `lib/api-spec/openapi.yaml`, run code generation to update client hook bindings:
```bash
cd lib/api-spec
pnpm run codegen
```

---

## 📑 5. Shared Libraries (`lib/`)

Our shared code libraries abstract complexity and guarantee type-safety across applications:
1. **`lib/db`**: Database schemas (`src/schema/index.ts`) matching Postgres and configured via `drizzle.config.ts`.
2. **`lib/api-spec`**: OpenAPI 3.0 specs containing route configurations and payload validations.
3. **`lib/api-zod`**: Programmatically-generated Zod validators guaranteeing strict request/response data shapes.
4. **`lib/api-client-react`**: React Query hooks auto-compiled directly from your backend endpoints.

---

## 🤝 Contributing
Please check our [CONTRIBUTING.md](./CONTRIBUTING.md) to understand linting procedures, commit formatting rules, and branch specifications.

---

## 📄 License
This project is licensed under the **MIT License**.
