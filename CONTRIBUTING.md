# Contributing

Thank you for contributing to **Saki Operations**.

This guide defines how we develop so the codebase stays scalable, consistent, and enterprise-ready for years.

---

## Before you start

1. Read [ARCHITECTURE.md](./ARCHITECTURE.md), [STANDARDS.md](./STANDARDS.md), and [SECURITY.md](./SECURITY.md).
2. Check [ROADMAP.md](./ROADMAP.md) for the active phase.
3. Check [KNOWN_ISSUES.md](./KNOWN_ISSUES.md) for known debt and bugs.
4. If you believe a better architecture exists than what was requested — **stop**, document the recommendation, and wait for approval. Do not silently change architecture.

---

## Development principles

| Rule | Detail |
| ---- | ------ |
| Always use TypeScript | No plain JavaScript in apps or packages |
| Never duplicate code | Extract shared logic to the correct package |
| Always create reusable components | UI building blocks belong in `@saki-operations/ui` |
| Always support responsive layouts | Mobile-first; phones → desktop; no horizontal scroll |
| Always support English and Sinhala | Wire copy through `@saki-operations/i18n` |
| Never hardcode visible text | No user-facing string literals in components/screens |
| Always update CHANGELOG | Every phase/feature set updates [CHANGELOG.md](./CHANGELOG.md) |
| Always write clean commits | Follow [STANDARDS.md](./STANDARDS.md) commit conventions |
| Never invent fake business data | No placeholder domain records or mock business logic unless explicitly requested |
| Never skip documentation | Update relevant docs in the same change set |

---

## Local setup

```bash
pnpm install
cp .env.example .env
docker compose -f docker/docker-compose.yml up postgres -d
pnpm db:generate
pnpm dev
```

- Web: http://localhost:5173
- API health: http://localhost:3000/api/v1/health

---

## Workflow

1. Create a branch from the agreed base (`main` / active release branch).
2. Implement only the scoped phase work.
3. Run checks:

```bash
pnpm lint
pnpm typecheck
pnpm build
```

4. Update documentation:
   - [CHANGELOG.md](./CHANGELOG.md) (required)
   - [ROADMAP.md](./ROADMAP.md) if phase status changed
   - [DECISIONS.md](./DECISIONS.md) if an architecture decision was approved
   - [KNOWN_ISSUES.md](./KNOWN_ISSUES.md) if debt/bugs were found or fixed
5. Open a pull request with a clear summary and test plan.

---

## Module ownership

- Frontend modules live in `apps/web/src/modules/<name>`
- Backend modules live in `apps/api/src/modules/<name>`
- **Names must always match**
- Shared UI does not own domain business rules

---

## Pull request checklist

- [ ] Scope matches the approved phase
- [ ] TypeScript strict; no `any` without justification
- [ ] No hardcoded user-facing strings
- [ ] en + si keys added when new copy is introduced
- [ ] Responsive on small phone → desktop
- [ ] Accessibility considered (labels, focus, contrast)
- [ ] CHANGELOG updated
- [ ] No secrets committed
- [ ] No unnecessary files or placeholder business logic

---

## Code review expectations

Reviewers verify:

- Architectural alignment with approved decisions
- Reuse over duplication
- Security hygiene (env, auth boundaries, data exposure)
- Documentation completeness

---

## Getting help

- Architecture questions → [ARCHITECTURE.md](./ARCHITECTURE.md) / [DECISIONS.md](./DECISIONS.md)
- Naming and commits → [STANDARDS.md](./STANDARDS.md)
- Security → [SECURITY.md](./SECURITY.md)
