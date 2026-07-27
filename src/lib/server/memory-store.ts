/**
 * Penyimpanan in-memory untuk mode demo standalone (tanpa Firebase).
 * Data hidup selama proses server berjalan (reset saat restart) — cukup untuk
 * demo/kiosk uji coba. Disimpan di globalThis agar bertahan lintas HMR (dev).
 */
import type {
  DeviceStatus,
  LeafState,
  StatsSummary,
  Transaction,
  TreeCommand,
} from "@/lib/types";

export interface MemoryDB {
  transactions: Map<string, Transaction>;
  leaves: Record<number, LeafState>;
  command: TreeCommand | null;
  devices: Record<string, DeviceStatus>;
  stats: StatsSummary;
  counter: number;
}

function emptyStats(): StatsSummary {
  return {
    totalDonation: 0,
    totalTransactions: 0,
    activeLeaves: 0,
    colorCounts: { green: 0, orange: 0, yellow: 0, blue: 0, purple: 0, red: 0 },
    updatedAt: 0,
  };
}

const g = globalThis as unknown as { __POHON_DB?: MemoryDB };

export function memoryDB(): MemoryDB {
  if (!g.__POHON_DB) {
    g.__POHON_DB = {
      transactions: new Map(),
      leaves: {},
      command: null,
      devices: {},
      stats: emptyStats(),
      counter: 0,
    };
  }
  return g.__POHON_DB;
}
