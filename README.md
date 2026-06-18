# Koolerr

AI Workforce Platform — Phase 1 Development Environment

---

## Tech Stack

| Layer           | Technology               |
| --------------- | ------------------------ |
| Framework       | Next.js 15 (App Router)  |
| Language        | TypeScript 5             |
| Styling         | Tailwind CSS + shadcn/ui |
| Database client | Supabase JS SDK          |
| Linting         | ESLint (Next.js config)  |
| Formatting      | Prettier                 |
| Git hooks       | Husky + lint-staged      |

---

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables:

```bash
cp .env.example .env.local
```

Fill in your Supabase project URL and anon key in `.env.local`.

3. Run the development server:

```bash
npm run dev
```

---

## Available Scripts

| Script                 | Description                      |
| ---------------------- | -------------------------------- |
| `npm run dev`          | Start the development server     |
| `npm run build`        | Build for production             |
| `npm run start`        | Start the production server      |
| `npm run lint`         | Run ESLint                       |
| `npm run typecheck`    | Run TypeScript type checking     |
| `npm run format`       | Format all files with Prettier   |
| `npm run format:check` | Check formatting without writing |

---

## Repository Structure

```
Foundation/         Governing documents — read before making structural changes
app/                Next.js App Router (layouts, pages, global styles)
domains/            Bounded domain contexts (identity, business-brain, etc.)
shared/             Platform-wide utilities, components, and hooks
infrastructure/     Deployment and environment configuration
docs/               Architecture Decision Records and project history
scripts/            Automation and tooling
public/             Static assets
```

See `CLAUDE.md` for AI coding agent operating instructions.

See `Foundation/` for all governing architecture and product documents.

---

## Adding shadcn/ui Components

```bash
npx shadcn@latest add <component>
```

Components are installed to `shared/components/ui/` as configured in `components.json`.
