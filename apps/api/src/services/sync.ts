import { z } from "@hono/zod-openapi";
import type { PrismaClient } from "@al-milla/database";
import {
  syncedVerseSchema,
  type PortfolioSyncPayload,
} from "../schema/v1/sync.schema.js";
import type { AbstractServiceOptions } from "../types/services.js";

const snapshotJsonSchema = z.object({
  bookmarks: z.array(z.string()).default([]),
  activityDates: z.array(z.string()).default([]),
  verses: z.array(syncedVerseSchema).default([]),
});

function toValidNarration(val: string): "qalun" | "warsh" | "hafs" {
  if (val === "warsh" || val === "hafs") return val;
  return "qalun";
}

export class MillaSyncService {
  private prisma: PrismaClient;

  constructor(options: AbstractServiceOptions) {
    this.prisma = options.prisma;
  }

  async getPortfolioBySyncKey(syncKey: string) {
    const row = await this.prisma.hafizPortfolio.findUnique({
      where: { syncKey: syncKey.trim() },
    });

    if (!row) return null;

    const parsedSnapshot = snapshotJsonSchema.safeParse(row.snapshot);
    const snap = parsedSnapshot.success
      ? parsedSnapshot.data
      : { bookmarks: [], activityDates: [], verses: [] };

    return {
      syncKey: row.syncKey,
      narration: toValidNarration(row.narration),
      dailyTarget: row.dailyTarget,
      currentSurahId: row.currentSurahId,
      currentAyah: row.currentAyah,
      bookmarks: snap.bookmarks,
      activityDates: snap.activityDates,
      verses: snap.verses,
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async upsertPortfolio(input: PortfolioSyncPayload) {
    const cleanKey = input.syncKey.trim();
    const snapshot = {
      bookmarks: input.bookmarks,
      activityDates: input.activityDates.slice(-90),
      verses: input.verses,
    };

    const row = await this.prisma.hafizPortfolio.upsert({
      where: { syncKey: cleanKey },
      create: {
        syncKey: cleanKey,
        narration: input.narration,
        dailyTarget: input.dailyTarget,
        currentSurahId: input.currentSurahId,
        currentAyah: input.currentAyah,
        snapshot,
      },
      update: {
        narration: input.narration,
        dailyTarget: input.dailyTarget,
        currentSurahId: input.currentSurahId,
        currentAyah: input.currentAyah,
        snapshot,
      },
    });

    return {
      syncKey: row.syncKey,
      narration: toValidNarration(row.narration),
      dailyTarget: row.dailyTarget,
      currentSurahId: row.currentSurahId,
      currentAyah: row.currentAyah,
      bookmarks: snapshot.bookmarks,
      activityDates: snapshot.activityDates,
      verses: snapshot.verses,
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
