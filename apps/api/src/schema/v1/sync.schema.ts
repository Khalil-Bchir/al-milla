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

export type SyncedVerseItem = z.infer<typeof syncedVerseSchema>;

export const portfolioSyncPayloadSchema = z.object({
  syncKey: z.string().min(8).max(128),
  narration: z.enum(["qalun", "warsh", "hafs"]).default("qalun"),
  dailyTarget: z.number().int().min(1).max(20).default(4),
  currentSurahId: z.number().int().min(1).max(114).default(18),
  currentAyah: z.number().int().min(1).max(286).default(1),
  bookmarks: z.array(z.string()).max(200).default([]),
  activityDates: z.array(z.string()).max(365).default([]),
  verses: z.array(syncedVerseSchema).max(6236).default([]),
  version: z.number().int().min(0).optional(),
  clientUpdatedAt: z.string().optional(),
});

export type PortfolioSyncPayload = z.infer<typeof portfolioSyncPayloadSchema>;

const syncResponseSchema = z.object({
  data: portfolioSyncPayloadSchema.extend({
    version: z.number().int().min(1),
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
  summary: "Restore a learner's compact Hafiz portfolio snapshot by syncKey",
  description:
    "Fetches the single-row cloud snapshot (essential memorization progress and reading position). Device UI preferences and Quran datasets remain local.",
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
  summary: "Save a compact single-row Hafiz portfolio snapshot",
  description:
    "Stores the learner's essential memorization progress in a single PostgreSQL row (`hafiz_portfolios.snapshot`) to minimize database storage and queries on the free tier.",
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
