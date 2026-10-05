# 框架接入

token、元件配方、版面規則在 Next.js 與 React CSR 下**完全一樣**，差別只在下面這些接入點。

| 接入點 | Next.js (SSR / App Router) | React CSR (Vite) |
|---|---|---|
| 字體 | `next/font/google`，`variable` 輸出成 `--font-body` 等，掛在 `<html className>` | `@fontsource-variable/*` 在 `main.tsx` import，在 CSS 把字族名稱指給同名變數 |
| 主題防閃爍 | next-themes + `<html suppressHydrationWarning>`、`attribute="class"`、`disableTransitionOnChange` | `index.html` `<head>` 放 inline script 先寫入 `.dark`；runtime 仍可用 next-themes |
| client-only 元件（圖表、流程圖、地圖） | 在 `"use client"` 檔案裡 `dynamic(() => import(...), { ssr: false, loading })` | `React.lazy` + `<Suspense fallback>`，或直接 import |
| client 邊界 | 互動元件標 `"use client"`，盡量推到葉節點 | 不需要 |
| 依賴瀏覽器狀態的 UI | sidebar 開合用 cookie，由 server 讀取作為 `defaultOpen`；寬度用 localStorage，首次 render 先用預設值 | 直接讀 localStorage |
| 共用 UI 套件（monorepo） | 兩者相同，見「共用 UI 套件（monorepo）」：兩份 `components.json`、`baseUrl` + `paths`、`@source` | 同左，另需在 Vite 定義 `@` alias |
| 伺服器端頁面（錯誤頁、注入元件） | 兩者相同，見「伺服器端頁面（非 React）」：用 `scripts/tokens-css.mjs` 產生獨立 CSS | 同左 |

## Next.js (SSR)

**字體**（`app/layout.tsx`）：三個 `variable` 名稱要對上 `tokens.css` 的契約。只需要一種字體時，只設 `--font-body`，heading 會自動退回 body。

```tsx
import { Fraunces, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const display = Fraunces({ subsets: ["latin"], variable: "--font-display" });
const body = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-body" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono-face" });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant" suppressHydrationWarning
      className={`${display.variable} ${body.variable} ${mono.variable} h-full antialiased`}>
      <body className="min-h-full"><Providers>{children}</Providers></body>
    </html>
  );
}
```

Google Fonts 的中文字型檔案很大，web font 只載入 Latin 字型即可；中文由 `tokens.css` 的 CJK fallback（PingFang TC / Microsoft JhengHei / Noto Sans TC）負責。

**主題**（`components/providers.tsx`）：

```tsx
"use client";
import { ThemeProvider } from "next-themes";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      {children}
    </ThemeProvider>
  );
}
```

`defaultTheme` 依皮膚調性決定：cockpit 類用 `"dark"`，office 類用 `"system"`。

**client-only 元件**：圖表、流程圖、地圖這類元件會存取 `window` 或 canvas，要關掉 SSR，並給一個和實際內容同高的 Skeleton。App Router 不允許在 Server Component 裡使用 `ssr: false`，所以這個包裝必須放在獨立的 `"use client"` 檔案，頁面再 import 這個包裝即可（頁面本身仍可以是 server component）。

```tsx
// components/flow/instance-graph-lazy.tsx
"use client";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const InstanceGraph = dynamic(() => import("@/components/flow/instance-graph"), {
  ssr: false,
  loading: () => <Skeleton className="h-[26rem] w-full" />,
});
```

**client 邊界**：layout、頁框、靜態文字保持 server component；只有真正需要 state 或事件的元件才標 `"use client"`，而且盡量放在葉節點，不要整頁標。

**sidebar 開合狀態**：shadcn Sidebar 會把開合狀態寫進 `sidebar_state` cookie。有 server 的部署可以在 layout 讀取它，避免首屏先展開再收合：

