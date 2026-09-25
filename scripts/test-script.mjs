// Five-step test script via the simulator; usage: node scripts/test-script.mjs <accountRef> [baseUrl]

const accountRef = process.argv[2];
const base = process.argv[3] ?? "http://localhost:3000";
if (!accountRef) {
  console.error("usage: node scripts/test-script.mjs <accountRef the seller signed up with> [baseUrl]");
  process.exit(1);
}

const post = async (path, body) => {
  const r = await fetch(base + path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  return { status: r.status, json: await r.json().catch(() => null) };
};

console.log("Step 2/5: fire a credit that should match the ₦4,500 order you created in the app");
console.log(await post("/api/dev/simulate", { accountRef, amountKobo: 450000, narration: "SG-TEST wig", payerName: "Ada Obi" }));

console.log("Step 5/5: fire a credit for a different amount; nothing should turn green");
console.log(await post("/api/dev/simulate", { accountRef, amountKobo: 123400, payerName: "Nobody" }));

console.log("Replay: the same externalId twice is processed once");
const id = "sim_replay_" + Date.now();
console.log(await post("/api/dev/simulate", { accountRef, amountKobo: 450000, externalId: id }));
console.log(await post("/api/dev/simulate", { accountRef, amountKobo: 450000, externalId: id }));
