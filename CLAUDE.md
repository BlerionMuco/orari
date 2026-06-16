# Project Conventions

These rules are mandatory. Follow them in all generated and edited code. If a rule conflicts with an existing pattern in the repo, follow the rule and flag the conflict.

Correctness is not optional. Do not guess at APIs, prop names, types, or behavior — if you are unsure, verify it or state the uncertainty explicitly rather than inventing something plausible. This site is used primarily on mobile, so mobile correctness is the top priority, not an afterthought.

## TypeScript

- Never use `any`. This includes `as any` casts and implicit `any` from untyped parameters. When a type is genuinely unknown, use `unknown` and narrow it before use.
- Types must be explicit and readable, not clever. Annotate function return types. Prefer plain, named types and interfaces over deeply nested conditional, mapped, or inferred type gymnastics. If a type is hard to read at a glance, simplify it.
- Assume `strict` mode is on. No suppressing errors with `@ts-ignore` or `@ts-expect-error` unless accompanied by a comment explaining why.

## Styling

- No inline styles. The `style={{ ... }}` prop is not allowed on components.
- Use Tailwind CSS utility classes via `className` for all styling.
- Avoid arbitrary-value classes (e.g. `w-[437px]`, `text-[#3a3a3a]`) except when a design genuinely requires it. Prefer the theme scale and define repeated values in the Tailwind config instead of hardcoding them.

## Mobile-First (top priority)

This product is used mostly on mobile. Every layout is designed for small screens first, then enhanced for larger ones — never the reverse.

- Write base styles for mobile. Add larger-screen overrides with `sm:` / `md:` / `lg:` prefixes only as enhancements. Do not write desktop styles as the base and shrink down.
- No fixed pixel widths that can overflow a phone. Use fluid widths, `flex`/`grid` that wraps, `max-w-*`, and responsive spacing.
- Touch targets must be at least ~44px tall/wide (e.g. `min-h-11`, adequate padding). Don't ship tap targets sized for a mouse.
- No hover-only interactions. Anything reachable by hover must also work on tap/focus, since touch devices have no hover.
- Inputs use a base font size of at least 16px (`text-base`) to prevent iOS auto-zoom on focus.
- Verify every layout reads and works at a ~375px viewport before considering it done. If something only works on desktop, it is not done.
- Mind mobile performance: lazy-load offscreen images, avoid shipping oversized assets, and don't pull in heavy dependencies for trivial gains.

## Routing & File Naming

- Route paths use **kebab-case** — hyphenate multi-word URL segments. Use `/sign-in`, `/sign-up`, `/forgot-password`, `/reset-password`, `/verify`. Never `signin`, `signUp`, `sign_up`, or camelCase in a URL.
- App Router folder names must match the URL segment exactly (`src/app/(auth)/sign-in/`), so the folder is kebab-case too.
- Route groups in parentheses (e.g. `(auth)`, `(dashboard)`) and dynamic segments (`[orgSlug]`) follow the existing conventions.
- Component and section file names are kebab-case as well (`sign-in-form.tsx`), matching the existing repo pattern.

## Component Architecture

There is a strict three-level hierarchy: **Page → Section → Component**. Responsibilities do not leak across levels.

### Components (low-level, leaf)
- Presentational only. No business logic, no data fetching, no global/shared state.
- Receive everything they need through props and render it. Local UI state (e.g. "is this dropdown open") is allowed; anything beyond that is not.
- Must be reusable and unaware of where their data came from.

### Sections
- Group related components into a meaningful part of a page (e.g. Header, Hero, Footer).
- Compose components and arrange layout. They do not own business logic; they pass data down to the components they render.

### Pages
- Pages are the only place business logic and data live: data fetching, state management, and orchestration.
- A page composes sections (and through them, components) and passes data down via props.
- Pages render sections/components — they should not contain raw, low-level markup themselves.

### Rule of thumb
- Logic flows down from pages as data; markup lives in components. If you find yourself adding logic to a component or section, lift it up to the page.

### Shared UI library (`src/components/ui/`)
- Do not keep `src/components/ui/` as a flat dump of files. Group the primitives into **category subfolders by kind**, and import from the full path.
- Categories so far (add more as the library grows):
  - `ui/form/` — form controls: `input`, `label`, `field`, `password-input`, `otp-input`
  - `ui/buttons/` — `button` and other action triggers
  - `ui/icons/` — icon components (e.g. `google-icon`)
  - future kinds get their own folder: `ui/feedback/` (toast, alert), `ui/overlay/` (dialog, popover, tooltip), `ui/navigation/` (tabs, menu), etc.
- A new primitive goes into the folder matching its category; create the folder if it doesn't exist yet. Import via the categorized path, e.g. `import { Input } from "@/components/ui/form/input"`.

### Documentation

- Each feature that will be updated or created should have a .md file under docs folder. So if we are working on a v1 feature fixing something on auth side then the auth.md file that is under v1 folder should be updated with the updated change.

- Everytime that a feature is developed or updated please keep updated the roadmap. So everything will be tracked and updated
