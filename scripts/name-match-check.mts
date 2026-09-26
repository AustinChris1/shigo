// Name-matching rule for bank verification; run: node scripts/name-match-check.mts
import { nameTallies } from "../src/lib/names.ts";

const cases: [string, string, boolean][] = [
  ["Ada Obi", "OBI ADAEZE CHIOMA", true],
  ["Adaeze Obi", "OBI ADAEZE CHIOMA", true],
  ["Chioma", "OBI ADAEZE CHIOMA", true],
  ["obi  adaeze", "OBI, ADAEZE C.", true],
  ["Austin-Chris Chukwudi Iwu", "IWU AUSTIN CHRIS CHUKWUDI", true],
  ["Chris Iwu", "IWU AUSTIN CHRIS CHUKWUDI", true],
  ["Tunde Bakare", "OBI ADAEZE CHIOMA", false],
  ["Ada Bakare", "OBI ADAEZE CHIOMA", false],
  ["Emeka", "OBI ADAEZE CHIOMA", false],
];
let fails = 0;
for (const [typed, onAccount, want] of cases) {
  const got = nameTallies(typed, onAccount);
  console.log(got === want ? "PASS" : "FAIL", JSON.stringify(typed), "vs", JSON.stringify(onAccount), "->", got);
  if (got !== want) fails++;
}
console.log(fails ? `${fails} FAILURE(S)` : "ALL PASS");
process.exit(fails ? 1 : 0);
