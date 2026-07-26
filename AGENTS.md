# Repo-wide conventions

This is a monorepo with two subprojects: `api/` (NestJS) and `frontend/` (Next.js). Each has its own `AGENTS.md`/`CLAUDE.md` for project-specific rules; this file holds conventions that apply across both.

## Test naming

`it(...)` / `test(...)` descriptions must read as a full sentence starting with "should" (or "should not"), e.g.:

```ts
it('should return every user when no filter is given', async () => { ... });
it('should not redirect when the session is still valid', async () => { ... });
```

Apply this in both `api/` and `frontend/` test suites.