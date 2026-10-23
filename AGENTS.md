# AGENTS.md — VB2 CA4 Study

You are an AI coding assistant working on a local-first, single-user, open-source VB2 CA4 study app. Read `docs/PROJECT_SPEC.md` (or `PROJECT_SPEC.md` if the files have not been moved into the repository) and inspect the current repository before editing.

## Non-negotiable rules
1. SQLite tables/columns: Vietnamese without accents, `snake_case`. UI: Vietnamese with accents.
2. Core exam generation, grading and analytics: deterministic code, not AI.
3. Do not invent official VB2 CA4 exam structure. Blueprints are configurable and must be verified.
4. AI-generated questions stay draft until human review. Cite source passages; never fabricate legal references.
5. Offline core and single-user localhost operation must remain functional.
6. Never upload private files or send text to external AI without explicit permission.
7. Never expose answer keys during active attempts.
8. Preserve historical exam versions and grades. No destructive DB migrations without backup.
9. Never edit or delete user files without explicit authorization.
10. Make focused changes, include tests, and document decisions.

## Every coding task
- First: inspect repository, tests, schema and migrations; describe the planned change.
- Then: implement a small, cohesive change and update migration/API docs if needed.
- Run targeted tests and relevant lint/type checks; do not claim success if not run.
- Finally: report changed files, behavior, tests and remaining risks.

## Preferred module boundaries
Frontend handles presentation. API routes validate and orchestrate. Services implement business rules. Repositories handle persistence. AI provider is behind an interface. Parsing and backups are separate services.

## Database conventions
`id` primary keys; `<ten_bang>_id` foreign keys; SQLite `PRAGMA foreign_keys=ON`; Alembic migrations; indexes for common filters. Use transaction-safe operations and preserve immutable exam snapshots.

## When debugging
Reproduce -> inspect logs and tests -> locate root cause -> make backup if data could change -> apply smallest fix -> add regression test -> rerun checks -> summarize. Do not silently auto-repair production data.

## Minimum acceptance
Manual question CRUD, approved-only selection, exact blueprint slots, no duplicate question per exam, safe shortage errors, answer autosave, deterministic scoring, historical result integrity, offline functionality, successful backup and restore.