```tsx
import { cookies } from "next/headers";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const defaultOpen = (await cookies()).get("sidebar_state")?.value !== "false";
  return <SidebarProvider defaultOpen={defaultOpen}>{children}</SidebarProvider>;
}
```

**`output: "export"`（靜態匯出）**：仍依本節處理字體與 `dynamic`，但因為沒有 server 可讀 cookie，sidebar 一律從預設值開始，由 client 端在掛載後同步狀態。

## React CSR (Vite)

### 已驗證的版本組合

`@vitejs/plugin-react` 的大版本綁定 Vite 的大版本，配錯時 install 會出現 peer dependency 警告，dev server 也可能起不來。

| vite | @vitejs/plugin-react | @tailwindcss/vite | 狀態 |
|---|---|---|---|
| `^7` | `^5` | `^4` | 已在實際專案驗證（vite 7.3、plugin-react 5.2、tailwind 4.3） |
| `^8` | `^6` | `^4` | plugin-react 6 的 peer 要求 vite `^8` |

既有 repo 的 Vite 版本先不要動，選對應的 plugin-react 版本即可。

**字體**：用 fontsource 套件載入，再把字族名稱指給同名變數。

```bash
npm i @fontsource-variable/inter @fontsource-variable/jetbrains-mono
```

```ts
// src/main.tsx
import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";
```

```css
/* globals.css，接在 tokens.css 內容之後 */
:root {
  --font-body: "Inter Variable";
  --font-mono-face: "JetBrains Mono Variable";
  /* 需要 serif 標題時再加 --font-display */
}
```

少了這一步，`--font-body` 沒有值，畫面就會退回瀏覽器預設字體。

**主題防閃爍**：React 掛載前，先用 `index.html` 的 inline script 寫入 `.dark`。key 沿用 next-themes 預設的 `theme`，這樣 runtime 改用 next-themes 時狀態能對上。

```html
<head>
  <script>
    (function () {
      try {
        // storage 的值一律「白名單比對」，只拿來和固定字串比較，絕不直接套用
        //（不要改成 classList.add(t)、innerHTML 或拼進 URL）：同 origin 的任何頁面都能改寫它。
        // 與不可信內容（使用者上傳的頁面、第三方 script）同 origin 的應用，不得在 storage 存放敏感資料。
        var t = localStorage.getItem("theme") || "dark"; // office 類改成 "system"
        var dark = t === "dark" || (t === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
        document.documentElement.classList.toggle("dark", dark);
      } catch (e) {}
    })();
  </script>
</head>
```

runtime 可以直接用 next-themes（它不依賴 Next），設定與上一節相同。

**重型元件**：

```tsx
import { lazy, Suspense } from "react";
const InstanceGraph = lazy(() => import("./components/flow/instance-graph"));

<Suspense fallback={<Skeleton className="h-[26rem] w-full" />}>
  <InstanceGraph />
</Suspense>
```

**瀏覽器狀態**：sidebar 開合、寬度、工作區分頁都可以直接從 localStorage 初始化，不會有 hydration 問題。

## 共用 UI 套件（monorepo）

多個前端共用一份元件時，把 shadcn 元件、`cn()`、hooks 和 `globals.css` 放進一個 workspace 套件（以下用 `@acme/ui` 代稱），各 app 只放自己的頁面與皮膚覆寫。這個結構有兩類錯誤會**靜默發生**：shadcn CLI 把 import 路徑寫錯，以及 Tailwind 沒掃描到元件的 class。兩者都不會報錯，只會在畫面或 build 後才發現。

```
packages/ui/
  components.json            ← 在這裡執行 shadcn add
  package.json               ← exports 對外的路徑
  tsconfig.json              ← baseUrl + paths（shadcn CLI 靠它解析 alias）
  src/components/  src/hooks/  src/lib/utils.ts
  src/styles/globals.css     ← tokens + @source "../"
apps/admin/  apps/web/
  components.json            ← hooks / utils / ui 指向 @acme/ui
  tsconfig.json + vite.config.ts   ← 定義 @ alias
  src/app.css                ← @import "@acme/ui/globals.css" + @source "./" + 皮膚覆寫
```

