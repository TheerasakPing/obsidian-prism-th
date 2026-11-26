import fs from "node:fs";
import path from "node:path";

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

if (failed) process.exitCode = 1;
else console.log("Locale validation passed.");
