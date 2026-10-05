#!/usr/bin/env node
// contrast.mjs — 計算兩個 OKLCH 顏色的 WCAG 2 對比度（零依賴）。
// 用法：node contrast.mjs <fg> <bg> [<base> <alpha>]
//   bg 若是半透明淡底（如 bg-warning/15），傳入 base（其下的 card 色）與 alpha（0.15）。
// 輸出：ratio=<n> AA=<pass|fail>；fail 時 exit 1。

import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

export function parseOklch(str) {
  const m = /^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+)(%?)\s*)?\)$/.exec(str.trim());
  if (!m) throw new Error(`not an oklch() color: ${str}`);
  const A = m[4] === undefined ? 1 : m[5] === "%" ? Number(m[4]) / 100 : Number(m[4]);
  return { L: Number(m[1]), C: Number(m[2]), H: Number(m[3]), A };
}

const clamp = (x) => Math.min(1, Math.max(0, x));
const toGamma = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);

// OKLCH → gamma-encoded sRGB [r,g,b]，各 0–1（超出色域則截斷）
function toSrgb({ L, C, H }) {
  const h = (H * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const lin = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  return lin.map((c) => toGamma(clamp(c)));
}

// 瀏覽器在 gamma sRGB 空間做 alpha 合成
const over = (top, bottom, alpha) => top.map((c, i) => c * alpha + bottom[i] * (1 - alpha));

const luminance = ([r, g, b]) =>
  0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);

export function contrast(fg, bg, base, alpha) {
  const bgC = parseOklch(bg);
  let bgRgb = toSrgb(bgC);
  if (base !== undefined) bgRgb = over(bgRgb, toSrgb(parseOklch(base)), Number(alpha));
  else if (bgC.A < 1) throw new Error("translucent bg needs <base> <alpha>");
  const fgC = parseOklch(fg);
  const fgRgb = over(toSrgb(fgC), bgRgb, fgC.A);
  const [hi, lo] = [luminance(fgRgb), luminance(bgRgb)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// 直接以 CLI 執行時才跑（比對真實路徑：處理空白/CJK 的 URL 編碼與 symlink）
const invokedDirectly = (() => {
  try {
    return process.argv[1] && realpathSync(fileURLToPath(import.meta.url)) === realpathSync(process.argv[1]);
  } catch {
    return false;
  }
})();

if (invokedDirectly) {
  const [fg, bg, base, alpha] = process.argv.slice(2);
  if (!fg || !bg || (base !== undefined && alpha === undefined)) {
    console.error("usage: node contrast.mjs <fg> <bg> [<base> <alpha>]");
    process.exit(2);
  }
  try {
    const r = contrast(fg, bg, base, alpha);
    const pass = r >= 4.5;
    console.log(`ratio=${r.toFixed(2)} AA=${pass ? "pass" : "fail"}`);
    process.exit(pass ? 0 : 1);
  } catch (e) {
    console.error(e.message);
    process.exit(2);
  }
}
