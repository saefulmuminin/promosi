/** Orkestrasi transaksi donasi di sisi server (lewat Store abstraction). */
import "server-only";
import { getPaymentProvider } from "@/lib/payments";
import { PROGRAM_MAP } from "@/config/programs";
import { LEAF_COLOR_MAP } from "@/config/leaves";
import { CAMPAIGNS } from "@/config/campaigns";
import { MAX_AMOUNT, MIN_AMOUNT } from "@/config/constants";
import { getStore } from "./store";
import { pushTreeSignal } from "./tree-signal";
import type {
  CreateTransactionRequest,
  CreateTransactionResponse,
  ProgramId,
  Transaction,
  TransactionStatus,
} from "@/lib/types";

function genOrderId(): string {
  const now = Date.now();
  const rand = Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, "0");
  return `BAZNAS-${now}-${rand}`;
}

/** Rapikan input teks opsional: trim, batasi panjang, atau null bila kosong. */
function cleanStr(v: unknown, max = 500): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim().slice(0, max);
  return s.length ? s : null;
}

/** Validasi & normalisasi input dari kiosk. */
function validate(req: CreateTransactionRequest): CreateTransactionRequest {
  if (!PROGRAM_MAP[req.program as ProgramId]) {
    throw new Error("Program donasi tidak valid");
  }
  if (!LEAF_COLOR_MAP[req.leafColor]) {
    throw new Error("Warna daun tidak valid");
  }
  const amount = Math.round(Number(req.amount));
  if (!Number.isFinite(amount) || amount < MIN_AMOUNT || amount > MAX_AMOUNT) {
    throw new Error(
      `Nominal harus antara Rp${MIN_AMOUNT.toLocaleString("id-ID")} dan Rp${MAX_AMOUNT.toLocaleString("id-ID")}`,
    );
  }
  return { ...req, amount };
}

/** Buat transaksi + QRIS, simpan ke store (status pending). */
export async function createDonationTransaction(
  raw: CreateTransactionRequest,
): Promise<CreateTransactionResponse> {
  const req = validate(raw);
  const provider = getPaymentProvider();
  const store = getStore();
  const leafId = await store.assignNextLeafId();
  const orderId = genOrderId();

  const charge = await provider.createQris({
    orderId,
    amount: req.amount,
    description: `Donasi ${PROGRAM_MAP[req.program].name}`,
  });

  const now = Date.now();
  const tx: Transaction = {
    id: orderId, // pakai orderId sebagai doc id -> lookup webhook mudah
    program: req.program,
    cause: req.cause ?? null,
    amount: req.amount,
    leafId,
    leafColor: req.leafColor,
    status: "pending",
    orderId,
    qrString: charge.qrString,
    createdAt: now,
    expiresAt: charge.expiresAt,
    paidAt: null,
    paymentMethod: null,
    donorName: cleanStr(req.donorName),
    donorEmail: cleanStr(req.donorEmail),
    donorPhone: cleanStr(req.donorPhone),
    prayer: cleanStr(req.prayer),
  };

  await store.createTransaction(tx);

  return {
    id: orderId,
    orderId,
    qrString: charge.qrString,
    amount: req.amount,
    leafId,
    leafColor: req.leafColor,
    expiresAt: charge.expiresAt,
    mock: provider.name === "mock",
  };
}

/**
 * Terapkan hasil pembayaran (dari webhook/simulasi).
 * Idempoten: efek samping (nyalakan daun + statistik) hanya sekali per transaksi.
 */
export async function applyPaymentResult(
  orderId: string,
  status: TransactionStatus,
  paymentMethod?: string | null,
): Promise<Transaction | null> {
  const store = getStore();
  const { tx, lit } = await store.markPaid(orderId, status, paymentMethod);

  if (tx && lit) {
    // Nyalakan LED + update statistik (satu kali).
    await Promise.all([
      store.lightLeaf({
        leafId: tx.leafId,
        color: tx.leafColor,
        txId: tx.id,
        effect: "flow",
      }),
      store.applyPaidStats(tx),
    ]);

    // Sinyal untuk mesin LP300 (ESP32) via polling HTTP /api/tree/status.
    // Kategori = campaign id (cause); fallback dari warna daun bila kosong.
    const category =
      tx.cause ?? CAMPAIGNS.find((c) => c.color === tx.leafColor)?.id ?? null;
    if (category) pushTreeSignal(category);
  }

  return tx;
}
