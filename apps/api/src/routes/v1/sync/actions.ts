import { OpenAPIHono } from "@hono/zod-openapi";
import type { AutoLoadRoute } from "hono-autoload/types";
import type { Env } from "../../../types/index.js";
import {
  getPortfolioSyncSchema,
  upsertPortfolioSyncSchema,
  type PortfolioSyncPayload,
} from "../../../schema/v1/sync.schema.js";
import { MillaSyncService } from "../../../services/sync.js";
import { logger } from "../../../utils/logger.js";

const handler = new OpenAPIHono<Env>();

handler.openapi(getPortfolioSyncSchema, async (c) => {
  const prisma = c.get("prisma");
  const requestId = c.get("requestId");
  const { syncKey } = c.req.valid("query");
  const service = new MillaSyncService({ prisma });

  try {
    const data = await service.getPortfolioBySyncKey(syncKey);
    if (!data) {
      return c.json(
        {
          error: {
            message: "No cloud backup found for this sync key",
            code: "PORTFOLIO_NOT_FOUND",
          },
        },
        404
      );
    }
    return c.json({ data }, 200);
  } catch (error) {
    logger.error({ error, requestId, scope: "sync.get" }, "Failed to fetch synced portfolio");
    return c.json(
      {
        error: {
          message: "Could not load cloud backup",
          code: "PORTFOLIO_FETCH_FAILED",
        },
      },
      500
    );
  }
});

handler.openapi(upsertPortfolioSyncSchema, async (c) => {
  const prisma = c.get("prisma");
  const requestId = c.get("requestId");
  const body = c.req.valid("json") as PortfolioSyncPayload;
  const service = new MillaSyncService({ prisma });

  try {
    const data = await service.upsertPortfolio(body);
    return c.json({ data }, 200);
  } catch (error) {
    logger.error({ error, requestId, scope: "sync.upsert" }, "Failed to upsert synced portfolio");
    return c.json(
      {
        error: {
          message: "Could not save cloud backup",
          code: "PORTFOLIO_SYNC_FAILED",
        },
      },
      500
    );
  }
});

const routeModule: AutoLoadRoute = {
  path: "/api/v1/sync",
  handler: handler as unknown as AutoLoadRoute["handler"],
};

export default routeModule;
