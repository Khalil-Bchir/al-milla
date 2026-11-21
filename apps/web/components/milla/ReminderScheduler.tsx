'use client';

import { useEffect, useRef } from 'react';
import { useMillaStore } from '@/store/milla-store';

export async function sendMillaNotification(title: string, body: string): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  if (Notification.permission !== 'granted') {
    return false;
  }

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        await reg.showNotification(title, {
          body,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-192x192.png',
          tag: 'al-milla-reminder',
        });
        return true;
      }
    }
    new Notification(title, {
      body,
      icon: '/icons/icon-192x192.png',
      tag: 'al-milla-reminder',
    });
    return true;
  } catch {
    return false;
  }
}

function currentHhMm(): string {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

function todayStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

export function ReminderScheduler() {
  const language = useMillaStore((s) => s.language);
  const reminders = useMillaStore((s) => s.reminders);
  const firedTodayRef = useRef<{ morning?: string; evening?: string }>({});

  useEffect(() => {
    if (!reminders.fajrEnabled && !reminders.eveningEnabled) return;

    const checkAndNotify = () => {
      const hhmm = currentHhMm();
      const today = todayStamp();

      const morningMsg =
        language === 'en'
          ? { title: 'Al-Millah', body: 'A calm moment for your Quran memorization.' }
          : language === 'fr'
            ? { title: 'Al-Millah', body: 'Un moment serein pour votre mémorisation du Coran.' }
            : { title: 'المِلّة', body: 'وقت هادئ لحفظك ومراجعتك اليومية.' };

      const eveningMsg =
        language === 'en'
          ? { title: 'Al-Millah', body: 'A quiet evening check-in for your revision.' }
          : language === 'fr'
            ? { title: 'Al-Millah', body: 'Un moment paisible ce soir pour votre révision.' }
            : { title: 'المِلّة', body: 'تذكير هادئ لمراجعتك المسائية.' };

      if (
        reminders.fajrEnabled &&
        reminders.fajrTime === hhmm &&
        firedTodayRef.current.morning !== today
      ) {
        firedTodayRef.current.morning = today;
        void sendMillaNotification(morningMsg.title, morningMsg.body);
      }

      if (
        reminders.eveningEnabled &&
        reminders.eveningTime === hhmm &&
        firedTodayRef.current.evening !== today
      ) {
        firedTodayRef.current.evening = today;
        void sendMillaNotification(eveningMsg.title, eveningMsg.body);
      }
    };

    checkAndNotify();
    const timer = window.setInterval(checkAndNotify, 30_000);
    return () => window.clearInterval(timer);
  }, [language, reminders]);

  return null;
}
