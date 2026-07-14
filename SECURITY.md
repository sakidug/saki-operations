# Security

Security policy and baseline controls for **Saki Operations**.

> Report suspected vulnerabilities privately to the project owners. Do not file public issues for active exploits.

---

## 1. Principles

1. Least privilege by default
2. Secrets never committed to git
3. Defense in depth (edge, app, data)
4. Prefer proven libraries over custom crypto
5. Security documentation stays current with architecture changes

---

## 2. Authentication (Phase 4+)

**Planned approach:** JWT-based authentication.

| Topic | Policy |
| ----- | ------ |
| Access tokens | Short-lived |
| Refresh tokens | Longer-lived; rotatable; stored securely |
| Transport | HTTPS only in staging/production |
| Session revocation | Supported via refresh rotation / denylist strategy (to be finalized in Phase 4) |
| Password storage | Strong one-way hashing (e.g. Argon2id or bcrypt) — never plaintext |

Foundation note: JWT configuration keys exist in `.env.example`; auth flows are **not** implemented yet.

---

## 3. Authorization

| Topic | Policy |
| ----- | ------ |
| Model | Role- and/or permission-based access control |
| Enforcement | Server-side guards on every protected route |
| UI hiding | Never sufficient on its own |
| Admin actions | Extra auditing for privileged operations |

Brand contexts (`tours`, `hhco`, `office`, `admin`) are presentation concerns and must not replace authorization checks.

---

## 4. Password rules (when auth ships)

Minimum baseline (finalize exact policy in Phase 4):

- Minimum length: **12** characters
- Reject known breached passwords where feasible
- Disallow reuse of the current password on change
- Rate-limit login and password-reset endpoints
- Prefer passkeys/MFA for privileged roles when product-ready

---

## 5. Environment variables & secrets

| Rule | Detail |
| ---- | ------ |
| Never commit `.env` | Only `.env.example` is tracked |
| Rotate secrets | After leak suspicion or staff changes |
| Distinct per environment | Local ≠ staging ≠ production |
| JWT secrets | Long, random, unique per environment |
| R2 keys | Scoped to least-privilege buckets/actions |

Sensitive categories:

- `DATABASE_URL`
- `JWT_SECRET`
- `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY`
- Any third-party API tokens

---

## 6. Cloud storage (Cloudflare R2)

| Rule | Detail |
| ---- | ------ |
| Private by default | Objects not publicly listable unless explicitly required |
| Signed access | Prefer short-lived signed URLs for private assets |
| Validation | Validate content type/size before upload |
| PII | Encrypt sensitive objects at rest when policy requires |
| Lifecycle | Define retention for temp/uploads aligned with business needs |

Local folders under `storage/` are for development/sync caches — not a substitute for production R2 controls.

---

## 7. Backups

| Asset | Expectation |
| ----- | ----------- |
| PostgreSQL | Regular automated backups; tested restores |
| `database/backups/` | Operational export location (not the only backup) |
| R2 | Bucket versioning/replication as environment requires |
| Secrets | Stored in a secret manager — not in backup tarballs |

Backup files may contain sensitive data — restrict access and encrypt at rest.

---

## 8. Application security baseline

- Input validation on API boundaries (`class-validator` / DTO whitelisting)
- CORS allowlists (no `*` with credentials in production)
- Security headers at the edge/nginx where applicable
- Dependency updates with attention to advisories
- No secrets in client bundles (`VITE_*` only for public config)

---

## 9. Logging & privacy

- Do not log passwords, tokens, or full payment payloads
- Redact PII in logs where possible
- Retain audit logs for privileged actions (admin/payroll)

---

## 10. Incident response (lightweight)

1. Contain (rotate secrets, disable compromised keys)
2. Assess impact (data, users, uptime)
3. Remediate and deploy fix
4. Document in CHANGELOG `Security` section when appropriate
5. Add follow-ups to [KNOWN_ISSUES.md](./KNOWN_ISSUES.md) if debt remains

---

## Related documents

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [CONTRIBUTING.md](./CONTRIBUTING.md)
- [VERSIONING.md](./VERSIONING.md)
