import type { PrismaClient } from "@al-milla/database";
import type { PortfolioSyncPayload } from "../schema/v1/sync.schema.js";
import type { AbstractServiceOptions } from "../types/services.js";

function toValidEvaluation(val: string | null): "difficult" | "good" | "easy" | undefined {
  if (val === "difficult" || val === "good" || val === "easy") {
    return val;
  }
  return undefined;
}

function toValidStatus(val: string): "memorized" | "in_progress" | "weak" {
  if (val === "in_progress" || val === "weak") {
    return val;
  }
  return "memorized";
}

function toValidLanguage(val: string): "ar" | "en" | "fr" {
  if (val === "en" || val === "fr") return val;
  return "ar";
}

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
      include: {
        memorizedVerses: {
          orderBy: [{ surahId: "asc" }, { ayahNumber: "asc" }],
        },
      },
    });

    if (!row) return null;

    return {
      syncKey: row.syncKey,
      language: toValidLanguage(row.language),
      narration: toValidNarration(row.narration),
      dailyTarget: row.dailyTarget,
      quranFontSize: row.quranFontSize,
      currentSurahId: row.currentSurahId,
      currentAyah: row.currentAyah,
      bookmarks: row.bookmarks,
      activityDates: row.activityDates,
      updatedAt: row.updatedAt.toISOString(),
      verses: row.memorizedVerses.map((v) => ({
        key: `${v.surahId}:${v.ayahNumber}`,
        surahId: v.surahId,
        ayahNumber: v.ayahNumber,
        status: toValidStatus(v.status),
        firstMemorizedAt: v.firstMemorizedAt.toISOString(),
        lastReviewedAt: v.lastReviewedAt.toISOString(),
        nextReviewAt: v.nextReviewAt.toISOString(),
        intervalDays: v.intervalDays,
        lastEvaluation: toValidEvaluation(v.lastEvaluation),
        reviewCount: v.reviewCount,
      })),
    };
  }

  async upsertPortfolio(input: PortfolioSyncPayload) {
    const cleanKey = input.syncKey.trim();

    const portfolio = await this.prisma.hafizPortfolio.upsert({
      where: { syncKey: cleanKey },
      create: {
        syncKey: cleanKey,
        language: input.language,
        narration: input.narration,
        dailyTarget: input.dailyTarget,
        quranFontSize: input.quranFontSize,
        currentSurahId: input.currentSurahId,
        currentAyah: input.currentAyah,
        bookmarks: input.bookmarks,
        activityDates: input.activityDates,
      },
      update: {
        language: input.language,
        narration: input.narration,
        dailyTarget: input.dailyTarget,
        quranFontSize: input.quranFontSize,
        currentSurahId: input.currentSurahId,
        currentAyah: input.currentAyah,
        bookmarks: input.bookmarks,
        activityDates: input.activityDates,
      },
    });

    for (const verse of input.verses) {
      await this.prisma.memorizedVerse.upsert({
        where: {
          portfolioId_surahId_ayahNumber: {
            portfolioId: portfolio.id,
            surahId: verse.surahId,
            ayahNumber: verse.ayahNumber,
          },
        },
        create: {
          portfolioId: portfolio.id,
          surahId: verse.surahId,
          ayahNumber: verse.ayahNumber,
          status: verse.status,
          firstMemorizedAt: new Date(verse.firstMemorizedAt),
          lastReviewedAt: new Date(verse.lastReviewedAt),
          nextReviewAt: new Date(verse.nextReviewAt),
          intervalDays: verse.intervalDays,
          lastEvaluation: verse.lastEvaluation ?? null,
          reviewCount: verse.reviewCount,
        },
        update: {
          status: verse.status,
          lastReviewedAt: new Date(verse.lastReviewedAt),
          nextReviewAt: new Date(verse.nextReviewAt),
          intervalDays: verse.intervalDays,
          lastEvaluation: verse.lastEvaluation ?? null,
          reviewCount: verse.reviewCount,
        },
      });
    }

    const updated = await this.getPortfolioBySyncKey(cleanKey);
    if (!updated) {
      throw new Error("Portfolio sync failed after upsert");
    }
    return updated;
  }
}
