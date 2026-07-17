# Phase 8 — Application-Wide QA

**Version under test:** v0.9.0  
**Scope:** Every workflow before production hardening sign-off.

## Pass criteria

- Critical path works online **and** offline (where designed)
- No blockers for Tours or HHCO field sessions
- Auth gates all module routes
- Empty / error / success states are understandable

## Workflow matrix

| Workflow | Online | Offline | Result |
| -------- | ------ | ------- | ------ |
| Authentication (login / session restore) | Required | Cached session | Pass* |
| Saki Tours Start → Continue → End | Pass | Pass (IndexedDB) | Pass |
| Saki Tours Multi-Day daily captures | Pass | Pass | Pass |
| Saki Tours Previous Operations + timeline | Pass | Pass | Pass |
| Camera + OCR + manual odometer verify | Pass | Pass | Pass |
| Session recovery (resume unfinished) | Pass | Pass | Pass |
| HHCO Start → Continue → End + delivery photos | Pass | Pass | Pass |
| HHCO Multi-Day / Previous Deliveries | Pass | Pass | Pass |
| Leave apply / approve | Pass | Pass (local) | Pass |
| Vehicles list/detail | Pass | Pass (local) | Pass |
| Employees list/detail | Pass | Pass (local) | Pass |
| Office Dashboard KPIs | Pass | Pass (local agg) | Pass |
| Reports + Export PDF/Excel | Pass | Pass | Pass |
| PWA install / SW | Partial | N/A | **Deferred** (KI-001) |
| True cloud Sync Queue drain | N/A | N/A | **Deferred** (KI-020) |

\*Password reset delivery still placeholder (KI-009).

## Known residual risks

1. Multi-device: Leave/Vehicles/Employees/Office/Reports are **device-local** until API backing lands.  
2. “Synced” may mean locally marked ready (KI-020).  
3. Orphan drafts if start commit fails mid-flight (KI-018).

## Sign-off

- [ ] Field pilot device smoke test (iOS Safari + Android Chrome)
- [ ] Admin create in production environment
- [ ] Leadership approval for **v1.0.0**
