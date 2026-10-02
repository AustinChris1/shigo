// Runs every end-to-end check against one running server; usage: BASE_URL=http://localhost:3000 npm run test:e2e
// Start the server first, with the bank check off and test payments on:
//   npm run build && PAYSTACK_SECRET_KEY=sk_test_dummy DEMO_MODE=1 ALLOW_SIMULATED_CREDITS=1 npm start
import { spawnSync } from "child_process";

const base = process.env.BASE_URL ?? "http://localhost:3000";
const checks = ["e2e-local.mjs", "bankapp-check.mjs", "demo-check.mjs", "signin-check.mjs", "bank-picker-check.mjs"];

try {
  await fetch(base + "/login", { signal: AbortSignal.timeout(10_000) });
} catch {
  console.error(`No server at ${base}. Start one first (see the top of scripts/test-e2e.mjs).`);
  process.exit(1);
}

const failed = [];
for (const c of checks) {
  console.log(`\n== ${c}`);
  const r = spawnSync(process.execPath, [`scripts/${c}`], { stdio: "inherit", env: { ...process.env, BASE_URL: base } });
  if (r.status !== 0) failed.push(c);
}
console.log(failed.length ? `\nFAILED: ${failed.join(", ")}` : `\nALL ${checks.length} CHECKS PASS`);
process.exit(failed.length ? 1 : 0);
