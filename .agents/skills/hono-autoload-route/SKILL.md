---
name: hono-autoload-route
description: >-
  Use this skill when adding or modifying API routes, OpenAPI schemas, or global
  middlewares in apps/api using hono-autoload and @hono/zod-openapi.
---

# Hono Autoload Route & Middleware Workflow

Follow this procedure when adding or updating endpoints or middleware in `apps/api`.

## Adding a New Route Module

1. **Create the OpenAPI schema** in `apps/api/src/schema/v1/<resource>.schema.ts` (or `v2/`) using `createRoute` and `z` from `@hono/zod-openapi`.
2. **Add business logic** in `apps/api/src/services/` so route handlers remain thin.
3. **Create the route module** at `apps/api/src/routes/v1/<resource>/actions.ts`:
   - Instantiate `const handler = new OpenAPIHono<Env>()`.
   - Register routes via `handler.openapi(schema, async (c) => { ... })`.
   - Access `prisma`, `supabase`, and `requestId` from `c.get(...)`.
   - Export default an `AutoLoadRoute` object:
     ```ts
     import type { AutoLoadRoute } from 'hono-autoload/types'

     const routeModule: AutoLoadRoute = {
       path: '/api/v1/<resource>',
       handler: handler as unknown as AutoLoadRoute['handler'],
     }

     export default routeModule
     ```
4. **Update the route manifest** by running from `apps/api`:
   ```bash
   node scripts/generate-route-manifest.mjs
   ```
5. **Verify**:
   ```bash
   pnpm --filter api typecheck && pnpm --filter api build
   ```

## Adding a Global Middleware

1. Create the middleware file in `apps/api/src/middleware/<name>.ts` exporting a default `MiddlewareDefinition` (`{ handler, matcher?, order?, name? }`). Omitting `matcher` or setting `'*'` applies it to all routes.
2. Register it in `apps/api/src/middleware/registry.ts` in the exact execution order required (`registerGlobalMiddlewares(app)` runs before `registerAutoRoutes(app)` in `src/app.ts`).
3. Verify with `pnpm --filter api typecheck`.
