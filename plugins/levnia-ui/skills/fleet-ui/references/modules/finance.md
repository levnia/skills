# 選配模組：金融

> **啟用條件**：畫面會顯示股價、指數、漲跌、報酬、損益或部位時才讀。一般管理頁、簽核後台不需要讀這份。

## 追加 token

金融有兩種「好壞」語意，而且兩者不一定同色，所以分成兩組 token：

- `--up` / `--down`：**價格漲跌**。預設採台股慣例 **紅漲綠跌**。
- `--gain` / `--loss`：**績效損益**（報酬率、損益、vs 基準）。預設綠正紅負。

分開的原因：常見的錯誤是價格寫成紅漲、報酬欄卻寫成綠正，兩者混用同一組色階，結果同一個畫面上紅色一下代表好、一下代表壞。拆成兩組 token 之後，每個數字都要先決定它是「價格變動」還是「績效」，就不會混淆。要改成西方慣例（綠漲紅跌）時，只要交換 `--up` 和 `--down` 的值；要讓績效也跟著台股慣例，就把 `--gain/--loss` 設成與 `--up/--down` 相同。

把下面這段追加到 `tokens.css` 之後（值以 cockpit 皮膚為例，換皮膚時要重新驗證）：

```css
@theme inline {
  --color-up: var(--up);
  --color-up-foreground: var(--up-foreground);
  --color-down: var(--down);
  --color-down-foreground: var(--down-foreground);
  --color-gain: var(--gain);
  --color-gain-foreground: var(--gain-foreground);
  --color-loss: var(--loss);
  --color-loss-foreground: var(--loss-foreground);
}

:root {
  --up: oklch(0.50 0.245 27.325);      /* 紅漲 */
  --up-foreground: oklch(0.985 0 0);
  --down: oklch(0.47 0.154 150.069);    /* 綠跌 */
  --down-foreground: oklch(0.985 0 0);
  --gain: oklch(0.47 0.154 150.069);    /* 綠正 */
  --gain-foreground: oklch(0.985 0 0);
  --loss: oklch(0.50 0.245 27.325);    /* 紅負 */
  --loss-foreground: oklch(0.985 0 0);
}

.dark {
  --up: oklch(0.704 0.191 22.216);
  --up-foreground: oklch(0.145 0 0);
  --down: oklch(0.792 0.209 151.711);
  --down-foreground: oklch(0.145 0 0);
  --gain: oklch(0.792 0.209 151.711);
  --gain-foreground: oklch(0.145 0 0);
  --loss: oklch(0.704 0.191 22.216);
  --loss-foreground: oklch(0.145 0 0);
}
```

驗證（亮、暗各跑一次，全部要 `AA=pass`）：

```bash
node scripts/contrast.mjs "oklch(0.50 0.245 27.325)" "oklch(1 0 0)"
node scripts/contrast.mjs "oklch(0.47 0.154 150.069)" "oklch(1 0 0)"
node scripts/contrast.mjs "oklch(0.704 0.191 22.216)" "oklch(0.205 0 0)"
node scripts/contrast.mjs "oklch(0.792 0.209 151.711)" "oklch(0.205 0 0)"
```

使用方式：

| 數字類型 | class |
|---|---|
| 價格、指數、漲跌幅 | `change >= 0 ? "text-up" : "text-down"` |
| 報酬率、損益、vs 基準 | `ret >= 0 ? "text-gain" : "text-loss"` |
| 最大回撤（MDD） | 永遠是 `text-loss` |
| 平盤／0 | `text-muted-foreground` |

## 符號與格式化

- 漲跌方向用 ▲ ▼ 加上絕對值：`▲1.25%`、`▼0.40%`；平盤用「—」或 `0.00%`（muted）。
- 報酬類用 `pctSigned`：正值帶 `+`（`+12.3%`），負值帶 `−`。
- 金額單位：大於一億用「億」、大於一萬用「萬」（`money()`）；指數與股價用 `toLocaleString("en-US")` 加千分位。
- 日期在表格與圖表軸線用 `MM-DD`，完整日期放 tooltip。
- 所有數字 `tabular-nums`，表格內靠右；null 顯示「—」。
- 格式化函式集中在 `lib/format.ts`。

## 跑馬燈（市場概況）

放在 header 的情境區，一行顯示多個指標，無縫循環。

```css
@keyframes ticker {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}
.animate-ticker { animation: ticker 50s linear infinite; }
.animate-ticker:hover { animation-play-state: paused; }
@media (prefers-reduced-motion: reduce) {
  .animate-ticker { animation: none; }
}
```

```tsx
<div className="relative hidden min-w-0 flex-1 overflow-hidden md:block" title="系統訊號，非投資建議">
  <div className="flex w-max animate-ticker items-center"><Row /><Row /></div>  {/* 內容放兩份，平移 -50% 才能無縫 */}
  <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-background to-transparent" />
  <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-background to-transparent" />
</div>
// Row:  flex shrink-0 items-center gap-7 whitespace-nowrap pr-7 text-sm
// Item: <span className="text-muted-foreground">{label}</span> <span className="font-medium tabular-nums">{value}</span>
```

資料過期時，在跑馬燈裡加上 `text-warning` 的「⚠ 資料過期」項目，不要讓使用者誤以為是即時資料。

## 圖表外框（K 線、權益曲線）

- 圖表放在 Card 裡：K 線 `<Card className="p-2">`，權益曲線 `<Card className="p-4">` 並加一行 `mb-2 text-sm text-muted-foreground` 說明。
- 圖表背景透明；文字色、格線色、系列色都從 CSS 變數讀（見 `components.md` 的 `chartColors()`），K 線的漲跌色讀 `--up` / `--down`，主題切換時重建。
- 浮動 crosshair 說明：`pointer-events-none absolute left-3 top-2 z-10 rounded bg-background/70 px-2 py-0.5 text-xs`。
- 多系列比較時，系列色依序取 `--chart-1..5`，基準（benchmark）固定用 `--muted-foreground` 虛線。
- 狀態底色帶（例如「偏空」「退場」期間）要比資料系列先加入，才會畫在後面；用 `--warning`、`--loss` 的 10–16% 透明度。
- 高度固定（例如 `h-[460px]` / `h-[320px]`），loading 與 error 時用同高的佔位區。

## 狀態燈號

- 以三燈表示狀態：正常 `bg-success`、注意 `bg-warning`、異常 `bg-destructive`；燈號為 `inline-block size-2 rounded-full`，旁邊一定要有文字，不能只靠顏色。
- 資料新鮮度：延遲 ≤ 1 期為正常，≤ 3 期為注意，其餘為異常。
- 即時連線中的點加 `animate-pulse`。
- 狀態到顏色的對應集中在一個檔案（例如 `lib/regime.ts`），元件只引用結果。

## 免責聲明

- 所有會被誤認為投資建議的數字都要附免責聲明「非投資建議」：
  - footer 常駐一行（`text-xs text-muted-foreground`）；
  - 每個分析頁的最底部放一行 `<p className="text-xs text-muted-foreground">… · 非投資建議。</p>`；
  - 跑馬燈與訊號類元件在 `title` 屬性註明。
- 回測結果要標明期間與「過去績效不代表未來」。
