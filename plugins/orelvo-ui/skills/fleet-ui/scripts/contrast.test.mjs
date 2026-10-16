// contrast.test.mjs — 以 node:test 執行：node --test contrast.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { contrast, parseOklch } from "./contrast.mjs";

test("black on white is 21:1", () => {
  assert.equal(contrast("oklch(0 0 0)", "oklch(1 0 0)").toFixed(2), "21.00");
});

test("same color is 1:1", () => {
  assert.equal(contrast("oklch(0.5 0.1 200)", "oklch(0.5 0.1 200)").toFixed(2), "1.00");
});

test("parses alpha percent", () => {
  assert.deepEqual(parseOklch("oklch(1 0 0 / 10%)"), { L: 1, C: 0, H: 0, A: 0.1 });
});

test("parses without alpha", () => {
  assert.deepEqual(parseOklch("oklch(0.32 0.085 262)"), { L: 0.32, C: 0.085, H: 262, A: 1 });
});

test("rejects garbage", () => {
  assert.throws(() => parseOklch("#fff"), /oklch/);
});

test("tinted background over base lowers contrast vs. pure base", () => {
  const fg = "oklch(0.555 0.163 49)";
  const onBase = contrast(fg, "oklch(1 0 0)");
  const onTint = contrast(fg, "oklch(0.555 0.163 49)", "oklch(1 0 0)", 0.15);
  assert.ok(onTint < onBase);
});

test("neutral-500 grey on white is roughly 4.7", () => {
  // Tailwind neutral-500 = oklch(0.556 0 0) ≈ #737373, WCAG ratio ≈ 4.74
  const r = contrast("oklch(0.556 0 0)", "oklch(1 0 0)");
  assert.ok(r > 4.6 && r < 4.9, `got ${r}`);
});

// CLI 必須在「路徑含空白、CJK、經 symlink 呼叫」時照常執行並回傳正確 exit code
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, copyFileSync, mkdirSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
function cliAt(dir) {
  mkdirSync(dir, { recursive: true });
  const p = join(dir, "contrast.mjs");
  copyFileSync(join(here, "contrast.mjs"), p);
  return p;
}

test("CLI fails with exit 1 when run from a path with spaces and CJK", () => {
  const p = cliAt(join(mkdtempSync(join(tmpdir(), "ct-")), "a b", "色票"));
  const r = spawnSync(process.execPath, [p, "oklch(0.8 0 0)", "oklch(1 0 0)"], { encoding: "utf8" });
  assert.equal(r.status, 1);
  assert.match(r.stdout, /AA=fail/);
});

test("CLI runs when invoked through a symlink", () => {
  const base = mkdtempSync(join(tmpdir(), "ct-"));
  const real = cliAt(join(base, "real"));
  const link = join(base, "link.mjs");
  symlinkSync(real, link);
  const out = execFileSync(process.execPath, [link, "oklch(0 0 0)", "oklch(1 0 0)"], { encoding: "utf8" });
  assert.match(out, /ratio=21\.00 AA=pass/);
});
