import { OpenAPIHono } from "@hono/zod-openapi";
import type { AutoLoadRoute } from "hono-autoload/types";
import type { Env } from "../../../types/index.js";
import {
  createFeedbackSchema,
  type FeedbackPayload,
} from "../../../schema/v1/feedback.schema.js";
import { logger } from "../../../utils/logger.js";

const handler = new OpenAPIHono<Env>();

handler.openapi(createFeedbackSchema, async (c) => {
  const prisma = c.get("prisma");
  const requestId = c.get("requestId");
  const body = c.req.valid("json") as FeedbackPayload;

  try {
    const created = await prisma.feedbackReport.create({
      data: {
        type: body.type === "bug" ? "BUG" : "FEEDBACK",
        area: body.area ?? null,
        message: body.message,
        contact: body.contact ?? null,
        deviceInfo: body.deviceInfo ?? null,
        appVersion: body.appVersion ?? null,
        syncKey: body.syncKey ?? null,
      },
      select: {
        id: true,
        createdAt: true,
      },
    });

    return c.json(
      {
        data: {
          id: created.id,
          createdAt: created.createdAt.toISOString(),
        },
      },
      201
    );
  } catch (error) {
    logger.error({ error, requestId, scope: "feedback.create" }, "Failed to save feedback report");
    return c.json(
      {
        error: {
          message: "Could not save feedback report",
          code: "FEEDBACK_SAVE_FAILED",
        },
      },
      500
    );
  }
});

const routeModule: AutoLoadRoute = {
  path: "/api/v1/feedback",
  handler: handler as unknown as AutoLoadRoute["handler"],
};

export default routeModule;
