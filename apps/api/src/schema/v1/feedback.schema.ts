import { createRoute, z } from "@hono/zod-openapi";

export const feedbackPayloadSchema = z.object({
  type: z.enum(["bug", "feedback"]).default("feedback"),
  area: z.string().trim().max(64).optional(),
  message: z.string().trim().min(3).max(2000),
  contact: z.string().trim().max(160).optional(),
  deviceInfo: z.string().trim().max(200).optional(),
  appVersion: z.string().trim().max(32).optional(),
  syncKey: z.string().trim().max(128).optional(),
});

export type FeedbackPayload = z.infer<typeof feedbackPayloadSchema>;

const feedbackSuccessSchema = z.object({
  data: z.object({
    id: z.string(),
    createdAt: z.string(),
  }),
});

const feedbackErrorSchema = z.object({
  error: z.object({
    message: z.string(),
    code: z.string(),
  }),
});

export const createFeedbackSchema = createRoute({
  method: "post",
  path: "/",
  tags: ["Milla Feedback"],
  summary: "Submit user feedback or a bug report from the mobile app",
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: feedbackPayloadSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Feedback saved",
      content: {
        "application/json": {
          schema: feedbackSuccessSchema,
        },
      },
    },
    400: {
      description: "Invalid feedback payload",
      content: {
        "application/json": {
          schema: feedbackErrorSchema,
        },
      },
    },
    500: {
      description: "Server error",
      content: {
        "application/json": {
          schema: feedbackErrorSchema,
        },
      },
    },
  },
});
