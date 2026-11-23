import { z } from "@hono/zod-openapi";
import {
  mergePortfolioStates,
  type MemorizedVerseRecord,
  type NarrationId,
  type PortfolioSyncState,
  type RevisionIntervalDays,
} from "@al-milla/core";
import { Prisma, type PrismaClient } from "@al-milla/database";
import {
  syncedVerseSchema,
  type PortfolioSyncPayload,
  type SyncedVerseItem,
} from "../schema/v1/sync.schema.js";
import type { AbstractServiceOptions } from "../types/services.js";

const snapshotJsonSchema = z.object({
  bookmarks: z.array(z.string()).default([]),
  activityDates: z.array(z.string()).default([]),
  verses: z.array(syncedVerseSchema).default([]),
  version: z.number().int().min(1).default(1),
});

function toValidNarration(val: string): NarrationId {
  if (val === "warsh" || val === "hafs") return val;
  return "qalun";
}

function toRevisionIntervalDays(days: number): RevisionIntervalDays {
  if (days === 3 || days === 7 || days === 14 || days === 30) return days;
  return 1;
}

function toCoreVerseRecords(verses: SyncedVerseItem[]): MemorizedVerseRecord[] {
  return verses.map((v) => ({
    key: v.key,
    surahId: v.surahId,
    ayahNumber: v.ayahNumber,
    status: v.status,
    firstMemorizedAt: v.firstMemorizedAt,
    lastReviewedAt: v.lastReviewedAt,
    nextReviewAt: v.nextReviewAt,
    intervalDays: toRevisionIntervalDays(v.intervalDays),
    lastEvaluation: v.lastEvaluation,
    reviewCount: v.reviewCount,
  }));
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
      : { bookmarks: [], activityDates: [], verses: [], version: 1 };

    return {
      syncKey: row.syncKey,
      narration: toValidNarration(row.narration),
      dailyTarget: row.dailyTarget,
      currentSurahId: row.currentSurahId,
      currentAyah: row.currentAyah,
      bookmarks: snap.bookmarks,
      activityDates: snap.activityDates,
      verses: snap.verses,
      version: snap.version,
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async upsertPortfolio(input: PortfolioSyncPayload) {
    const cleanKey = input.syncKey.trim();

    return this.prisma.$transaction(async (tx) => {
      const existingRow = await tx.hafizPortfolio.findUnique({
        where: { syncKey: cleanKey },
      });

      let serverState: PortfolioSyncState | null = null;
      if (existingRow) {
        const parsedSnap = snapshotJsonSchema.safeParse(existingRow.snapshot);
        const snap = parsedSnap.success
          ? parsedSnap.data
          : { bookmarks: [], activityDates: [], verses: [], version: 1 };

        serverState = {
          syncKey: existingRow.syncKey,
          narration: toValidNarration(existingRow.narration),
          dailyTarget: existingRow.dailyTarget,
          currentSurahId: existingRow.currentSurahId,
          currentAyah: existingRow.currentAyah,
          bookmarks: snap.bookmarks,
          activityDates: snap.activityDates,
          verses: toCoreVerseRecords(snap.verses),
          version: snap.version,
          updatedAt: existingRow.updatedAt.toISOString(),
        };
      }

      const clientState: PortfolioSyncState = {
        syncKey: cleanKey,
        narration: input.narration,
        dailyTarget: input.dailyTarget,
        currentSurahId: input.currentSurahId,
        currentAyah: input.currentAyah,
        bookmarks: input.bookmarks,
        activityDates: input.activityDates,
        verses: toCoreVerseRecords(input.verses),
        version: input.version ?? 0,
        updatedAt: input.clientUpdatedAt ?? new Date().toISOString(),
      };

      const merged = mergePortfolioStates(serverState, clientState);
      const versesJson: Prisma.InputJsonValue[] = merged.verses.map((v) => ({
        key: v.key,
        surahId: v.surahId,
        ayahNumber: v.ayahNumber,
        status: v.status,
        firstMemorizedAt: v.firstMemorizedAt,
        lastReviewedAt: v.lastReviewedAt,
        nextReviewAt: v.nextReviewAt,
        intervalDays: v.intervalDays,
        ...(v.lastEvaluation ? { lastEvaluation: v.lastEvaluation } : {}),
        reviewCount: v.reviewCount,
      }));
      const activityDates = merged.activityDates.slice(-90);
      const snapshot: Prisma.InputJsonObject = {
        bookmarks: merged.bookmarks,
        activityDates,
        verses: versesJson,
        version: merged.version,
      };

      const row = await tx.hafizPortfolio.upsert({
        where: { syncKey: cleanKey },
        create: {
          syncKey: cleanKey,
          narration: merged.narration,
          dailyTarget: merged.dailyTarget,
          currentSurahId: merged.currentSurahId,
          currentAyah: merged.currentAyah,
          snapshot,
        },
        update: {
          narration: merged.narration,
          dailyTarget: merged.dailyTarget,
          currentSurahId: merged.currentSurahId,
          currentAyah: merged.currentAyah,
          snapshot,
        },
      });

      return {
        syncKey: row.syncKey,
        narration: toValidNarration(row.narration),
        dailyTarget: row.dailyTarget,
        currentSurahId: row.currentSurahId,
        currentAyah: row.currentAyah,
        bookmarks: merged.bookmarks,
        activityDates,
        verses: merged.verses,
        version: merged.version,
        updatedAt: row.updatedAt.toISOString(),
      };
    });
  }
}
