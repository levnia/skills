---
name: fleet-ui
description: 在 React / Next.js 專案建立或修改後台、儀表板、管理介面、工作區型應用的 UI 時使用——設計色票與主題、新增頁面／表格／表單／KPI、接入字體與暗色模式、或要求「照 fleet 風格」「跟 cockpit 一樣的 UI」。提供 token 契約、元件配方、工作區外殼、頁面原型，以及金融／地圖／流程選配模組。Do NOT use for：行銷形象頁或 landing page、提案／討論用 HTML（用 proposal-visual-aid）、已有其他設計系統的專案、非 React 專案、純後端工作。
metadata:
  version: "0.1.0"
  summary: "結構統一、皮膚自訂的 React/Next.js 後台 UI 設計指南——token 契約、元件配方、工作區外殼、頁面原型，與金融/地圖/流程選配模組。"
  category: development
---

# fleet-ui

結構統一、皮膚自訂的後台 UI 指南。**結構**（外殼、元件配方、密度、狀態處理）在所有專案都一樣；**皮膚**（色票、字體、radius）依產品調性設計，但一律透過同一組 token 名稱。技術基準：Tailwind v4 CSS-first + shadcn nova（radix-nova 或 base-nova）+ lucide + next-themes，同時適用 Next.js（SSR）與 React CSR（Vite）。

## 開工流程

1. **檢查 token**：看專案的 `globals.css` 是否已包含 `assets/tokens.css` 的全部 token 名稱（特別是 `--success`、`--warning`、`--info` 與三個字體變數）。
2. **沒有就起手**：把 `assets/tokens.css` 接在 globals.css 的 `@import` 之後，再照 `references/skin-design.md` 設計皮膚、替換色值。
3. **驗證對比**：每個語意色都用 `node scripts/contrast.mjs` 驗證亮、暗兩組（含淡底用法），全部 `AA=pass` 才算完成。
4. **接入框架**：字體、主題防閃爍、client-only 元件照 `references/framework-setup.md`；monorepo 共用 UI 套件時，`shadcn add` 之後先照該文件檢查 import 路徑與 `@source`。
5. **寫 UI**：外殼照 `pattern-workspace.md`，頁面照 `pattern-pages.md`，元件照 `components.md`；領域吻合時再讀對應的選配模組。

## 硬規則

- **元件**一律用 `npx shadcn add` 取得，不手刻已有 primitive 的元件；只調 className。
- **密度**：控制元件 `h-8`（sm/工具列 `h-7`、表格內 `h-6`）；icon `size-4`；內文 `text-sm`、中繼 `text-xs`；字重最高 `font-semibold` 且只給標題；間距只用 2/3/4/6。
- **Card**：`rounded-xl ring-1 ring-foreground/10`，不加 border、不加 shadow；表格卡 `p-0 overflow-hidden`。
- **Button**：每區最多一個 `default`；segmented = `default` 對 `outline`；destructive 一律淡色（`bg-destructive/10`）。
- **Badge**：pill，狀態用淡底實字 `bg-success/15 text-success`。
- **Table**：數字欄 `text-right tabular-nums`；ID `font-mono text-xs text-muted-foreground`；空值「—」。
- **陰影**只給浮層（popover `shadow-md`、拖曳 `shadow-lg`）。
- **Focus**：`focus-visible:ring-3 focus-visible:ring-ring/50`；hover 才顯示的操作也要 `focus-visible:opacity-100`。
- **三態**：每個資料區塊都要有 loading（同高 Skeleton）、empty（說明 + 下一步）、error（`role="alert"` + 重試）。
- **外殼尺寸**：header `h-14`；sidebar 預設 `16rem`、可拖 180–420px；分頁列 `h-10`、分頁 `h-9 text-[13px]`。
- **語言**：UI 文案預設繁體中文（zh-TW），技術名詞保留英文；`<html lang="zh-Hant">`。

## 禁忌

- 在元件裡直接寫 Tailwind 色階（`text-emerald-500`、`bg-amber-900/40`…），必須走語意 token。
- 數字沒有加 `tabular-nums`。
- 沒有實際載入字體，或字體變數指向不存在的值。
- 手刻已有 shadcn primitive 的元件（popover、dropdown、dialog）。
- 卡片同時用 border 和 shadow，或在非浮層元件上加陰影。
- 用 mounted 狀態切換 DOM，造成 hydration 閃爍。
- 在 JS 裡另存一份和 token 重複的色碼。
- 缺少 loading、empty、error 任何一種狀態。
- 寫死只為單一主題設計的顏色（例如永遠深色的 status bar）。

## 讀哪份 reference

| 啟用條件 | 檔案 |
|---|---|
| 新專案，或要設計、修改色票、字體、radius；多個 app 共用結構、只換主色（局部皮膚） | `references/skin-design.md` |
| 撰寫或調整任何元件（按鈕、卡片、表格、表單、KPI、badge） | `references/components.md` |
| 新專案接入、載入字體、設定暗色模式、放入圖表或流程圖等 client-only 元件；monorepo 共用 UI 套件；伺服器端錯誤頁或注入元件這類載入不了 app CSS 的頁面 | `references/framework-setup.md` |
| 建立或修改 sidebar、header、分頁、分割窗格 | `references/pattern-workspace.md` |
| 新增一個頁面（列表、詳情、表單、設定、管理、儀表板首頁、登入/404） | `references/pattern-pages.md` |
| **選配**：畫面顯示股價、指數、漲跌、報酬、損益或部位 | `references/modules/finance.md` |
| **選配**：畫面主體是 2D/3D 地圖或場景檢視器 | `references/modules/map.md` |
| **選配**：做簽核、審批、流程圖、表單建構器、稽核軌跡；版本審核、發佈、上下架這類有狀態機的流程（例如「上傳 → 審核 → 發佈 → 上下架」，不要當成一般 CRUD） | `references/modules/workflow.md` |

選配模組只在條件成立時讀；條件不符就不要讀，也不要套用其中的 token 或配方。

## 附帶資源

- `assets/tokens.css`：token 骨架（名稱是契約，色值是 cockpit 範例，需依皮膚替換）。
- `scripts/contrast.mjs`：OKLCH 對比度檢查，`node scripts/contrast.mjs <fg> <bg> [<base> <alpha>]`，fail 時 exit 1。
- `scripts/tokens-css.mjs`：把 tokens（加皮膚覆寫）輸出成只含 `:root` 與 `prefers-color-scheme: dark` 的獨立 CSS，給伺服器端頁面使用；不新增 token。
