---
name: Vercel Migration Execution Pipeline (Zero-Downtime Strategy)

description: Implements a production-grade migration pipeline for Sequelize with PostgreSQL (Supabase) in serverless environments (Vercel). Handles execution timing, CI/CD integration, and safe schema evolution without downtime.
---

# My Skill

This skill defines how migrations are **executed, automated, and validated** in a production environment.

It extends the SSOT system by introducing a **controlled execution pipeline**, ensuring that schema evolution is safe, observable, and compatible with live systems.

The agent must treat this as a **deployment orchestration problem**, not just database tooling.

---

## When to use this skill

- Use this when:
  - Deploying to production (Vercel)
  - Automating migrations via CI/CD
  - Avoiding downtime during schema changes
  - Scaling beyond local-only workflows

- This is critical for:
  - Production reliability
  - Safe iterative development
  - Team collaboration
  - Preventing breaking changes in live systems

---

## How to use it

### 1. Define Execution Responsibility

Strict separation:

- **CI/CD → executes migrations**
- **Vercel runtime → never executes migrations**

Golden constraint:

> Application runtime must assume schema is already correct

---

### 2. Build Deployment Sequence

Correct order:

1. Run migrations
2. Validate DB state
3. Deploy application

Never:

- Deploy first and migrate after
- Couple migration logic with app startup

---

### 3. Implement CLI Execution Layer

Define scripts:

```json
"scripts": {
  "migrate": "sequelize-cli db:migrate",
  "migrate:undo": "sequelize-cli db:migrate:undo",
  "seed": "sequelize-cli db:seed:all"
}
```
