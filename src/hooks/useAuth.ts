"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { STANDALONE } from "@/lib/runtime";

// User palsu untuk mode demo standalone (login di-bypass).
const DEMO_USER = {
  uid: "demo-admin",
  email: "demo@baznas.go.id",
  displayName: "Admin Demo",
} as unknown as User;

/** Pantau status login admin. */
export function useAuthUser(): { user: User | null; loading: boolean } {
  const [user, setUser] = useState<User | null>(STANDALONE ? DEMO_USER : null);
  const [loading, setLoading] = useState(!STANDALONE);

  useEffect(() => {
    if (STANDALONE) return; // demo: langsung dianggap login
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return { user, loading };
}
