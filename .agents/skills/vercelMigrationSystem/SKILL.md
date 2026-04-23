---
name: Vercel Sequelize Migration System (SSOT DB Evolution)

description: Defines a robust migration pipeline for PostgreSQL using Sequelize in a serverless environment (Vercel + Supabase). Ensures database consistency, version control, and safe evolution without runtime side effects.
---

# My Skill

This skill defines a **Single Source of Truth (SSOT)** for database structure and evolution using migrations instead of runtime synchronization.

The agent must treat this as a **distributed systems + state management problem**, not just ORM usage.

---

## When to use this skill

- Use this when:
  - Transitioning from `sequelize.sync()` to migrations
  - Deploying to serverless environments (Vercel)
  - Using PostgreSQL with external providers (Supabase)
  - Rebuilding or cleaning a database structure

- This is critical for:
  - Preventing schema drift
  - Maintaining production stability
  - Enabling reproducible environments
  - Supporting team scalability

---

## How to use it

### 1. Define Database Authority Layer (SSOT)

Establish strict ownership:

- **Migrations → Source of Truth**
- **Models → Representation layer**
- **Database → Derived state**

Apply rule:

> Database state must be reproducible from migrations only

---

### 2. Build Migration Architecture

Structure the system:

- **L0 → `/migrations` (truth layer)**
- **L1 → `/models` (ORM abstraction)**
- **L2 → runtime (Express / Vercel functions)**

Critical constraint:

> Runtime must never mutate schema

---

### 3. Enforce Execution Boundary

Separate environments:

- **Local / CI → executes migrations**
- **Vercel runtime → read/write data only**

Never allow:

- `sequelize.sync()`
- `sync({ alter: true })`
- schema changes inside request lifecycle

---

### 4. Use Deterministic Migrations

Each migration must be:

- Idempotent (safe by design)
- Ordered (timestamp-based)
- Reversible (`up` / `down`)

Structure operations explicitly:

- Create tables
- Add columns
- Add indexes
- Modify constraints

Avoid:

- implicit ORM-driven schema changes

---

### 5. Establish Migration Workflow

Standard flow:

1. Generate migration
2. Define schema change explicitly
3. Run locally
4. Validate against DB
5. Commit
6. Execute in production manually or via pipeline

---

### 6. Apply Environment Isolation

Use environment-driven config:

- `development`
- `production`

Both must:

- use the same migration system
- differ only in connection settings

Ensure compatibility with:

- SSL (required in Supabase)
- connection pooling limits (serverless constraint)

---

### 7. Treat Seeds as Controlled State

Seeds are:

- Optional
- Environment-aware

Use cases:

- initial admin user
- test data (dev only)

Avoid:

- business-critical data in seeds
- automatic execution in production unless intentional

---

### 8. Prevent Schema Drift

Strict rule:

> If a change is not in a migration, it does not exist

Never:

- modify DB manually in production
- rely on GUI tools as source of truth

Allowed:

- inspection only (e.g., DBeaver)

---

### 9. Integrate with Deployment Strategy

Define clear sequencing:

1. Apply migrations
2. Then deploy application

Never invert:

- App must not depend on future schema

For serverless:

- migrations must run outside Vercel execution context

---

### 10. Enable Observability

Track:

- executed migrations (`SequelizeMeta`)
- migration failures
- DB connectivity

Expose:

- health endpoint (read-only check)

---

### 11. Positioning Strategy

Avoid patterns like:

- “auto-sync ORM”
- “quick DB reset”

Focus on:

- deterministic schema evolution
- version-controlled infrastructure
- reproducible environments

---

### 12. Treat Migrations as Infrastructure Code

Each migration is:

- a commit to system state
- auditable
- reproducible

Equivalent to:

- version control for database state

---

### 13. Failure Strategy

Handle errors explicitly:

- partial migrations → rollback (`down`)
- failed deploy → do not re-run blindly

Always:

- inspect state before retry

---

### 14. Iteration Model

Follow loop:

1. Design schema change
2. Encode as migration
3. Apply locally
4. Validate
5. Deploy safely

---

### 15. Golden Rule

> Models describe, migrations define

If both diverge:

- migrations win
- models must be updated
