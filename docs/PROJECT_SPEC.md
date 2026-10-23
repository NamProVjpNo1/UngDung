# VB2 CA4 Study — AI Project Master Specification
Version: 1.0 | Status: proposed, not implemented | Language: Vietnamese

## 1. Vision
Build a local-first, single-user, open-source study application for Vietnamese VB2 CA4 exam preparation. It imports PDF/DOCX, accepts manually authored questions, optionally uses AI to draft questions, requires human review, generates configurable exams, grades objective answers deterministically, and recommends review based on performance. The app must be easy to inspect, repair, extend, and hand off between AI coding assistants.

## 2. Fixed decisions
- Primary platform: Windows desktop; web UI served on localhost.
- Single user, no cloud account requirement; offline core functionality.
- Frontend: React + TypeScript + Vite; Tailwind CSS / shadcn/ui optional.
- Backend: Python + FastAPI; SQLAlchemy + Alembic.
- Database: SQLite with foreign keys ON on every connection; FTS5 when available.
- Documents: PDF (PyMuPDF), DOCX (python-docx); scanned PDF needs separate OCR workflow.
- AI: optional, network-dependent, provider/model configurable; AI never grades official multiple-choice scores or chooses exam questions.
- SQLite table/column names: lowercase Vietnamese WITHOUT diacritics, snake_case. UI and documentation: Vietnamese WITH diacritics.
- Source code identifiers for internal Python/TypeScript functions may be English for interoperability, but public DB names follow the Vietnamese convention.
- Sensitive content: no external transmission without explicit user confirmation.

## 3. Functional modules
1. `tai_lieu`: import, file hash deduplication, versioning, extraction, chapter/article/clause segmentation, provenance and validity.
2. `chu_de`: hierarchical subjects, tags, topic mapping.
3. `cau_hoi`: manual CRUD, versions, options, types, difficulty, source citations, statuses draft/approved/rejected/retired, duplicate checks.
4. `mau_de_thi`: configurable exam blueprints and allocation slots; never hardcode unverified official VB2 CA4 structure.
5. `de_thi`: deterministic generation, hard slot constraints, recent-exam exclusion as soft constraint, same-source diversification, stored random seed and snapshots.
6. `lan_lam_bai`: autosave, server deadline, submission, immutable result, objective grading by code, per-question response details.
7. `thong_ke`: accuracy by topic, time per question, trends, weakness analysis, due review.
8. `on_tap`: wrong-question drills, spaced repetition, mastery states.
9. `tac_vu_ai`: explicit generation jobs, JSON validation, costs and audit metadata, human approval before question use; AI essay feedback is advisory only.
10. `sao_luu`: consistent SQLite backup plus document files, integrity check, restore and export.
11. `he_thong`: logs, health checks, migration status, diagnostics, safe repair guidance.

## 4. Database naming and core entities
- `tai_lieu`, `phien_ban_tai_lieu`, `doan_tai_lieu`
- `chu_de`, `cau_hoi`, `phien_ban_cau_hoi`, `lua_chon_dap_an`, `trich_dan_cau_hoi`
- `mau_de_thi`, `phan_bo_de_thi`, `de_thi`, `cau_hoi_trong_de`
- `lan_lam_bai`, `cau_tra_loi`, `lich_on_tap`
- `tac_vu_ai`
Recommended extensions: `kiem_duyet_cau_hoi`, `phan_hoi_cau_hoi`, `phien_hoc`, `su_kien_on_tap`, `nhat_ky_he_thong`, `ban_sao_luu`.
Use `id` for primary keys, `<ten_bang>_id` for foreign keys. All FK constraints must be enforced; migration files are version-controlled. Keep immutable exam-question versions and grading rules for historical reproducibility. Use logical retirement instead of destructive deletion for referenced records.

## 5. Exam generation contract
Input: blueprint ID, mode, recent-exam window (default 3), seed, diversification preferences.
Hard constraints: approved and valid questions, exact blueprint counts by topic/type/difficulty, no duplicate question within exam, eligible source and answer validation.
Soft constraints: exclude last 3 exams, avoid same `doan_tai_lieu`, avoid semantically similar questions, promote variety.
Algorithm: fetch eligible pool -> build candidate sets for every blueprint slot -> solve constrained assignment (matching/backtracking) -> optimize soft preferences -> persist exam with immutable question version, option order, scoring snapshot and seed in one transaction.
If insufficient eligible questions, return structured shortage details; do NOT silently alter blueprint ratios. Allow explicit user choice to relax only soft constraints.

