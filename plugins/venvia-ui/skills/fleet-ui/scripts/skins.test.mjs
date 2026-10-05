// skins.test.mjs — 驗證 tokens.css 與 skin-design.md 內所有範例皮膚的語意色，
// 在每一種會承載文字的表面上都達到 WCAG AA。執行：node --test skins.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { contrast } from "./contrast.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const SURFACES = ["background", "card", "sidebar", "muted"];
const TINTS = { success: 0.15, warning: 0.15, info: 0.15, destructive: 0.1 };

// 取出 CSS 文字中每個 :root / .dark 區塊的 token 值
function skins(css, label) {
  const out = [];
  for (const m of css.matchAll(/^(:root|\.dark) \{([\s\S]*?)^\}/gm)) {
    const vars = {};
    for (const v of m[2].matchAll(/--([\w-]+):\s*(oklch\([^)]*\))/g)) vars[v[1]] = v[2];
    if (vars.background) out.push({ name: `${label} ${m[1]}`, vars });
  }
  return out;
}

const all = [
  ...skins(readFileSync(join(root, "assets/tokens.css"), "utf8"), "tokens.css"),
  ...skins(readFileSync(join(root, "references/skin-design.md"), "utf8"), "skin-design.md"),
];

test("found every example skin (tokens + cockpit + office, light and dark)", () => {
  assert.equal(all.length, 6);
});

for (const { name, vars } of all) {
  for (const [sem, alpha] of Object.entries(TINTS)) {
    for (const surface of SURFACES) {
      test(`${name}: text-${sem} on ${surface} and on bg-${sem}/${alpha * 100} over ${surface}`, () => {
        const fg = vars[sem];
        const base = vars[surface];
        assert.ok(fg && base, `missing --${sem} or --${surface}`);
        const plain = contrast(fg, base);
        const tinted = contrast(fg, fg, base, alpha);
        assert.ok(plain >= 4.5, `plain ${plain.toFixed(2)}`);
        assert.ok(tinted >= 4.5, `tinted ${tinted.toFixed(2)}`);
      });
    }
  }
}
