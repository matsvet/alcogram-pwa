# Repository Guidelines

## Project Structure & Module Organization

The application is a React 19 + TypeScript PWA built with Vite and Feature-
Sliced Design v2.1. Source code is under `src/`: application composition,
entry point, global styles, and navigation belong in `src/app/`; route-level
UI belongs in page slices under `src/pages/`; reusable cross-page interactions
belong in `src/features/`; infrastructure belongs in `src/shared/`. Imports
may only go to a lower FSD layer, and page or feature slices are imported
through their `index.ts` public API. Static files and PWA icons are in
`public/`.
`supabase/schema.sql` defines the optional Supabase backend schema.

## Build, Test, and Development Commands

- `npm install`: install the locked dependencies from `package-lock.json`.
- `npm run dev`: start the Vite development server.
- `npm run lint`: run Biome linting over TypeScript and React code.
- `npm run format`: format the codebase with Biome.
- `npm run check`: run Biome linting, formatting, and import checks.
- `npm run check:write`: apply safe Biome fixes across the codebase.
- `npm run build`: type-check with `tsc -b` and create the production bundle.
- `npm run preview`: serve the built bundle locally after `npm run build`.

There is no automated test suite yet. At minimum, run `npm run check` and
`npm run build` before submitting changes; the pre-commit hook also runs
`npm run check`. Then exercise the changed flow in the browser. For IndexedDB
or sync changes, verify create, edit, delete, and reload behavior; sync uses
soft deletes and last-write-wins timestamps.

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
commit service-role credentials. Do not place personal data under `public/`:
it is deployed publicly. Apply backend schema changes deliberately in
`supabase/schema.sql`.

## Commits & Pull Requests

Recent history uses short, imperative, descriptive subjects, such as `Add
Supabase cloud sync for cross-device use`. Keep each commit focused. Pull
requests should state the user-visible change, list validation commands, link
the relevant issue when present, and include screenshots or a short recording
for UI changes. Call out any required Supabase migration or environment change.

When the user asks for a commit description, commit title, or commit text,
reply in Russian using this structure: a concise summary on the first line,
then a blank line and 2-4 short bullets that clarify the changes. Use a hyphen
for each bullet.

```text
Краткое описание изменения

- Первая важная деталь
- Вторая важная деталь
```
