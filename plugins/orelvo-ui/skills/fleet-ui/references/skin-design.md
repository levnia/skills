# 皮膚設計

token 的**名稱**是契約（見 `assets/tokens.css`），token 的**值**是皮膚。每個專案都可以有自己的皮膚，但名稱不能增刪或改名，這樣元件配方才能在各專案之間通用。

## Token 契約

| token | 用途 | 使用方式 |
|---|---|---|
| `--background` / `--foreground` | 頁面底色與主文字 | `bg-background text-foreground`（base layer 已套） |
| `--card` / `--popover`（含 `-foreground`） | 卡片、浮層表面 | 卡片 `bg-card`；浮層 `bg-popover` |
| `--primary`（含 `-foreground`） | 主要操作、選取狀態、品牌 | `bg-primary text-primary-foreground`、`ring-primary/40` |
| `--secondary` / `--muted` / `--accent`（含 `-foreground`） | 次要按鈕、弱化底、hover 與強調底 | `bg-muted/50`、`text-muted-foreground`、`hover:bg-accent` |
| `--destructive` | 錯誤、刪除、駁回 | 一律淡底：`bg-destructive/10 text-destructive` |
| `--success` / `--warning` / `--info`（含 `-foreground`） | 成功、警告、資訊 | 淡底實字 `bg-success/15 text-success`；實心 `bg-success text-success-foreground` |
| `--border` / `--input` / `--ring` | 分隔線、輸入框框線、focus 環 | base layer 已把 `border-border`、`outline-ring/50` 設為預設 |
| `--chart-1..5` | 圖表系列色 | 第一色 = primary，其餘 hue 要拉開；以 CSS 變數讀取，不在 JS 另存 |
| `--sidebar*` | sidebar 專用的一組表面色 | shadcn Sidebar 自動使用 |
| `--radius` | 圓角基準，其餘 `--radius-*` 由它推導 | 只改這一個值 |

**字體三軌**（`@theme inline` 已接好 fallback，專案只需提供左欄三個變數）：

| 由框架提供 | 映射到 | 用途 |
|---|---|---|
| `--font-body` | `--font-sans` → `font-sans` | 內文（base layer 預設） |
| `--font-display` | `--font-heading` → `font-heading` | 標題；不設時退回 `--font-body` |
| `--font-mono-face` | `--font-mono` → `font-mono` | ID、時間戳、KPI 數字 |

每個 `var()` 都帶有 fallback（例如 `var(--font-display, var(--font-body, …))`）：CSS 中未定義且沒有 fallback 的 `var()` 會讓整條 `font-family` 失效，而不是跳到下一個字體，所以不能省略。fallback 固定為：sans/heading 接 `"PingFang TC", "Microsoft JhengHei", "Noto Sans TC", sans-serif`，mono 接 `ui-monospace, "SFMono-Regular", monospace`。字體一定要實際載入（見 `framework-setup.md`），不能只靠 fallback。

金融專用 token（`--up/--down/--gain/--loss`）不在核心契約內，需要時見 `modules/finance.md`。

## 皮膚設計方法