**`packages/ui/package.json`**：用 `exports` 讓 app 以 `@acme/ui/...` 引用原始碼（不需要 build 步驟）。

```json
{
  "name": "@acme/ui",
  "private": true,
  "type": "module",
  "exports": {
    "./globals.css": "./src/styles/globals.css",
    "./components/*": "./src/components/*.tsx",
    "./lib/*": "./src/lib/*.ts",
    "./hooks/*": "./src/hooks/*.ts"
  }
}
```

**`packages/ui/tsconfig.json`**：`baseUrl` 和 `paths` **兩個都要寫**。只寫 `paths` 時 shadcn CLI 解析不到 alias，會把 `@acme/ui/lib/utils` 當成 npm 套件名稱，產生出 `import { cn } from "cn"`，而且每個元件都錯，甚至可能順手把一個叫 `cn` 的 npm 套件裝進 dependencies。

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@acme/ui/*": ["./src/*"] }
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"]
}
```

**`packages/ui/components.json`**：所有 alias 都指向套件自己。

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "radix-nova",
  "rsc": false,
  "tsx": true,
  "tailwind": { "config": "", "css": "src/styles/globals.css", "baseColor": "neutral", "cssVariables": true },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@acme/ui/components",
    "ui": "@acme/ui/components",
    "utils": "@acme/ui/lib/utils",
    "lib": "@acme/ui/lib",
    "hooks": "@acme/ui/hooks"
  }
}
```

**app 的 `components.json`**：app 自己的元件放 `@/components`，但 `ui`、`utils`、**`hooks`** 都指向 ui 套件。`hooks` 如果寫成 `"@/hooks"`，而 app 又沒有定義 `@` alias，shadcn 會把 `use-mobile.ts` 寫進字面上名為 `apps/admin/@/hooks/` 的目錄。

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "radix-nova",
  "rsc": false,
  "tsx": true,
  "tailwind": { "config": "", "css": "../../packages/ui/src/styles/globals.css", "baseColor": "neutral", "cssVariables": true },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@/components",
    "lib": "@/lib",
    "ui": "@acme/ui/components",
    "utils": "@acme/ui/lib/utils",
    "hooks": "@acme/ui/hooks"
  }
}
```

**app 的 `@` alias**：tsconfig 和 Vite 都要定義，兩者缺一不可（tsconfig 給型別檢查與 shadcn CLI，Vite 給 bundle）。

```json
// apps/admin/tsconfig.json
{ "compilerOptions": { "baseUrl": ".", "paths": { "@/*": ["./src/*"] } } }
```

```ts
// apps/admin/vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
});
```

**Tailwind v4 的 `@source`**：v4 只掃描 CSS 所在專案的檔案，而且會略過 `node_modules`。ui 套件在 app 看來是 `node_modules` 裡的 symlink，所以元件的 class **不會被掃描到**：畫面沒有樣式，build 也不會報任何錯。ui 套件和每個 app 都要明確宣告自己的來源：

```css
/* packages/ui/src/styles/globals.css */
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";
@source "../";          /* 相對於這個 CSS 檔，指向 packages/ui/src */
/* …接著是 tokens.css 的內容 */
```

```css
/* apps/admin/src/app.css（在 main.tsx import 這一份） */
@import "@acme/ui/globals.css";
@source "./";           /* app 自己的 src */
/* …接著是這個 app 的皮膚覆寫（見 skin-design.md「局部皮膚」） */
```

**新增元件**：在 ui 套件裡執行（`pnpm --filter @acme/ui exec shadcn add button`，或 `cd packages/ui && pnpm dlx shadcn@latest add button`）；只有 app 專屬的元件才在 app 裡執行。

**每次 `shadcn add` 之後的檢查**（三個指令都應該**沒有輸出**）：

```bash
grep -rnE 'from "(cn|@/lib/utils|@/hooks/[^"]*)"' packages/ui/src   # 路徑被寫成套件名或 app 的 @
find apps -path '*/@/*' -not -path '*/node_modules/*'               # 被寫進字面上的 @/ 目錄
grep -n '"cn"' packages/ui/package.json                              # 被誤裝的 cn 套件
```

**build 後的檢查**（確認 `@source` 生效）：挑一個只在 ui 套件裡出現的 class 或變數，例如 sidebar 的 `--sidebar-width`：

```bash
pnpm --filter admin build && grep -c "sidebar-width" apps/admin/dist/assets/*.css   # 應 ≥ 1
```

結果是 0，代表 ui 套件的 class 沒有被產生，先檢查 `@source`。

## 伺服器端頁面（非 React）

有些頁面載入不了 app 的 CSS：伺服器直接送出的錯誤頁、維護頁，或注入到第三方頁面的浮動按鈕。這些頁面**不能手抄色碼**，那等於在另一處另存一份和 token 重複的值（違反禁忌），換皮膚時一定會漏改。

改用 `scripts/tokens-css.mjs`，從 tokens（加上該 app 的皮膚覆寫）產生一份獨立的 CSS。輸出只包含兩組變數：`:root`（亮色）和 `@media (prefers-color-scheme: dark)`（暗色）。它不依賴 Tailwind，也不依賴 `.dark` class，因為這類頁面沒有 runtime 去切換 class。

```bash
# 依序讀入，後面的檔案逐一覆寫前面的同名 token；--only 只輸出頁面用到的 token
node scripts/tokens-css.mjs packages/ui/src/styles/globals.css apps/admin/src/app.css \
  --only background,foreground,card,muted-foreground,primary,primary-foreground,ring,font-body \
  > apps/server/src/tokens.generated.css
```

- 腳本只輸出、不新增：token 名稱和輸入完全相同。頁面裡用 `var(--primary)`、`var(--primary-foreground)`，不要自創 `--on-primary` 這類別名。
- `--only` 列了不存在的名稱會直接失敗（exit 2），避免拼錯後畫面靜默少一個顏色。
- 產生的檔案放進 build 流程（例如 `prebuild` script），或 commit 進 repo 並在 CI 比對是否過期：`node scripts/tokens-css.mjs … | diff - tokens.generated.css`。
- 頁面本身的版面照 `pattern-pages.md` 的「獨立頁」：置中卡片、一句說明、一個主要操作。字體用 `var(--font-body)` 加上 CJK fallback。
- 注入到第三方頁面的元件，變數要放在自己的根元素（或 Shadow DOM 的 `:host`）而不是 `:root`，避免和宿主頁面互相覆寫；把輸出中的 `:root` 換成該選擇器即可。

## 共通規則

- **不要因為 mounted 狀態而 render 不同的 DOM**。theme 切換鈕的 icon 用純 CSS 切換，兩種框架都不會閃：

  ```tsx
  <Button variant="ghost" size="icon" onClick={toggle} aria-label="切換主題">
    <Moon className="size-4 dark:hidden" />
    <Sun className="hidden size-4 dark:block" />
  </Button>
  ```

- 圖表色從 CSS 變數讀取（`getComputedStyle`，見 `components.md`），主題切換時重建；不要在 JS 裡另存 rgba。
- `@custom-variant dark (&:is(.dark *));` 已在 `tokens.css` 裡，兩種框架都用 `.dark` class 策略，不用 `media`。
- 路由無關：工作區外殼（`pattern-workspace.md`）的 view registry 在 Next App Router 與 React Router 下的做法一樣，只有「seed 分頁」的入口不同（Next 是 `page.tsx`，React Router 是 route element）。
