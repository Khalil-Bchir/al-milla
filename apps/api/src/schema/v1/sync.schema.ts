import { createRoute, z } from "@hono/zod-openapi";

export const syncedVerseSchema = z.object({
  key: z.string(),
  surahId: z.number().int().min(1).max(114),
  ayahNumber: z.number().int().min(1).max(286),
  status: z.enum(["memorized", "in_progress", "weak"]),
  firstMemorizedAt: z.string(),
  lastReviewedAt: z.string(),
  nextReviewAt: z.string(),
  intervalDays: z.number().int().min(1).max(365),
  lastEvaluation: z.enum(["difficult", "good", "easy"]).optional(),
  reviewCount: z.number().int().min(0),
});

export const portfolioSyncPayloadSchema = z.object({
  syncKey: z.string().min(8).max(128),
  language: z.enum(["ar", "en", "fr"]).default("ar"),
  narration: z.enum(["qalun", "warsh", "hafs"]).default("qalun"),
  dailyTarget: z.number().int().min(1).max(20).default(4),
  quranFontSize: z.number().int().min(18).max(36).default(26),
  currentSurahId: z.number().int().min(1).max(114).default(18),
  currentAyah: z.number().int().min(1).max(286).default(1),
  bookmarks: z.array(z.string()).default([]),
  activityDates: z.array(z.string()).default([]),
  verses: z.array(syncedVerseSchema).default([]),
});

export type PortfolioSyncPayload = z.infer<typeof portfolioSyncPayloadSchema>;

const syncResponseSchema = z.object({
  data: portfolioSyncPayloadSchema.extend({
    updatedAt: z.string(),
  }),
});

const syncErrorSchema = z.object({
  error: z.object({
    message: z.string(),
    code: z.string(),
  }),
});

export const getPortfolioSyncSchema = createRoute({
  method: "get",
  path: "/",
  tags: ["Milla Cloud Sync"],
  summary: "Restore a learner's Hafiz portfolio by syncKey",
  description:
    "Fetches an optional cloud backup of the learner's memorization progress, spaced-repetition intervals, and preferences without requiring mandatory registration.",
  request: {
    query: z.object({
      syncKey: z.string().min(8).max(128),
    }),
  },
  responses: {
    200: {
      description: "Portfolio backup found",
      content: {
        "application/json": {
          schema: syncResponseSchema,
        },
      },
    },
    404: {
      description: "Portfolio not found for syncKey",
      content: {
        "application/json": {
          schema: syncErrorSchema,
        },
      },
    },
    500: {
      description: "Server error",
      content: {
        "application/json": {
          schema: syncErrorSchema,
        },
      },
    },
  },
});

export const upsertPortfolioSyncSchema = createRoute({
  method: "post",
  path: "/",
  tags: ["Milla Cloud Sync"],
  summary: "Save or update a learner's Hafiz portfolio backup",
  description:
    "Upserts the learner's local-first memorization state, revision schedule, and preferences to PostgreSQL using their private syncKey.",
  request: {
    body: {
      content: {
        "application/json": {
          schema: portfolioSyncPayloadSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Portfolio synced",
      content: {
        "application/json": {
          schema: syncResponseSchema,
        },
      },
    },
    500: {
      description: "Server error",
      content: {
        "application/json": {
          schema: syncErrorSchema,
        },
      },
    },
  },
});
