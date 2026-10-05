// tokens-css.test.mjs — 以 node:test 執行：node --test tokens-css.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildTokensCss, readBlocks } from "./tokens-css.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const tokensPath = join(here, "../assets/tokens.css");

function tmp(name, text) {
  const p = join(mkdtempSync(join(tmpdir(), "tk-")), name);
  writeFileSync(p, text);
  return p;
}

test("reads :root and .dark blocks, ignoring @theme and comments", () => {
  const { light, dark } = readBlocks(`
    @theme inline { --color-primary: var(--primary); }
    /* :root { --primary: red; } */
    :root { --primary: oklch(0.2 0 0); --radius: 0.5rem; }
    .dark { --primary: oklch(0.9 0 0); }
  `);
  assert.deepEqual(light, { primary: "oklch(0.2 0 0)", radius: "0.5rem" });
  assert.deepEqual(dark, { primary: "oklch(0.9 0 0)" });
});

test("later files override earlier ones, token by token", () => {
  const css = buildTokensCss([
    ":root { --primary: oklch(0.2 0 0); --ring: oklch(0.7 0 0); } .dark { --primary: oklch(0.9 0 0); }",
    ":root { --primary: oklch(0.46 0.17 285); }",
  ]);
  assert.match(css, /:root \{\n  --primary: oklch\(0\.46 0\.17 285\);\n  --ring: oklch\(0\.7 0 0\);\n\}/);
});

test("emits dark values under prefers-color-scheme, not .dark", () => {
  const css = buildTokensCss([":root { --primary: a; } .dark { --primary: b; }"]);
  assert.match(css, /@media \(prefers-color-scheme: dark\) \{\n  :root \{\n    --primary: b;\n  \}\n\}/);
  assert.doesNotMatch(css, /\.dark/);
});

test("--only keeps the listed tokens and fails loudly on unknown names", () => {
  const css = buildTokensCss([":root { --primary: a; --ring: b; } .dark { --primary: c; }"], { only: ["primary"] });
  assert.doesNotMatch(css, /--ring/);
  assert.match(css, /--primary: a;/);
  assert.throws(() => buildTokensCss([":root { --primary: a; }"], { only: ["primray"] }), /unknown token: primray/);
});

test("does not invent or rename tokens: output names equal the input :root names", () => {
  const css = buildTokensCss([readFileSyncText(tokensPath)]);
  const names = (s) => [...s.matchAll(/--([\w-]+):/g)].map((m) => m[1]);
  const light = names(css.split("@media")[0]);
  assert.deepEqual(light, Object.keys(readBlocks(readFileSyncText(tokensPath)).light));
});

test("CLI writes CSS to stdout and exits 2 on a missing file", () => {
  const over = tmp("over.css", ":root { --primary: oklch(0.46 0.17 285); }");
  const ok = spawnSync(process.execPath, [join(here, "tokens-css.mjs"), tokensPath, over, "--only", "primary,background"], { encoding: "utf8" });
  assert.equal(ok.status, 0, ok.stderr);
  assert.match(ok.stdout, /--primary: oklch\(0\.46 0\.17 285\);/);
  assert.match(ok.stdout, /prefers-color-scheme: dark/);
  const bad = spawnSync(process.execPath, [join(here, "tokens-css.mjs"), "/nope.css"], { encoding: "utf8" });
  assert.equal(bad.status, 2);
});

import { readFileSync } from "node:fs";
function readFileSyncText(p) {
  return readFileSync(p, "utf8");
}
