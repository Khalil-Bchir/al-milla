# API Guidelines (`apps/api`)

Hono.js REST API on Node (`"type": "module"`, TypeScript ESM, `tsx watch src/server.ts`).

## Architecture & Routing (`hono-autoload`)

- **Routes**: Place route modules under `src/routes/<version>/<resource>/actions.ts`.
  - Each module must `export default` an `AutoLoadRoute` object (`{ path, handler }` from `hono-autoload/types`, with `handler` as an `OpenAPIHono<Env>`).
  - Run `node scripts/generate-route-manifest.mjs` after adding a new `actions.ts` route module.
- **Middleware**:
  - Global middlewares are registered in explicit execution order in `src/middleware/registry.ts` (before `registerAutoRoutes(app)` in `src/app.ts`).
  - Middleware modules export a `MiddlewareDefinition` / `AutoLoadMiddleware` (`{ handler, matcher?, order?, name? }`); omitting `matcher` (or using `'*'`) applies it to all routes.
- **OpenAPI & Validation**:
  - Define route contracts with `createRoute` and `z` from `@hono/zod-openapi` under `src/schema/<version>/`.
  - Keep handlers thin: validate input via OpenAPI/Zod -> call a service in `src/services/` -> return typed `c.json(...)` responses.

## Runtime & Code Quality

- Use Node-compatible APIs and `.js` extensions on relative ESM imports (e.g. `'./types/index.js'`).
- Avoid side effects at module import time.
- Centralize `process.env` reads in `src/config/env.ts`; do not scatter `process.env` across routes or services.
- Use `pino` (`src/utils/logger.ts`) for structured logging; never log secrets or tokens.
- Use `c.get('prisma')` and `c.get('supabase')` injected by `servicesMiddleware` in `src/app.ts`.
- Wrap Prisma, Supabase, and external I/O calls in `try/catch`, log with `{ error, requestId }`, and return/rethrow clean typed errors via `errorHandler` without leaking internal stack traces or secrets. Never leave empty `catch {}` blocks.
- Keep functions small with early returns / guard clauses and 100% strict TypeScript: **never** use `any` or `unknown` in signatures, schemas, or return types (use `z.infer<typeof ...>` and `@al-milla/types`).
