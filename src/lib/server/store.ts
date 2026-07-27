/**
 * Abstraksi penyimpanan data. Dua implementasi:
 *  - MemoryStore   : mode demo standalone (tanpa Firebase).
 *  - FirebaseStore : produksi (Firestore + Realtime Database via Admin SDK).
 * Dipilih otomatis berdasar flag STANDALONE.
 */
import "server-only";
import { STANDALONE } from "@/lib/runtime";
import { TOTAL_LEAVES } from "@/config/constants";
import { memoryDB } from "./memory-store";
import type {
  DeviceStatus,
  LeafColor,
  LeafEffect,
  LeafState,
  StatsSummary,
  Transaction,
  TransactionStatus,
  TreeCommand,
} from "@/lib/types";

export interface TreeSnapshot {
  leaves: Record<string, LeafState>;
  command: TreeCommand | null;
  devices: Record<string, DeviceStatus>;
}

export interface LightLeafParams {
  leafId: number;
  color: LeafColor;
  txId: string;
  effect?: LeafEffect;
}

export interface Store {
  createTransaction(tx: Transaction): Promise<void>;
  getTransaction(id: string): Promise<Transaction | null>;
  listTransactions(max: number): Promise<Transaction[]>;
  /** Transisi status atomik + idempoten. `lit` true hanya sekali (saat jadi paid). */
  markPaid(
    id: string,
    status: TransactionStatus,
    paymentMethod?: string | null,
  ): Promise<{ tx: Transaction | null; lit: boolean }>;
  assignNextLeafId(): Promise<number>;
  lightLeaf(params: LightLeafParams): Promise<void>;
  applyPaidStats(tx: Transaction): Promise<void>;
  getStats(): Promise<StatsSummary>;
  getTree(): Promise<TreeSnapshot>;
}

// ---------------------------------------------------------------------------
// MemoryStore (standalone)
// ---------------------------------------------------------------------------
class MemoryStore implements Store {
  async createTransaction(tx: Transaction): Promise<void> {
    memoryDB().transactions.set(tx.id, tx);
  }

  async getTransaction(id: string): Promise<Transaction | null> {
    return memoryDB().transactions.get(id) ?? null;
  }

  async listTransactions(max: number): Promise<Transaction[]> {
    return [...memoryDB().transactions.values()]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, max);
  }

  async markPaid(
    id: string,
    status: TransactionStatus,
    paymentMethod?: string | null,
  ): Promise<{ tx: Transaction | null; lit: boolean }> {
    const db = memoryDB();
    const tx = db.transactions.get(id);
    if (!tx) return { tx: null, lit: false };

    if (status === "paid") {
      if (tx.status === "paid") return { tx, lit: false };
      const updated: Transaction = {
        ...tx,
        status: "paid",
        paidAt: Date.now(),
        paymentMethod: paymentMethod ?? "qris",
      };
      db.transactions.set(id, updated);
      return { tx: updated, lit: true };
    }

    if (tx.status === "pending") {
      const updated: Transaction = { ...tx, status };
      db.transactions.set(id, updated);
      return { tx: updated, lit: false };
    }
    return { tx, lit: false };
  }

  async assignNextLeafId(): Promise<number> {
    const db = memoryDB();
    const current = db.counter;
    db.counter = current + 1;
    return (current % TOTAL_LEAVES) + 1;
  }

  async lightLeaf({ leafId, color, txId, effect = "flow" }: LightLeafParams) {
    const db = memoryDB();
    const now = Date.now();
    db.leaves[leafId] = { on: true, color, effect, txId, updatedAt: now };
    db.command = { id: `${leafId}-${now}`, leafId, color, effect, ts: now };
  }

  async applyPaidStats(tx: Transaction): Promise<void> {
    const s = memoryDB().stats;
    s.totalDonation += tx.amount;
    s.totalTransactions += 1;
    s.activeLeaves += 1;
    s.colorCounts[tx.leafColor] = (s.colorCounts[tx.leafColor] || 0) + 1;
    s.updatedAt = Date.now();
  }

  async getStats(): Promise<StatsSummary> {
    const s = memoryDB().stats;
    return { ...s, colorCounts: { ...s.colorCounts } };
  }

  async getTree(): Promise<TreeSnapshot> {
    const db = memoryDB();
    const leaves: Record<string, LeafState> = {};
    for (const [id, st] of Object.entries(db.leaves)) leaves[id] = st;
    return { leaves, command: db.command, devices: { ...db.devices } };
  }
}

