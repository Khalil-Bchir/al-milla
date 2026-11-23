import { Audio } from 'expo-av';
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

export function createAyahAudioController(): AyahAudioController {
  let activeSound: Audio.Sound | null = null;
  let cancelled = false;

  async function unloadActive(): Promise<void> {
    if (!activeSound) return;
    try {
      await activeSound.stopAsync();
    } catch {
      // Ignore stop error if already stopped
    }
    try {
      await activeSound.unloadAsync();
    } catch {
      // Ignore unload error
    }
    activeSound = null;
  }

  return {
    async playAyah({ reciter, surahId, ayahNumber, speed, repeats, onFinish, onError }) {
      cancelled = false;
      await unloadActive();

      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
        });

        const url = getEveryAyahAudioUrl(reciter, surahId, ayahNumber);
        let remaining = Math.max(1, repeats);

        const playOnce = async (): Promise<void> => {
          if (cancelled) return;
          await unloadActive();
          const { sound } = await Audio.Sound.createAsync(
            { uri: url },
            { shouldPlay: true, rate: speed, shouldCorrectPitch: true },
          );
          activeSound = sound;

          sound.setOnPlaybackStatusUpdate((status) => {
            if (!status.isLoaded) return;
            if (status.didJustFinish) {
              remaining -= 1;
              if (remaining > 0 && !cancelled) {
                void playOnce();
              } else {
                void unloadActive();
                onFinish();
              }
            }
          });
        };

        await playOnce();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'تعذّر تشغيل التلاوة';
        onError(message);
      }
    },

    async stop() {
      cancelled = true;
      await unloadActive();
    },
  };
}
