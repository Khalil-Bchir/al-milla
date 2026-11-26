import {
  createAudioPlayer,
  setAudioModeAsync,
  type AudioPlayer,
  type AudioStatus,
} from 'expo-audio';
import { getEveryAyahAudioUrl, type ReciterId } from '@al-milla/core';
import type { PlaybackSpeed } from '../db/database';

export interface AyahAudioController {
  playAyah: (params: {
    reciter: ReciterId;
    surahId: number;
    ayahNumber: number;
    speed: PlaybackSpeed;
    repeats: number;
    onRepeatAdvance?: (currentRepeat: number, totalRepeats: number) => void;
    onPlaybackProgress?: (
      progress: number,
      remainingMs: number,
      isPlaying: boolean,
    ) => void;
    onFinish: () => void;
    onError: (message: string) => void;
  }) => Promise<void>;
  stop: () => Promise<void>;
}

interface EventSubscription {
  remove: () => void;
}

export function createAyahAudioController(): AyahAudioController {
  let activePlayer: AudioPlayer | null = null;
  let activeSubscription: EventSubscription | null = null;
  let cancelled = false;

  function disposeActive(): void {
    if (activeSubscription) {
      try {
        activeSubscription.remove();
      } catch {
        // Ignore listener removal errors
      }
      activeSubscription = null;
    }
    if (activePlayer) {
      try {
        activePlayer.pause();
      } catch {
        // Ignore pause errors
      }
      try {
        activePlayer.remove();
      } catch {
        // Ignore player disposal errors
      }
      activePlayer = null;
    }
  }

  return {
    async playAyah({
      reciter,
      surahId,
      ayahNumber,
      speed,
      repeats,
      onRepeatAdvance,
      onPlaybackProgress,
      onFinish,
      onError,
    }) {
      cancelled = false;
      disposeActive();

      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          shouldPlayInBackground: false,
        });

        const url = getEveryAyahAudioUrl(reciter, surahId, ayahNumber);
        const total = Math.max(1, repeats);
        let completed = 0;

        const player = createAudioPlayer({ uri: url });
        player.shouldCorrectPitch = true;
        player.setPlaybackRate(speed, 'high');
        activePlayer = player;

        activeSubscription = player.addListener(
          'playbackStatusUpdate',
          (status: AudioStatus) => {
            if (cancelled) return;
            if (status.duration > 0) {
              const ratio = Math.min(1, Math.max(0, status.currentTime / status.duration));
              const remainingSec = Math.max(0, status.duration - status.currentTime);
              const remainingMs = Math.round((remainingSec * 1000) / Math.max(0.5, speed));
              onPlaybackProgress?.(ratio, remainingMs, status.playing);
            }
            if (!status.didJustFinish) return;
            completed += 1;
            if (completed < total) {
              const nextRepeat = completed + 1;
              void player
                .seekTo(0)
                .then(() => {
                  if (!cancelled) {
                    onPlaybackProgress?.(0, 0, true);
                    onRepeatAdvance?.(nextRepeat, total);
                    player.play();
                  }
                })
                .catch((err: Error) => {
                  disposeActive();
                  onError(err.message || 'تعذّر إعادة تشغيل التلاوة');
                });
            } else {
              onPlaybackProgress?.(0, 0, false);
              disposeActive();
              onFinish();
            }
          },
        );

        onRepeatAdvance?.(1, total);
        player.play();
      } catch (err) {
        disposeActive();
        const message = err instanceof Error ? err.message : 'تعذّر تشغيل التلاوة';
        onError(message);
      }
    },

    async stop() {
      cancelled = true;
      disposeActive();
    },
  };
}
