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

- `pnpm install --frozen-lockfile`: install the locked dependencies from `pnpm-lock.yaml`.
- `pnpm dev`: start the Vite development server.
- `pnpm lint`: run Biome linting over TypeScript and React code.
- `pnpm format`: format the codebase with Biome.
- `pnpm check`: run Biome linting, formatting, and import checks.
- `pnpm check:write`: apply safe Biome fixes across the codebase.
- `pnpm build`: type-check with `tsc -b` and create the production bundle.
- `pnpm preview`: serve the built bundle locally after `pnpm build`.

There is no automated test suite yet. At minimum, run `pnpm check` and
`pnpm build` before submitting changes; the pre-commit hook also runs
`pnpm check`. Then exercise the changed flow in the browser. For IndexedDB
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

### CSS Modules

Use CSS Modules with native CSS for component and page styles. Keep each
`Component.module.css` next to its `Component.tsx`; global CSS in `src/app/styles/`
is limited to reset, design tokens, base element rules, and truly global
animations.

Apply BEM as a local naming principle, not as literal global class names:

- The module file is the block. Use short semantic element names such as
  `.root`, `.header`, `.actions`, and `.monthNavigation`, not
  `.calendarPage__monthNavigation`.
- Name modifiers and state predicates `.isActive`, `.isBlank`, `.hasError`,
  and combine them explicitly in JSX.
- Prefer a class on the element over descendant selectors. Use a descendant
  selector only when the structural relationship is essential, and keep it
  shallow.
- Keep the class name about the UI role, not its appearance. Use
  `.primaryAction`, not `.blueButton`.
- Extract a shared UI component only after confirmed reuse; do not create a
  global stylesheet of component classes.

## Configuration, Data, and Security

Copy `.env.example` to `.env.local` for local Supabase setup. Only expose the
Supabase project URL and publishable/anon key through `VITE_` variables; never
commit service-role credentials. Do not place personal data under `public/`:
it is deployed publicly. Apply backend schema changes deliberately in
`supabase/schema.sql`.

## Collaboration Conventions

Follow [CONTRIBUTING.md](CONTRIBUTING.md) for branch names, commit text, pull
requests, and Feature-Sliced Design conventions.

After completing work in a new branch, push it, create a draft pull request to
`main` unless instructed otherwise, and include its direct GitHub link in the
final response. Do this even when the user asks only to commit and push.