1. **定調性**：「資料駕駛艙」（dark 預設、冷中性、色彩只給資料語意）或「白天後台」（system 預設、暖底、可用 serif 標題）。兩者都不像時，照下面的步驟自行設計。
2. **選 hue（OKLCH）**：中性面選一個 hue，chroma ≤ 0.01（純灰可用 chroma 0）；primary 選一個 hue；accent 可選第三個 hue，但要低彩度（淺底 chroma ≤ 0.05，搭配深色字）。
3. **暗色不是亮度反轉**：底色保留 primary hue 的微彩度（例如 `oklch(0.19 0.018 262)`），而不是純黑；卡片比底色亮約 0.04–0.06；border 用 `oklch(1 0 0 / 10%)`、input 用 `oklch(1 0 0 / 15%)`；primary 在暗色改為淺色。
4. **對比驗證（必做）**：語意色文字對其**實際底色**需 ≥ 4.5:1（WCAG AA）。用腳本驗證，亮、暗兩組都要跑：

   ```bash
   # 文字直接放在 card 上
   node scripts/contrast.mjs "<text>" "<card>"
   # 淡底用法：bg-success/15 疊在 card 上（destructive 用 0.10）
   node scripts/contrast.mjs "<text>" "<text>" "<card>" 0.15
   # 實心用法：foreground 放在語意色上
   node scripts/contrast.mjs "<x-foreground>" "<x>"
   ```

   **每一種會承載文字的表面都要驗**：background、card、sidebar、muted 都要各跑一次，不能只驗 card。越灰的表面，淡底合成後越暗，越容易失敗。全部 `AA=pass` 才算完成（`scripts/skins.test.mjs` 會對範例皮膚自動做這項檢查，新皮膚可以比照）。**亮色語意色的 L 值要以淡底情境驗證，而不是只驗證白底**：實測 shadcn 原值與 Tailwind 600 階在亮色淡底上只有約 3.6–4.2:1，所以亮色語意色通常要比直覺更暗（L 約 0.45–0.51）。
5. **radius** 取 0.5–0.625rem，越密集越小。
6. **預設主題**：駕駛艙用 `dark`，白天後台用 `system`。

## 範例皮膚：cockpit

以 shadcn neutral 為基底的資料駕駛艙皮膚。

- 調性：資料駕駛艙；dark 預設；色彩只用在資料語意上，外框全為中性灰（chroma 0）。
- 字體：Geist（sans）；mono 可用 Geist Mono。
- radius：`0.625rem`。
- 以下是完整色票；fleet-ui 補上或調整的值已標註。

```css
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.50 0.245 27.325);   /* shadcn 原值 0.577 在淡底 fail，調暗至 0.50 */
  --success: oklch(0.47 0.154 150.069);      /* fleet-ui 補 */
  --success-foreground: oklch(0.985 0 0);
  --warning: oklch(0.50 0.163 48.998);
  --warning-foreground: oklch(0.985 0 0);
  --info: oklch(0.50 0.245 262.881);
  --info-foreground: oklch(0.985 0 0);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  --chart-1: oklch(0.87 0 0);
  --chart-2: oklch(0.556 0 0);
  --chart-3: oklch(0.439 0 0);
  --chart-4: oklch(0.371 0 0);
  --chart-5: oklch(0.269 0 0);
  --radius: 0.625rem;
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.145 0 0);
  --sidebar-primary: oklch(0.205 0 0);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.97 0 0);
  --sidebar-accent-foreground: oklch(0.205 0 0);
  --sidebar-border: oklch(0.922 0 0);
  --sidebar-ring: oklch(0.708 0 0);
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.205 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.205 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.922 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --success: oklch(0.792 0.209 151.711);     /* fleet-ui 補 */
  --success-foreground: oklch(0.145 0 0);
  --warning: oklch(0.828 0.189 84.429);
  --warning-foreground: oklch(0.145 0 0);
  --info: oklch(0.72 0.165 254.624);
  --info-foreground: oklch(0.145 0 0);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.556 0 0);
  --chart-1: oklch(0.87 0 0);
  --chart-2: oklch(0.556 0 0);
  --chart-3: oklch(0.439 0 0);
  --chart-4: oklch(0.371 0 0);
  --chart-5: oklch(0.269 0 0);
  --sidebar: oklch(0.205 0 0);
  --sidebar-foreground: oklch(0.985 0 0);
  --sidebar-primary: oklch(0.488 0.243 264.376);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.269 0 0);
  --sidebar-accent-foreground: oklch(0.985 0 0);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.556 0 0);
}
```

## 範例皮膚：office

暖紙底加墨藍 primary 的白天後台皮膚。

- 調性：白天後台；system 預設；hue 78 暖紙底、hue 262 墨藍 primary、hue 55/45 赭橘 accent、hue 155 success。卡片是純白，放在暖紙底上。
- 字體：Fraunces（`--font-display`，用於標題、品牌、頭像字母）+ IBM Plex Sans（`--font-body`）+ IBM Plex Mono（`--font-mono-face`）。
- radius：`0.5rem`。
- 以下是完整色票；語意色已依「所有表面都要過 AA」調整亮度，補上或調整的值已標註。

