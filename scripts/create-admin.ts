/**
 * Buat akun admin untuk dashboard.
 *
 * Emulator (default):
 *   npm run create-admin -- admin@baznas.go.id rahasia123
 *
 * Produksi (butuh service account):
 *   NEXT_PUBLIC_USE_EMULATOR=false \
 *   FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}' \
 *   npm run create-admin -- admin@baznas.go.id rahasia123
 *
 * Script ini juga men-set custom claim { admin: true }.
 * (Self-contained: tidak memakai path alias agar aman dijalankan via tsx.)
 */
import { cert, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const [, , email, password] = process.argv;
if (!email || !password) {
  console.error("Usage: npm run create-admin -- <email> <password>");
  process.exit(1);
}

const useEmulator = process.env.NEXT_PUBLIC_USE_EMULATOR !== "false";
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "pohon-baznas";

if (useEmulator) {
  process.env.FIREBASE_AUTH_EMULATOR_HOST ||= "127.0.0.1:9099";
}

function init(): App {
  if (useEmulator) return initializeApp({ projectId });
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (raw) return initializeApp({ credential: cert(JSON.parse(raw)) });
  return initializeApp(); // Application Default Credentials
}

async function main() {
  const app = init();
  const auth = getAuth(app);

  let uid: string;
  try {
    const user = await auth.createUser({ email, password });
    uid = user.uid;
    console.log(`✔ Akun admin dibuat: ${email}`);
  } catch (err: unknown) {
    const code = (err as { code?: string }).code;
    if (code === "auth/email-already-exists") {
      const user = await auth.getUserByEmail(email);
      uid = user.uid;
      await auth.updateUser(uid, { password });
      console.log(`✔ Akun sudah ada, kata sandi diperbarui: ${email}`);
    } else {
      throw err;
    }
  }

  await auth.setCustomUserClaims(uid, { admin: true });
  console.log("✔ Custom claim { admin: true } di-set.");
  console.log(
    useEmulator
      ? "Mode: EMULATOR (pastikan `npm run emulators` sedang berjalan)."
      : "Mode: PRODUKSI.",
  );
  process.exit(0);
}

main().catch((err) => {
  console.error("Gagal membuat admin:", err);
  process.exit(1);
});
