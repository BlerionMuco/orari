---
name: self-review
description: Adversarial self-review of a just-built feature in this booking SaaS — finds correctness bugs, cross-tenant leaks, data-integrity gaps, broken async/edge paths, and a11y holes before they ship. Use this whenever a feature, slice, or PR is finished and the user wants it checked: "self-review this", "review the wizard changes", "find what's broken in this feature", "anything wrong with this before I commit/merge?", or after completing any milestone task. Reviews against this project's actual stack and its known failure modes, not generic lint advice.
---

# Self-review

Find the cracks in a feature that was just built. The goal is to surface real defects — things that will be wrong in production, leak data across tenants, corrupt booking state, or break for a real user — not to nitpick style or restate what's already correct.

Treat this as adversarial. Assume the happy path was tested and the bugs are hiding in the boundaries: concurrency, timezones, empty/error states, the second tenant, the keyboard user, the migration that doesn't round-trip.

## Discipline (read first — this is what makes the review worth running)

This codebase's author catches sloppy reasoning fast and has no patience for false positives or filler. A review that cries wolf gets the skill deleted. So:

- **Confirm before claiming.** Read the actual code at the actual line before reporting an issue. Do not pattern-match to "this usually goes wrong." If you can't confirm without running it, put it under *Verify*, not *Findings*.
- **Never restate what's correct.** No "what you did well" section. No narrating the file back. Only what needs fixing.
- **Don't invent problems to look thorough.** A clean layer gets one line: "Auth: scoped correctly, no findings." Silence is a valid result.
- **No style nits** unless they violate an explicit rule in `CLAUDE.md`. Naming opinions, formatting, and "I'd have done it differently" are out of scope.
- **Severity honestly.** Don't inflate a medium to a blocker for attention. Don't bury a real data leak in a list of trivia.

## Workflow

### 1. Establish scope
Identify what this feature actually changed. Prefer `git diff` against the base branch (or last commit); if the boundary is unclear, ask which files/PR — don't review the whole repo. Read the changed files **in full**, not just the diff hunks — a bug is often in the unchanged code the change now interacts with.

### 2. Load the project's rules
Read `CLAUDE.md`. Skim the relevant project docs for what this feature touches (`tech-stack.md`, the V1 scope doc, `color-system.md`). Align the review to these conventions — don't invent new ones. If the feature contradicts a locked V1 decision (confirm-only booking, guest booking without forced login, no customer-facing payments, multi-resource), that itself is a finding.

### 3. Run the deterministic checks
These catch "not working" cheaply and objectively. Run what the project has (adapt to its package manager and scripts — check `package.json`):

```
<pm> typecheck      # tsc --noEmit, strict mode
<pm> lint
<pm> build          # App Router build surfaces server/client boundary + RSC errors
<pm> test           # if tests exist for the touched area
```

Capture failures verbatim — they go at the top of the report. A green build is not a passing review; it's the floor.

### 4. Deep review against the checklist
Open `references/review-checklist.md` and go layer by layer — but **only the layers this feature touches**. A pure-UI change doesn't need the migration audit; a schema change does. The checklist is organized so you can jump to the relevant sections.

For each candidate issue: locate it in the code, confirm it, decide severity, and write the fix. If you're not sure, it's a *Verify* item.

### 5. Report
Use the format below. Findings only, ranked by severity. If the feature is clean, say so and list what you checked — don't manufacture findings.

## Report format

```
## Self-review: <feature name>

### Tooling
typecheck: ✅ / ❌ <paste failures>
lint:      ✅ / ❌
build:     ✅ / ❌
tests:     ✅ / ❌ / none for this area

### Findings
(ordered blocker → high → medium → low; omit empty severities)

**[BLOCKER] <short title>** — `path/to/file.ts:42`
What's wrong, concretely (1–2 sentences).
Consequence: what breaks, and under what conditions.
Fix: the specific change.

**[HIGH] ...**
...

### Verify (couldn't confirm — needs you to check or run)
- `path:line` — <what to check and why it's suspicious>

### Checked, clean
- Tenant scoping, server-action auth, migration round-trip  (one line — no detail needed)
```

**Severity:**
- **BLOCKER** — ships broken, or leaks/corrupts data across tenants. Do not merge.
- **HIGH** — wrong under realistic conditions (a real second barber, a fully-booked day, a DST boundary, a slow network).
- **MEDIUM** — edge case or degraded UX (missing empty/error state, focus not managed).
- **LOW** — maintainability or a CLAUDE.md rule violation with no functional impact.

Keep prose tight. The author wants `path:line`, the consequence, and the fix — not a lecture.
