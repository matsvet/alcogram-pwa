# Repository Guidelines

## Project Structure & Module Organization

The application is a React 19 + TypeScript PWA built with Vite. Source code is
under `src/`: page-level UI belongs in `src/pages/`, reusable UI in
`src/components/`, IndexedDB access in `src/db.ts`, and domain types in
`src/types.ts`. Keep pure calculations and import helpers in `src/utils/`.
Cloud configuration and synchronization live in `src/lib/supabase.ts` and
`src/sync/`. Static files, seed data, and PWA icons are in `public/`.
`supabase/schema.sql` defines the optional Supabase backend schema.

## Build, Test, and Development Commands

- `npm install`: install the locked dependencies from `package-lock.json`.
- `npm run dev`: start the Vite development server.
- `npm run lint`: run Oxlint over TypeScript and React code.
- `npm run build`: type-check with `tsc -b` and create the production bundle.
- `npm run preview`: serve the built bundle locally after `npm run build`.

There is no automated test suite yet. At minimum, run `npm run lint` and
`npm run build` before submitting changes, then exercise the changed flow in
the browser. For IndexedDB or sync changes, verify create, edit, delete, and
reload behavior; sync uses soft deletes and last-write-wins timestamps.

## Coding Style & Naming Conventions

Follow the existing TypeScript style: two-space indentation, single quotes,
no semicolons, and trailing commas in multiline expressions. Use functional
React components and named exports for components. Name component and page
files in PascalCase (for example, `DrinkForm.tsx`); use camelCase for helper
modules and functions (for example, `utils/date.ts`). Import types with
`import type`. Keep browser-facing text consistent with the existing Russian
UI unless the task explicitly changes the product language.

## Configuration, Data, and Security

Copy `.env.example` to `.env.local` for local Supabase setup. Only expose the
Supabase project URL and publishable/anon key through `VITE_` variables; never
commit service-role credentials. Treat files under `public/seed/` and
`public/sample-data/` as public deployment assets: do not place personal data
there. Apply backend schema changes deliberately in `supabase/schema.sql`.

## Commits & Pull Requests

Recent history uses short, imperative, descriptive subjects, such as `Add
Supabase cloud sync for cross-device use`. Keep each commit focused. Pull
requests should state the user-visible change, list validation commands, link
the relevant issue when present, and include screenshots or a short recording
for UI changes. Call out any required Supabase migration or environment change.
