---
name: hono-api-patterns
description: >-
  Use this skill when working on apps/api architecture, environment config,
  OpenAPI/Swagger setup, Pino logging, i18next localization, error handling, or
  service-layer patterns in Hono.js.
---

# Hono.js ESM API Architecture (`apps/api`)

## Core App Wiring (`src/app.ts`)

- App instance: `new OpenAPIHono<Env>({ strict: false })`.
- `servicesMiddleware` injects `c.get('supabase')` and `c.get('prisma')` on every request.
- Startup order: `servicesMiddleware` -> `registerGlobalMiddlewares(app)` -> `registerAutoRoutes(app)` -> OpenAPI root -> `setupSwagger(app)` / `mountSwaggerUI(app)` (`/docs`) -> `notFound` & `onError(errorHandler)`.

## Layering & Conventions

- **Routes (`src/routes/<version>/<resource>/actions.ts`)**: Thin handlers using `handler.openapi(schema, async (c) => ...)`.
- **Schemas (`src/schema/<version>/`)**: Request/response contracts via `createRoute` and `z` from `@hono/zod-openapi`.
- **Services (`src/services/`)**: Business logic and Prisma/Supabase calls; avoid putting DB queries directly in route handlers when logic is non-trivial.
- **Config (`src/config/env.ts`)**: Centralize all `process.env` reads; never scatter `process.env` across handlers.
- **Logging (`src/utils/logger.ts`)**: Use `pino` with `c.get('requestId')`; never log secrets, tokens, or PII.
- **i18n (`src/locales/`, `src/middleware/i18next.ts`)**: Use `i18next` with `set-request-language` middleware for localized API messages.
- **ESM Imports**: Always include `.js` extensions on relative TypeScript imports (e.g. `'../../../utils/logger.js'`).

## Verification & Production Readiness

- **Security**: Keep `helmet` (`order: 20`) and `cors` (`order: 30`) active; in production, `ALLOWED_ORIGINS` must be explicitly set or `cors.ts` rejects all cross-origin requests.
- **Resilience & Health**: `under-pressure` (`order: 90`) sheds load above `MAX_REQUESTS_PER_MINUTE` with `503` + `retryAfter` and serves `/health`; `/api/v1/health` verifies live DB + Supabase connectivity.
- **Zero-leak errors**: Route all uncaught errors through `errorHandler` without exposing stack traces or secrets.

```bash
pnpm --filter api typecheck && pnpm --filter api build
```