```css
:root {
  --background: oklch(0.9785 0.0038 78);
  --foreground: oklch(0.2 0.021 262);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.2 0.021 262);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.2 0.021 262);
  --primary: oklch(0.32 0.085 262);
  --primary-foreground: oklch(0.9785 0.0038 78);
  --secondary: oklch(0.945 0.008 78);
  --secondary-foreground: oklch(0.25 0.03 262);
  --muted: oklch(0.945 0.007 78);
  --muted-foreground: oklch(0.465 0.018 262);
  --accent: oklch(0.917 0.045 55);
  --accent-foreground: oklch(0.32 0.075 45);
  --destructive: oklch(0.51 0.19 26);        /* 常見值 0.551 在灰底淡底 fail，調暗 */
  --success: oklch(0.45 0.135 155);          /* 常見值 0.6 亮色 fail（白底 3.71 / 淡底 3.12），調暗 */
  --success-foreground: oklch(0.98 0.02 155);
  --warning: oklch(0.48 0.14 70);            /* fleet-ui 補 */
  --warning-foreground: oklch(0.9785 0.0038 78);
  --info: oklch(0.46 0.12 230);
  --info-foreground: oklch(0.9785 0.0038 78);
  --border: oklch(0.884 0.009 78);
  --input: oklch(0.884 0.009 78);
  --ring: oklch(0.55 0.075 262);
  --chart-1: oklch(0.32 0.085 262);
  --chart-2: oklch(0.6 0.14 45);
  --chart-3: oklch(0.556 0 0);
  --chart-4: oklch(0.439 0 0);
  --chart-5: oklch(0.269 0 0);
  --radius: 0.5rem;
  --sidebar: oklch(0.9575 0.0065 78);
  --sidebar-foreground: oklch(0.2 0.021 262);
  --sidebar-primary: oklch(0.32 0.085 262);
  --sidebar-primary-foreground: oklch(0.9785 0.0038 78);
  --sidebar-accent: oklch(0.917 0.045 55);
  --sidebar-accent-foreground: oklch(0.32 0.075 45);
  --sidebar-border: oklch(0.877 0.009 78);
  --sidebar-ring: oklch(0.55 0.075 262);
}

.dark {
  --background: oklch(0.19 0.018 262);
  --foreground: oklch(0.955 0.006 78);
  --card: oklch(0.235 0.02 262);
  --card-foreground: oklch(0.955 0.006 78);
  --popover: oklch(0.235 0.02 262);
  --popover-foreground: oklch(0.955 0.006 78);
  --primary: oklch(0.78 0.06 262);
  --primary-foreground: oklch(0.19 0.018 262);
  --secondary: oklch(0.29 0.02 262);
  --secondary-foreground: oklch(0.955 0.006 78);
  --muted: oklch(0.29 0.02 262);
  --muted-foreground: oklch(0.68 0.015 262);
  --accent: oklch(0.34 0.05 55);
  --accent-foreground: oklch(0.9 0.05 65);
  --destructive: oklch(0.74 0.191 22.216);   /* shadcn 原值 0.704，muted 上淡底 fail，調亮 */
  --success: oklch(0.72 0.135 155);          /* 常見值 0.7，muted 上淡底 fail，調亮 */
  --success-foreground: oklch(0.19 0.03 155);
  --warning: oklch(0.74 0.14 70);            /* fleet-ui 補 */
  --warning-foreground: oklch(0.19 0.018 262);
  --info: oklch(0.73 0.12 230);
  --info-foreground: oklch(0.19 0.018 262);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.6 0.06 262);
  --chart-1: oklch(0.78 0.06 262);
  --chart-2: oklch(0.72 0.13 45);
  --chart-3: oklch(0.556 0 0);
  --chart-4: oklch(0.371 0 0);
  --chart-5: oklch(0.269 0 0);
  --sidebar: oklch(0.215 0.02 262);
  --sidebar-foreground: oklch(0.955 0.006 78);
  --sidebar-primary: oklch(0.78 0.06 262);
  --sidebar-primary-foreground: oklch(0.19 0.018 262);
  --sidebar-accent: oklch(0.34 0.05 55);
  --sidebar-accent-foreground: oklch(0.9 0.05 65);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.6 0.06 262);
}
```

