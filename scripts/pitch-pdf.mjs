// Prints pitch/deck.html to pitch/Shigo-pitch.pdf, one 1920x1080 page per slide, using the local Edge.
// usage: node scripts/pitch-pdf.mjs
import { chromium } from "playwright";
import { pathToFileURL } from "url";
import { resolve } from "path";

const deck = resolve("pitch/deck.html");
const b = await chromium.launch({ channel: "msedge", headless: true });
const p = await (await b.newContext({ viewport: { width: 1920, height: 1080 } })).newPage();
await p.goto(pathToFileURL(deck).href, { waitUntil: "networkidle" });
await p.evaluate(() => document.fonts.ready);
await p.pdf({ path: "pitch/Shigo-pitch.pdf", width: "1920px", height: "1080px", printBackground: true, preferCSSPageSize: true });
await b.close();
console.log("wrote pitch/Shigo-pitch.pdf");