## 6. Data ingestion and question lifecycle
Upload -> SHA-256 check -> store original file -> extract text -> segment and keep page/article provenance -> review segmentation -> manually add questions OR explicitly invoke AI -> validate AI JSON -> check duplicate and citation -> human review -> approve -> exam eligibility.
AI must not invent legal references or automatically mark a draft approved. Mark affected questions for review when source version changes or expires.

## 7. API contract (prefix `/api/v1`)
- `POST /documents`, `GET /documents`, `POST /documents/{id}/parse`, `GET /documents/{id}/chunks`
- `GET /topics`
- `POST /questions`, `GET /questions`, `PATCH /questions/{id}`, `POST /questions/{id}/review`
- `POST /blueprints`, `GET /blueprints`
- `POST /exams/generate`, `GET /exams/{id}` (hide answer key until submitted)
- `POST /attempts`, `PUT /attempts/{id}/answers/{position}`, `POST /attempts/{id}/submit`, `GET /attempts/{id}/result`
- `GET /analytics/overview`, `GET /analytics/topics`, `GET /reviews/due`
- `POST /ai/jobs`, `GET /ai/jobs/{id}`
- `POST /backup`, `GET /system/health`
Use typed Pydantic request/response schemas, clear HTTP errors, idempotent submission, transaction boundaries and OpenAPI docs.

## 8. Desktop UI screens
Dashboard; Document Library; Document Reader/Segmentation; Question Bank; Question Editor/Review; Exam Blueprint Editor; Exam Room; Result and Explanations; Analytics; Review Queue; AI Jobs; Settings/Backup/Diagnostics. All user-facing strings in Vietnamese.

## 9. Architecture and source layout
```
vb2-ca4-study/
  AGENTS.md
  README.md
  LICENSE
  CONTRIBUTING.md
  CHANGELOG.md
  docs/PROJECT_SPEC.md
  docs/architecture.md
  docs/database.md
  docs/api.md
  backend/app/api/
  backend/app/models/
  backend/app/schemas/
  backend/app/repositories/
  backend/app/services/
  backend/app/db/
  backend/migrations/
  backend/tests/
  frontend/src/pages/
  frontend/src/components/
  frontend/src/services/
  frontend/src/types/
  scripts/
  data/  # gitignored
```
Keep modules loosely coupled; use dependency injection for AI providers, parsers and backup services. No business logic in UI components or HTTP route handlers.

## 10. Security, privacy, maintenance
Bind server to 127.0.0.1 by default. Restrict CORS. Validate uploads, limit size, sanitize filenames and protect against path traversal. Never commit API keys, private documents, SQLite databases or backups. Store secrets in environment variables or OS credential storage. Use SQLite online backup API and verify restore on a copy. Include logs without sensitive source text. Diagnose before repair; back up before migrations or destructive fixes. AI-generated patches require tests and human review; no automatic production self-modification.

## 11. Open-source standards
Choose an explicit LICENSE (suggest MIT or Apache-2.0, final choice by project owner); README with install/run instructions; CONTRIBUTING; issue/PR templates; changelog; automated tests; pinned dependencies; sample sanitized seed data; reproducible setup; GitHub Actions optional. Do not claim open-source until license and public repository are actually provided.

## 12. Definition of done
- Unit tests for blueprint slot allocation, grading, duplicate exclusion, answer validation, review scheduling.
- Integration tests for import, CRUD, exams, autosave, submission, migrations and restore.
- Offline core passes without network.
- No answer keys in active exam responses.
- Exact blueprint adherence or explicit shortage error.
- Referential integrity and reproducible exam history.
- New developer/AI agent can install, run tests and understand module boundaries using README and AGENTS.md.

## 13. Phased delivery
P0: repository, tooling, Vietnamese schema, migrations, manual questions CRUD.
P1: blueprint configuration, deterministic exam generation, exam room, autosave, grading.
P2: results, analytics, backup/restore and diagnostics.
P3: PDF/DOCX import, chunking, citations and source-version review.
P4: AI draft generation, manual approval workflow and job audit.
P5: spaced repetition, essay feedback, desktop packaging and polish.

## 14. Explicit unknowns — do not invent
Official VB2 CA4 exam subjects, question counts, scoring, timing and blueprint must be verified against official material for the relevant year. AI provider model names, costs, license choice and Windows packaging approach remain configurable decisions.

## 15. Instruction to AI coding assistants
Read AGENTS.md and this specification before coding. Inspect existing files and migrations; do not assume features are implemented. Implement the smallest coherent vertical slice, provide migrations and tests, run them, report exact changed files, commands, failures and next steps. Never change DB naming conventions, exam constraints or data-privacy rules without explicit approval. Do not overwrite user data. Ask for official exam blueprint when required rather than fabricating it.
