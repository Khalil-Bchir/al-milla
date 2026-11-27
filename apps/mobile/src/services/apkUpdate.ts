import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { z } from 'zod';

const VERSION_MANIFEST_URL = 'https://al-milla.khalilbchir.pro/version.json';

const VersionManifestSchema = z.object({
  versionCode: z.number().int().positive(),
  versionName: z.string().min(1),
  downloadUrl: z.string().url(),
  releaseNotesAr: z.string().optional(),
});

export type RemoteApkVersion = z.infer<typeof VersionManifestSchema>;

export interface ApkUpdateCheckResult {
  hasUpdate: boolean;
  currentVersionCode: number;
  remote: RemoteApkVersion | null;
}

export function getInstalledAndroidVersionCode(): number {
  const raw = Constants.expoConfig?.android?.versionCode;
  return typeof raw === 'number' && Number.isFinite(raw) ? raw : 1;
}

/**
 * Checks https://al-milla.khalilbchir.pro/version.json for a newer Android APK release.
 * Never throws; returns hasUpdate: false when offline or on non-Android platforms.
 */
export async function checkRemoteApkUpdate(): Promise<ApkUpdateCheckResult> {
  const currentVersionCode = getInstalledAndroidVersionCode();
  if (Platform.OS !== 'android') {
    return { hasUpdate: false, currentVersionCode, remote: null };
  }

  try {
    const response = await fetch(VERSION_MANIFEST_URL, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!response.ok) {
      return { hasUpdate: false, currentVersionCode, remote: null };
    }
    const parsed = VersionManifestSchema.safeParse(await response.json());
    if (!parsed.success) {
      return { hasUpdate: false, currentVersionCode, remote: null };
    }
    return {
      hasUpdate: parsed.data.versionCode > currentVersionCode,
      currentVersionCode,
      remote: parsed.data,
    };
  } catch {
    return { hasUpdate: false, currentVersionCode, remote: null };
  }
}
