"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Otentikasi ringan untuk halaman manajemen (terpisah dari login dashboard
 * admin). Gerbang kata sandi sederhana yang cocok untuk perangkat internal
 * kiosk. Sesi disimpan di localStorage.
 *
 * Ganti kata sandi lewat env `NEXT_PUBLIC_MANAJEMEN_PASSWORD`.
 * Catatan: kata sandi ini ada di sisi klien, jadi bukan pengamanan kuat —
 * cukup untuk mencegah akses tak sengaja pada layar kiosk.
 */
const STORAGE_KEY = "baznas-manajemen-auth";
const PASSWORD = process.env.NEXT_PUBLIC_MANAJEMEN_PASSWORD || "baznas2024";

export function useManajemenAuth() {
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      setAuthed(window.localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      setAuthed(false);
    }
    setLoading(false);
  }, []);

  const login = useCallback((password: string): boolean => {
    if (password === PASSWORD) {
      try {
        window.localStorage.setItem(STORAGE_KEY, "1");
      } catch {
        /* abaikan */
      }
      setAuthed(true);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* abaikan */
    }
    setAuthed(false);
  }, []);

  return { authed, loading, login, logout };
}
