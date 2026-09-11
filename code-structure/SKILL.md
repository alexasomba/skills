---
name: code-structure
description: Design shared operational code while preserving product data ownership and TanStack Start boundaries.
---

# Code structure

Use two layers: orchestration owns business meaning; shared capabilities own
repeated operational mechanics.

| Orchestration owns       | Shared capability owns          |
| ------------------------ | ------------------------------- |
| policy and authorization | provider and SDK interaction    |
| state transitions        | command execution and readiness |
| failure classification   | reusable mechanical retries     |
| user-facing outcomes     | structured operational results  |

Extract only mechanics repeated by at least two callers. Capability functions
accept explicit inputs, return structured results, expose failures, and do not
reach into hidden global or domain state. Avoid god services, leaky services,
inconsistent result shapes, and abstractions with only one caller.

For migrations, document the current behavior, extract one block, replace one
caller, verify it, then migrate the remaining callers. Keep a single production
implementation per lookup.

Database access stays inside the owning product's `packages/<product>/data-ops`
boundary. Product user-web queries execute through in-process TanStack Start
server functions; cross-worker RPC is reserved for the product data-service.
