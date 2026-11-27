import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const root = path.resolve(import.meta.dirname, "..");
const baseLocale = "en-US";
const localesDir = path.join(root, "locales");

function readLocale(locale) {
  const file = path.join(localesDir, locale, "messages.json");
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const base = readLocale(baseLocale);
const baseKeys = Object.keys(base).sort();
let failed = false;

for (const locale of fs.readdirSync(localesDir).filter((name) =>
  fs.statSync(path.join(localesDir, name)).isDirectory()
)) {
  const messages = readLocale(locale);
  const keys = Object.keys(messages).sort();
  const missing = baseKeys.filter((key) => !Object.hasOwn(messages, key));
  const extra = keys.filter((key) => !Object.hasOwn(base, key));
  const empty = keys.filter((key) =>
    typeof messages[key] !== "string" || messages[key].trim() === ""
  );

  console.log(`[${locale}] ${keys.length} keys`);
  if (missing.length) {
    failed = true;
    console.error("  Missing:", missing.join(", "));
  }
  if (extra.length) {
    failed = true;
    console.error("  Extra:", extra.join(", "));
  }
  if (empty.length) {
    failed = true;
    console.error("  Empty/invalid:", empty.join(", "));
  }
}


const uiLocales = require(path.join(root, "i18n-locales.js"));
const uiTable = uiLocales.UI_TABLE;
const expectedLocaleCount = 9;
const expectedUiKeyCount = 345;
if (!uiLocales.LANG_IDS.includes("th-TH")) {
  failed = true;
  console.error("UI_TABLE is missing the th-TH locale.");
}
if (uiLocales.LANG_IDS.length !== expectedLocaleCount) {
  failed = true;
  console.error(`Expected ${expectedLocaleCount} UI locales, got ${uiLocales.LANG_IDS.length}.`);
}
if (Object.keys(uiTable).length !== expectedUiKeyCount) {
  failed = true;
  console.error(`Expected ${expectedUiKeyCount} UI keys, got ${Object.keys(uiTable).length}.`);
}
let thaiDifferentFromEnglish = 0;
for (const [key, row] of Object.entries(uiTable)) {
  if (!Array.isArray(row) || row.length !== uiLocales.LANG_IDS.length) {
    failed = true;
    console.error(`  Invalid locale row shape: ${key}`);
    continue;
  }
  if (row.some((value) => typeof value !== "string" || value.trim() === "")) {
    failed = true;
    console.error(`  Empty/invalid UI translation: ${key}`);
  }
  if (row[8] !== row[2]) thaiDifferentFromEnglish++;
}
if (thaiDifferentFromEnglish < 330) {
  failed = true;
  console.error(`Expected at least 330 Thai UI values to differ from English, got ${thaiDifferentFromEnglish}.`);
}
console.log(`[UI_TABLE] ${Object.keys(uiTable).length} keys × ${uiLocales.LANG_IDS.length} locales; Thai differs from English on ${thaiDifferentFromEnglish} keys.`);

if (failed) process.exitCode = 1;
else console.log("Locale validation passed.");
