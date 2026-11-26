import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { z } from 'zod';
import { getApiBaseUrl } from './sync';

export type MobileFeedbackType = 'bug' | 'feedback';

export interface SubmitFeedbackInput {
  type: MobileFeedbackType;
  area?: string;
  message: string;
  contact?: string;
  syncKey?: string;
}

export interface SubmitFeedbackResult {
  ok: boolean;
  error: string | null;
}

const feedbackResponseSchema = z.object({
  data: z.object({
    id: z.string(),
    createdAt: z.string(),
  }),
});

/**
 * Sends a user bug report or feedback entry to the Al-Millah API.
 */
export async function submitFeedbackToApi(
  input: SubmitFeedbackInput,
): Promise<SubmitFeedbackResult> {
  const trimmed = input.message.trim();
  if (trimmed.length < 3) {
    return { ok: false, error: 'يرجى كتابة رسالة لا تقل عن ٣ أحرف.' };
  }

  const deviceInfo = `${Platform.OS} ${String(Platform.Version)}`;
  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  try {
    const response = await fetch(`${getApiBaseUrl()}/api/v1/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: input.type,
        area: input.area?.trim() || undefined,
        message: trimmed,
        contact: input.contact?.trim() || undefined,
        deviceInfo,
        appVersion,
        syncKey: input.syncKey,
      }),
    });

    const rawText = await response.text();
    if (!response.ok) {
      return { ok: false, error: 'تعذر إرسال الرسالة حالياً. حاول مرة أخرى.' };
    }

    const parsed = feedbackResponseSchema.safeParse(JSON.parse(rawText));
    if (!parsed.success) {
      return { ok: false, error: 'استجابة غير متوقعة من الخادم.' };
    }

    return { ok: true, error: null };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'تعذر الاتصال بالخادم';
    return { ok: false, error: `تعذر إرسال الرسالة: ${msg}` };
  }
}
