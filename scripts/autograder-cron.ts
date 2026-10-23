/**
 * Cron script: calls the /api/autograder endpoint every 5 minutes
 * during active match windows. Run via Docker or system cron.
 *
 * Usage:
 *   AUTOGRADER_SECRET=xxx APP_URL=https://quinielaselva.us npx tsx scripts/autograder-cron.ts
 */
import "dotenv/config";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "http://localhost:3000";
const SECRET = process.env.AUTOGRADER_SECRET;

if (!SECRET) {
  console.error("❌ AUTOGRADER_SECRET no está configurada");
  process.exit(1);
}

async function run() {
  const url = `${APP_URL}/api/autograder`;
  console.log(`[${new Date().toISOString()}] Llamando a ${url}...`);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "x-autograder-key": SECRET! },
    });

    const data = await res.json();

    if (!res.ok) {
      console.error(`  ❌ HTTP ${res.status}:`, data.error ?? data);
      return;
    }

    console.log(`  ✅ Procesados: ${data.fixturesProcessed}`);
    if (data.graded.length > 0) {
      console.log(`  🏆 Calificados: ${data.graded.join(", ")}`);
    }
    if (data.liveUpdated > 0) {
      console.log(`  🔴 En vivo actualizados: ${data.liveUpdated}`);
    }
    if (data.errors.length > 0) {
      console.error(`  ⚠️ Errores: ${data.errors.join(", ")}`);
    }
  } catch (err) {
    console.error(`  ❌ Error de red:`, err instanceof Error ? err.message : err);
  }
}

run();
