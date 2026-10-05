// docs.test.mjs — 守住 references 範例與 skill 自身規則的一致性。執行：node --test docs.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(root, p), "utf8");
const tokens = read("assets/tokens.css");

test("every text-*-foreground / bg-* semantic class used in references has a token", () => {
  const files = ["components.md", "pattern-workspace.md", "pattern-pages.md", "modules/finance.md", "modules/map.md", "modules/workflow.md"];
  const finance = read("references/modules/finance.md");
  for (const f of files) {
    for (const m of read(`references/${f}`).matchAll(/\b(?:text|bg|border|ring)-(destructive|success|warning|info)-foreground\b/g)) {
      const name = `--color-${m[1]}-foreground`;
      assert.ok(tokens.includes(name) || finance.includes(name), `${f} uses ${m[0]} but ${name} is not defined`);
    }
  }
});

test("font variables carry var() fallbacks so a missing face never invalidates font-family", () => {
  assert.match(tokens, /--font-sans: var\(--font-body, "PingFang TC"/);
  assert.match(tokens, /--font-heading: var\(--font-display, var\(--font-body, "PingFang TC"/);
  assert.match(tokens, /--font-mono: var\(--font-mono-face, ui-monospace/);
});

test("next/dynamic ssr:false snippets are placed in a \"use client\" file", () => {
  const fs = read("references/framework-setup.md");
  const block = fs.slice(fs.indexOf("**client-only 元件**"), fs.indexOf("**client 邊界**"));
  assert.match(block, /"use client";\s*\nimport dynamic/);
  for (const f of ["modules/map.md", "modules/workflow.md"]) {
    assert.match(read(`references/${f}`), /"use client"/, `${f} must say the dynamic wrapper lives in a "use client" file`);
  }
});

test("interactive tabs and rows are keyboard reachable", () => {
  const ws = read("references/pattern-workspace.md");
  assert.doesNotMatch(ws, /<div className=\{cn\(\s*"group relative -mb-px/, "tab must not be a bare div");
  assert.match(ws, /role="tab"/);
  const pages = read("references/pattern-pages.md");
  assert.match(pages, /整列可點擊[^\n]*(tabIndex|<a|Link)/, "clickable rows need a focusable target");
});

// 來源專案名稱以雜湊比對：測試本身不能寫出名稱，否則公開 repo 反而洩漏它們。
const FORBIDDEN = new Set(["d45d96269ddf51d9", "4fe19da1cdc327dd", "44328c478726c54e", "ac0378adc9c71564"]);
const hash = (w) => createHash("sha256").update(w).digest("hex").slice(0, 16);

test("skill content is portable: no source project names", () => {
  const files = ["SKILL.md", "assets/tokens.css", "references/skin-design.md", "references/components.md",
    "references/framework-setup.md", "references/pattern-workspace.md", "references/pattern-pages.md",
    "references/modules/finance.md", "references/modules/map.md", "references/modules/workflow.md"];
  for (const f of files) {
    for (const w of read(f).toLowerCase().match(/[a-z][a-z0-9]*(?:-[a-z0-9]+)*/g) ?? []) {
      assert.ok(!FORBIDDEN.has(hash(w)), `${f} names a source project`);
    }
  }
});

// ── 第一次接入 monorepo + Vite CSR 專案後補強的內容 ──
const section = (text, heading) => {
  const i = text.indexOf(heading);
  assert.ok(i >= 0, `missing section: ${heading}`);
  const rest = text.slice(i + heading.length);
  const next = rest.search(/\n## /);
  return next < 0 ? rest : rest.slice(0, next);
};

test("framework-setup: shared UI package (monorepo) section covers aliases, baseUrl and the post-add check", () => {
  const s = section(read("references/framework-setup.md"), "## 共用 UI 套件（monorepo）");
  for (const k of ['"baseUrl"', '"paths"', '"hooks":', "resolve: { alias", 'from "cn"', "@/hooks", "grep"]) {
    assert.ok(s.includes(k), `monorepo section lacks ${k}`);
  }
  assert.equal((s.match(/"aliases"/g) ?? []).length, 2, "needs both components.json templates (ui package + app)");
});

test("framework-setup: Tailwind v4 @source for both the ui package and the app, with a build-time check", () => {
  const s = section(read("references/framework-setup.md"), "## 共用 UI 套件（monorepo）");
  assert.match(s, /@source "\.\.\/";/);
  assert.match(s, /@source "\.\/";/);
  assert.match(s, /sidebar-width/);
});

test("framework-setup: server-side pages are a first-class entry point using tokens-css.mjs", () => {
  const f = read("references/framework-setup.md");
  const s = section(f, "## 伺服器端頁面（非 React）");
  assert.match(s, /scripts\/tokens-css\.mjs/);
  assert.match(s, /prefers-color-scheme/);
  assert.match(f.split("## Next.js (SSR)")[0], /伺服器端頁面/, "entry-point table must list server-side pages");
});

test("framework-setup: verified version pairs and the anti-flash script whitelists storage values", () => {
  const f = read("references/framework-setup.md");
  const v = section(f, "### 已驗證的版本組合");
  assert.match(v, /\|\s*`\^7`\s*\|\s*`\^5`/, "vite 7 must pair with plugin-react 5");
  assert.match(v, /\|\s*`\^8`\s*\|\s*`\^6`/, "vite 8 must pair with plugin-react 6");
  assert.match(f, /白名單/);
  assert.match(f, /敏感資料/);
});

test("skin-design: partial skin lists the minimal override set and requires contrast checks", () => {
  const s = section(read("references/skin-design.md"), "## 局部皮膚");
  for (const t of ["--primary", "--primary-foreground", "--ring", "--sidebar-primary", "--sidebar-primary-foreground", "--chart-1"]) {
    assert.ok(s.includes(`\`${t}\``), `partial skin lacks ${t}`);
  }
  assert.match(s, /contrast\.mjs/);
  assert.match(s, /0\.15/);
});

test("components: responsive tables keep the action column visible", () => {
  const c = read("references/components.md");
  const s = section(c, "## 響應式表格");
  assert.match(s, /md:hidden/);
  assert.match(s, /hidden md:table-cell/);
  assert.match(s, /操作欄永遠可見/);
  assert.match(read("references/pattern-pages.md"), /響應式表格/);
});

test("components: dropzone recipe uses a dashed frame, hides the native input and states limits", () => {
  const s = section(read("references/components.md"), "## 上傳（dropzone）");
  assert.match(s, /border-dashed/);
  assert.match(s, /sr-only/);
  assert.match(s, /拖曳中|dragging/);
  assert.match(s, /上限/);
  assert.doesNotMatch(s, /\b(?:bg|text|border)-(?:red|green|amber|emerald|blue|gray|neutral|zinc|slate)-\d/, "recipe must only use semantic tokens");
});

test("components: row actions are outline/ghost; default only for the row that needs you", () => {
  const s = section(read("references/components.md"), "## 列操作");
  assert.match(s, /outline/);
  assert.match(s, /ghost/);
  assert.match(s, /需要你處理/);
});

test("SKILL.md: workflow module also triggers on versioned review / publish / unpublish state machines", () => {
  const row = read("SKILL.md").split("\n").find((l) => l.includes("modules/workflow.md"));
  assert.match(row, /版本審核/);
  assert.match(row, /上下架/);
  assert.match(row, /狀態機/);
  assert.match(read("references/modules/workflow.md").split("\n").slice(0, 5).join("\n"), /狀態機/);
});