## 局部皮膚

同一個產品的多個 app（例如使用者端和管理端）結構相同、皮膚只差主色時，不必重新設計整套皮膚。共用的 tokens 放在 ui 套件，各 app 只覆寫主色相關的 token。

**必須一起覆寫的最小集合**（亮、暗兩組都要寫）：

| token | 原因 |
|---|---|
| `--primary` | 主色本身 |
| `--primary-foreground` | 放在主色上的文字；主色換了亮度，它不一定還過得了對比 |
| `--ring` | focus 環；不改的話，focus 時會冒出舊主色 |
| `--sidebar-primary` | sidebar 的品牌方塊與選取項目；sidebar 用的是自己這一組 token，不會跟著 `--primary` 變 |
| `--sidebar-primary-foreground` | 同上，放在 `--sidebar-primary` 上的文字 |
| `--chart-1` | 既有規則：第一個圖表色 = primary |

只改其中一部分，畫面就會混著兩種主色（最常見的是 focus 環和 sidebar 品牌方塊還是舊色）。

**不要覆寫的**：中性面（background、card、muted、border…）、語意色（success、warning、info、destructive）、radius、字體。這些一動就不再是「局部」，而是另一套皮膚，請改照「皮膚設計方法」完整設計。

```css
/* apps/admin/src/app.css —— 接在 @import "@acme/ui/globals.css" 之後 */
:root {
  --primary: oklch(0.46 0.17 285);
  --primary-foreground: oklch(0.985 0 0);
  --ring: oklch(0.46 0.17 285 / 60%);
  --sidebar-primary: oklch(0.46 0.17 285);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --chart-1: oklch(0.46 0.17 285);
}
.dark {
  --primary: oklch(0.78 0.12 285);
  --primary-foreground: oklch(0.18 0.03 285);
  --ring: oklch(0.78 0.12 285 / 60%);
  --sidebar-primary: oklch(0.78 0.12 285);
  --sidebar-primary-foreground: oklch(0.18 0.03 285);
  --chart-1: oklch(0.78 0.12 285);
}
```

**每一組都要跑對比**，亮、暗分開跑，所有承載文字的表面（background、card、sidebar、muted）都要驗：

```bash
# 實心：主色上的文字（按鈕、品牌方塊）
node scripts/contrast.mjs "<primary-foreground>" "<primary>"
node scripts/contrast.mjs "<sidebar-primary-foreground>" "<sidebar-primary>"
# 主色當文字（連結、text-primary、選取中的 tab）
node scripts/contrast.mjs "<primary>" "<surface>"
# 主色淡底（bg-primary/10–20 的選取列、badge），以 15% 驗證
node scripts/contrast.mjs "<primary>" "<primary>" "<surface>" 0.15
```

上面紫色範例的實測結果：亮色最低 5.55:1（muted 上的 15% 淡底）、暗色最低 5.41:1，全部 `AA=pass`。

區分兩個 app 的主色，除了美觀，常常也是安全需求：例如同一個人會在「能發佈的管理端」和「任何人上傳內容都可能冒充的使用者端」之間切換時，主色要讓他一眼分得出現在在哪一端。這種情況下建議兩個主色的 hue 明顯不同（例如相差 60° 以上），不要只差亮度。

## 何時選哪種調性

- 使用者長時間盯著畫面、資料密集、以數字與圖形為主（行情、監控、地圖） → **cockpit 類**。
- 以表單、簽核、清單為主，多角色在白天辦公使用 → **office 類**。
- 需要品牌個性（例如標題用 serif）但仍屬後台 → 從 office 類出發，換 hue。
- 同一個產品不要混用兩種調性；內部工具之間的差異應該只在 hue 與字體，不在結構。
- 兩者都不像時，照「皮膚設計方法」自行設計，並附上對比驗證結果。
