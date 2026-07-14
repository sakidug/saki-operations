# Project Standards

Engineering standards for **Saki Operations**.

These conventions are mandatory unless an approved decision in [DECISIONS.md](./DECISIONS.md) supersedes them.

---

## 1. Folder naming

| Rule | Example |
| ---- | ------- |
| Use `kebab-case` for directories | `saki-tours`, `offline-cache` |
| Domain modules use shared names on web + API | `apps/web/src/modules/payroll` ↔ `apps/api/src/modules/payroll` |
| Prefer plural only when naturally plural collections | `vehicles`, `employees` |
| Avoid abbreviations unless ubiquitous | `auth`, `i18n` OK; `mgr` not OK |

---

## 2. File naming

| Type | Convention | Example |
| ---- | ---------- | ------- |
| React components | `PascalCase.tsx` | `TopNavigation.tsx` (or kebab file with Pascal export in packages — prefer kebab in packages: `top-navigation.tsx`) |
| NestJS classes | `kebab-case.type.ts` | `payroll.module.ts`, `users.service.ts` |
| Hooks | `use-thing.ts` / `useThing.ts` | Prefer `use-locale.ts` in packages |
| Utilities | `kebab-case.ts` | `format-currency.ts` |
| Constants | `kebab-case.ts` | `http-status.ts` |
| Translation files | `kebab-case.json` | `common.json` |
| Docs | `SCREAMING_SNAKE` for root governance; numbered folders under `docs/` | `CHANGELOG.md`, `docs/01-project-vision` |

**Package UI convention:** component files use `kebab-case.tsx` (shadcn style).

---

## 3. React components

1. Function components only (no class components).
2. TypeScript props interfaces/types exported when reused.
3. No hardcoded user-facing strings — accept `ReactNode`/translated strings or use i18n hooks in app modules.
4. Mobile-first class ordering; verify small phone → desktop.
5. Prefer composition over prop explosion.
6. Put reusable primitives in `@saki-operations/ui`.
7. Keep business logic out of presentational components.
8. Accessibility: labels for icon buttons, focus states, meaningful headings.

---

## 4. NestJS modules

1. One domain module folder per mirrored name under `src/modules/<name>`.
2. Typical files: `*.module.ts`, `*.controller.ts`, `*.service.ts`, `dto/*.ts`.
3. Cross-cutting code belongs in `common/` or `infrastructure/`, not domain modules.
4. Validate DTO input with `class-validator`.
5. Do not return raw ORM entities across API boundaries without an explicit contract.
6. Controllers stay thin; services own business rules (when introduced).

---

## 5. Database naming

| Asset | Convention | Example |
| ----- | ---------- | ------- |
| Tables | `snake_case`, plural | `employees`, `trip_stops` |
| Columns | `snake_case` | `created_at`, `vehicle_id` |
| Primary keys | `id` (UUID preferred for new tables) | `id` |
| Foreign keys | `<entity>_id` | `employee_id` |
| Enums | `PascalCase` in Prisma; mapped carefully | `TripStatus` |
| Migrations | Prisma-generated timestamp names | — |

Never edit applied migrations; create a new migration instead.

---

## 6. API naming

| Rule | Example |
| ---- | ------- |
| Global prefix | `/api/v1` |
| Resources plural nouns | `/api/v1/vehicles` |
| kebab-case path segments | `/api/v1/saki-tours` |
| Use HTTP verbs correctly | `GET` read, `POST` create, `PATCH` partial update, `DELETE` remove |
| Consistent error envelope | shared `ApiError` shape from `@saki-operations/types` |
| Pagination query params | `page`, `pageSize` (unless ADR changes) |

---

## 7. Git commit messages

Follow Conventional Commits:

```text
<type>(optional-scope): <short summary>

[optional body]

[optional footer]
```

### Types

| Type | Use |
| ---- | --- |
| `feat` | New user-facing capability |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting (no logic change) |
| `refactor` | Internal restructure |
| `perf` | Performance |
| `test` | Tests |
| `chore` | Tooling/maintenance |
| `build` | Build system / dependencies |
| `ci` | CI configuration |

### Examples

```text
docs: add enterprise foundation governance documents
feat(ui): add language selector to design system
chore: bump project version to 0.1.0
```

Rules:

- Imperative mood (“add”, not “added”)
- ≤ ~72 chars on subject line when practical
- Reference KI/ADR IDs in body when relevant

---

## 8. Branch naming

```text
<type>/<short-kebab-description>
```

| Type | Example |
| ---- | ------- |
| `feat/` | `feat/app-shell` |
| `fix/` | `fix/toast-theme` |
| `docs/` | `docs/security-policy` |
| `chore/` | `chore/deps-patch` |
| `refactor/` | `refactor/module-boundaries` |

Avoid personal names in branch titles. Prefer phase-oriented names when work maps to the roadmap (`feat/phase-3-app-shell`).

---

## 9. i18n standards

- Default namespaces: `common`, `ui`
- Module namespaces later: match module name (`payroll`, `hhco`, …)
- Keys: `dot.case` nesting — `actions.save`, `nav.menu`
- Always add `en` and `si` together

---

## 10. Documentation standards

When a change affects process or architecture:

| Change | Update |
| ------ | ------ |
| Phase delivery | `CHANGELOG.md` + `ROADMAP.md` |
| Architecture choice | `DECISIONS.md` (after approval) |
| Bug/debt found | `KNOWN_ISSUES.md` |
| Version release | `VERSIONING.md` practices + tag |
| Security posture | `SECURITY.md` |

---

## Related documents

- [CONTRIBUTING.md](./CONTRIBUTING.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [DECISIONS.md](./DECISIONS.md)
