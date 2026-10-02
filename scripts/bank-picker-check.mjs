// Drives the sign-in bank search in a real browser: type, filter, arrow, Enter, and check the submitted code; usage: node scripts/bank-picker-check.mjs [outPng]
import { chromium } from "playwright";

const out = process.argv[2];
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await (await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })).newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto((process.env.BASE_URL ?? "http://localhost:3000") + "/login", { waitUntil: "load", timeout: 120000 });

let fails = 0;
const check = (name, ok, extra = "") => { console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? "  " + extra : ""}`); if (!ok) fails++; };

check("defaults to Ecobank", (await page.inputValue('input[name="bankCode"]')) === "050");
await page.click("#bankSearch");
await page.fill("#bankSearch", "opay");
const opts = await page.locator('[role="option"]').allTextContents();
check("typing 'opay' filters the list", opts.length > 0 && opts.every((t) => /opay/i.test(t)), JSON.stringify(opts));
if (out) await page.screenshot({ path: out, fullPage: false });
await page.keyboard.press("Enter");
check("Enter picks the first match", (await page.inputValue('input[name="bankCode"]')) === "999992", await page.inputValue('input[name="bankCode"]'));
check("list closes after picking", (await page.locator('[role="listbox"]').count()) === 0);
await page.click("#bankSearch");
await page.fill("#bankSearch", "zzzz");
check("no match shows an empty message", (await page.getByText("No bank matches").count()) === 1);
await page.keyboard.press("Escape");
await page.click("#bankSearch");
await page.fill("#bankSearch", "kuda");
await page.keyboard.press("ArrowDown");
await page.keyboard.press("ArrowUp");
await page.keyboard.press("Enter");
check("arrows then Enter picks Kuda", (await page.inputValue('input[name="bankCode"]')) === "50211", await page.inputValue('input[name="bankCode"]'));
await page.click("#bankSearch");
await page.fill("#bankSearch", "gt");
await page.keyboard.press("Tab");
check("Tab away closes the list", (await page.locator('[role="listbox"]').count()) === 0);
check("no page errors", errors.length === 0, errors.join("; "));

await browser.close();
console.log(fails ? `\n${fails} FAILURE(S)` : "\nALL PASS");
process.exit(fails ? 1 : 0);
