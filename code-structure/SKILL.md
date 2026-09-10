---
name: code-structure
description: Design shared operational code while preserving product data ownership and TanStack Start boundaries.
---

# Code structure

Keep domain policy near its product flow and extract only repeated mechanics.
Services may access a database only inside that product's `packages/<product>/data-ops`
boundary. Product user-web queries execute through in-process TanStack Start server
functions; cross-worker RPC is only for the product data-service. Use explicit inputs,
structured returns, and one migration-backed implementation per lookup.
