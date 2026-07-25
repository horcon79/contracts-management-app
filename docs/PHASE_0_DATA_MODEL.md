# Phase 0 — data model foundation

This change introduces the tenant-safe domain model without breaking the existing `Contract` API.

## New aggregate

- `Tenant` owns all business data.
- `ContractCase` represents the commercial/legal relationship.
- `ContractDocument` represents a logical document attached to the case.
- `DocumentVersion` stores immutable versions and parsing output.
- `ExtractedFact` stores versioned structured facts with page-level evidence and review status.
- `Clause` and `Obligation` turn extracted content into risk and execution objects.
- `Counterparty`, `LegalEntity` and `Department` normalize organization data.
- `AuditEvent` provides an append-only event model.

## Compatibility

The legacy `Contract` collection remains available to the current UI. The migration adds:

- `tenantId`
- `contractCaseId`
- `primaryDocumentId`
- `phase0MigratedAt`

New development should use `ContractCase` and related models. Legacy writes should be dual-written in a following PR before the old model is retired.

## Migration

Run a dry run first:

```bash
npm run migrate:phase0 -- --dry-run
```

Then run the migration:

```bash
DEFAULT_TENANT_NAME="My organization" \
DEFAULT_TENANT_SLUG="my-organization" \
npm run migrate:phase0
```

The migration is idempotent. It creates one case, document and version per legacy contract and records their identifiers on the old record.

MongoDB transactions require a replica set. Production and migration environments must run MongoDB as a replica set.

## Rollout order

1. Deploy models and migration script.
2. Backup the database and verify restore.
3. Run `--dry-run`.
4. Run the migration in a maintenance window.
5. Compare counts and validate a sample of migrated cases.
6. Add tenant-aware query enforcement and dual writes before enabling additional tenants.

Do not enable multi-tenant customer onboarding until every read/write route is scoped by the authenticated `tenantId`.