// ---------------------------------------------------------------------------
// FirebaseStore (produksi)
// ---------------------------------------------------------------------------
class FirebaseStore implements Store {
  async createTransaction(tx: Transaction): Promise<void> {
    const { adminDb } = await import("@/lib/firebase/admin");
    await adminDb.collection("transactions").doc(tx.id).set(tx);
  }

  async getTransaction(id: string): Promise<Transaction | null> {
    const { adminDb } = await import("@/lib/firebase/admin");
    const snap = await adminDb.collection("transactions").doc(id).get();
    return snap.exists ? (snap.data() as Transaction) : null;
  }

  async listTransactions(max: number): Promise<Transaction[]> {
    const { adminDb } = await import("@/lib/firebase/admin");
    const snap = await adminDb
      .collection("transactions")
      .orderBy("createdAt", "desc")
      .limit(max)
      .get();
    return snap.docs.map((d) => d.data() as Transaction);
  }

  async markPaid(
    id: string,
    status: TransactionStatus,
    paymentMethod?: string | null,
  ): Promise<{ tx: Transaction | null; lit: boolean }> {
    const { adminDb } = await import("@/lib/firebase/admin");
    const ref = adminDb.collection("transactions").doc(id);
    return adminDb.runTransaction(async (t) => {
      const snap = await t.get(ref);
      if (!snap.exists) return { tx: null as Transaction | null, lit: false };
      const tx = snap.data() as Transaction;

      if (status === "paid") {
        if (tx.status === "paid") return { tx, lit: false };
        const updated: Transaction = {
          ...tx,
          status: "paid",
          paidAt: Date.now(),
          paymentMethod: paymentMethod ?? "qris",
        };
        t.set(ref, updated);
        return { tx: updated, lit: true };
      }
      if (tx.status === "pending") {
        const updated: Transaction = { ...tx, status };
        t.set(ref, updated);
        return { tx: updated, lit: false };
      }
      return { tx, lit: false };
    });
  }

  async assignNextLeafId(): Promise<number> {
    const { assignNextLeafId } = await import("./leaf-counter");
    return assignNextLeafId();
  }

  async lightLeaf(params: LightLeafParams): Promise<void> {
    const { sendLeafCommand } = await import("@/lib/device/rtdb");
    await sendLeafCommand({
      leafId: params.leafId,
      color: params.color,
      txId: params.txId,
      effect: params.effect,
    });
  }

  async applyPaidStats(tx: Transaction): Promise<void> {
    const { applyPaidTransaction } = await import("@/lib/stats");
    await applyPaidTransaction(tx);
  }

  async getStats(): Promise<StatsSummary> {
    const { adminDb } = await import("@/lib/firebase/admin");
    const snap = await adminDb.collection("stats").doc("summary").get();
    const base: StatsSummary = {
      totalDonation: 0,
      totalTransactions: 0,
      activeLeaves: 0,
      colorCounts: { green: 0, orange: 0, yellow: 0, blue: 0, purple: 0, red: 0 },
      updatedAt: 0,
    };
    if (!snap.exists) return base;
    const data = snap.data() as Partial<StatsSummary>;
    return {
      ...base,
      ...data,
      colorCounts: { ...base.colorCounts, ...(data.colorCounts ?? {}) },
    };
  }

  async getTree(): Promise<TreeSnapshot> {
    const { adminRtdb } = await import("@/lib/firebase/admin");
    const snap = await adminRtdb.ref("tree").get();
    const val = (snap.val() as Record<string, unknown>) ?? {};
    return {
      leaves: (val.leaves as Record<string, LeafState>) ?? {},
      command: (val.command as TreeCommand) ?? null,
      devices: (val.status as Record<string, DeviceStatus>) ?? {},
    };
  }
}

let cached: Store | null = null;

export function getStore(): Store {
  if (cached) return cached;
  cached = STANDALONE ? new MemoryStore() : new FirebaseStore();
  return cached;
}
