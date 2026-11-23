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
    async playAyah({ reciter, surahId, ayahNumber, speed, repeats, onFinish, onError }) {
      cancelled = false;
      disposeActive();

      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          shouldPlayInBackground: false,
        });

        const url = getEveryAyahAudioUrl(reciter, surahId, ayahNumber);
        let remaining = Math.max(1, repeats);

        const player = createAudioPlayer({ uri: url });
        player.shouldCorrectPitch = true;
        player.setPlaybackRate(speed, 'high');
        activePlayer = player;

        activeSubscription = player.addListener(
          'playbackStatusUpdate',
          (status: AudioStatus) => {
            if (cancelled || !status.didJustFinish) return;
            remaining -= 1;
            if (remaining > 0) {
              void player
                .seekTo(0)
                .then(() => {
                  if (!cancelled) {
                    player.play();
                  }
                })
                .catch((err: Error) => {
                  disposeActive();
                  onError(err.message || 'تعذّر إعادة تشغيل التلاوة');
                });
            } else {
              disposeActive();
              onFinish();
            }
          },
        );

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
