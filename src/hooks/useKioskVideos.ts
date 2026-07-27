"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_KIOSK_SETTINGS,
  subscribeKioskSettings,
  type KioskVideoSettings,
} from "@/lib/kiosk-settings";

/**
 * Langganan realtime pengaturan video kiosk (video awal & terima kasih).
 * Bila Firestore gagal/diblokir, tetap memakai nilai bawaan dari kode.
 */
export function useKioskVideos(): {
  settings: KioskVideoSettings;
  loading: boolean;
} {
  const [settings, setSettings] = useState<KioskVideoSettings>(
    DEFAULT_KIOSK_SETTINGS,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeKioskSettings(
      (s) => {
        setSettings(s);
        setLoading(false);
      },
      () => setLoading(false), // error → tetap pakai default
    );
    return () => unsub();
  }, []);

  return { settings, loading };
}
