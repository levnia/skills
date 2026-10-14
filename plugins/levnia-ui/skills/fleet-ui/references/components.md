# 元件規則

元件的「長相」由 token 決定（見 `skin-design.md`），這份文件規定元件的**密度、配方與使用方式**。所有 class 字串都只引用語意 token，不直接寫 Tailwind 色階。

## 取得元件

- 一律用 `npx shadcn add <component>` 取得當下版本的 nova 元件，不要從別的專案複製舊檔，也不要自己手刻已有 primitive 的元件（popover、dropdown-menu、dialog、select、tooltip…）。
- nova 系列有兩種底層，class 配方完全相同，只有組合寫法不同：
  - **radix-nova**（Radix）：觸發元件用 `asChild`，例如 `<DropdownMenuTrigger asChild><Button …/></DropdownMenuTrigger>`。
  - **base-nova**（Base UI）：觸發元件用 `render={<Button … />}`。
- 動手前先看 `components.json` 的 `style`，確認專案用的是哪一種，不要混用。
- 取得後的預設 class 大多已符合下面的配方；需要調整時只改 className，不改元件內部結構。

## 密度

| 項目 | 規則 |
|---|---|
| 控制元件高度 | 預設 `h-8`；sm 與工具列 `h-7`；表格內操作 `h-6` |
| icon | 一般 `size-4`；緊湊元件內 `size-3.5`；分頁、chip 內 `size-3` |
| 字級 | 內文 `text-sm`；中繼資訊 `text-xs`；圖表軸線與微標籤 `text-[10px]`；分頁 `text-[13px]` |
| 字重 | 一般 `font-medium`；`font-semibold` 只給標題 |
| 間距 | 只用 2 / 3 / 4 / 6：控制列 `gap-2`、卡片網格 `gap-3` 或 `gap-4`、頁面區塊 `gap-6` |
| 卡片內距 | 一般 `p-4`（Card 預設 `--card-spacing` 4）；緊湊 `data-[size=sm]` 為 3；表格卡 `p-0`；圖表卡 `p-2` |

## 元件配方

| 元件 | 規則 | class |
|---|---|---|
| Card | 用 ring，不加 border、不加 shadow | `rounded-xl bg-card ring-1 ring-foreground/10` |
| 表格卡 | 內容貼邊；窄螢幕處理見「響應式表格」 | `<Card className="overflow-hidden p-0">` |
| Button：主要 | 每個區塊最多一個；表格裡的解讀見「列操作」 | `variant="default"` |
| Button：segmented | 選中用 default，未選中用 outline | `variant={active ? "default" : "outline"} size="sm"` |
| Button：destructive | 一律淡色，不用實心紅 | `bg-destructive/10 text-destructive hover:bg-destructive/20`（nova 預設即是） |
| Button：前往 | 尾端箭頭 | `<Button variant="outline" size="sm">查看<ArrowRight data-icon="inline-end" /></Button>` |
| Badge | pill；狀態用淡底實字 | `rounded-4xl` + `bg-success/15 text-success border-transparent` |
| Table | 數字欄靠右並對齊位數 | `<TableCell className="text-right tabular-nums">` |
| Table：ID | 等寬、弱化 | `font-mono text-xs text-muted-foreground` |
| Table：空值 | 顯示「—」 | `{value ?? "—"}` |
| 搜尋框 | 前置 icon | 外層 `relative`；icon `pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground`；Input `pl-8` |
| Tabs | 淺底膠囊 | List `rounded-lg bg-muted p-1`；active `data-active:bg-background data-active:shadow-sm` |
| Segmented（非按鈕） | 小型切換 | 容器 `flex items-center gap-0.5 rounded-md bg-muted p-0.5 text-xs`；項目 `rounded px-2 py-0.5`；active `bg-card font-medium text-foreground shadow-sm` |
| 陰影 | 只給浮層 | popover / menu `shadow-md`；拖曳中 `shadow-lg`；其他元件不加 |
| Focus | 全部互動元件一致 | `focus-visible:ring-3 focus-visible:ring-ring/50` |
| 按壓 | 按鈕微沉 | `active:translate-y-px`（nova 預設即是） |
| 隱藏操作 | hover 才顯示，鍵盤也要能看到 | `opacity-0 group-hover:opacity-100 focus-visible:opacity-100` |
| 停用 | 半透明且不可點 | `disabled:opacity-50 disabled:pointer-events-none` |
| 內嵌子面板 | 卡片裡的分組 | `rounded-md border border-border/60 p-3`；標題 `text-xs font-medium text-muted-foreground` |
| 狀態點 | 小圓點表示即時狀態 | `inline-block size-2 rounded-full bg-success`；即時資料加 `animate-pulse` |

## 列操作

「每個區塊最多一個 `default`」放到表格裡時這樣解讀：

- **列操作一律用 `outline` 或 `ghost`**。例如「查看」「預覽」「編輯」，每一列都有、也不急，所以不搶眼。
- **只有處於「需要你處理」狀態的那一列，它的主要動作才用 `default`**。例如待審核那一列的「核准」。整張表通常只有一兩列是這種狀態，所以實心按鈕在畫面上仍然稀少，視線會直接落在要處理的地方。
- 同一列最多一個 `default`。駁回、刪除、改回舊版這類有後果的動作，用淡色 destructive 或 `outline`，並先開 Dialog 確認；按鈕文字加上「…」，表示按了之後還會先問一次。
- 操作超過兩個時，保留最常用的一個按鈕，其餘收進 `ghost` icon 按鈕（`MoreHorizontal`）加 DropdownMenu。

```tsx
<TableCell className="text-right">
  <div className="flex justify-end gap-2">
    <Button variant="outline" size="sm">預覽</Button>
    {row.status === "pending" && (
      <>
        <Button size="sm">核准</Button>                                  {/* 需要你處理 → default */}
        <Button variant="destructive" size="sm" onClick={openReject}>駁回…</Button>
      </>
    )}
  </div>
</TableCell>
```

## 響應式表格

「表格卡 `p-0 overflow-hidden`」在手機寬度（約 390px）會把最右邊的操作欄切掉。表格雖然可以橫向捲動，但使用者看不出來，就變成按不到。規則：**操作欄永遠可見**。依欄位多寡擇一處理：

**做法一：`md` 以下改成卡片列表**（欄位多、每列資訊量大時）。

```tsx
<Card className="overflow-hidden p-0">
  <div className="hidden md:block">
    <Table>…</Table>
  </div>
  <ul className="divide-y md:hidden">
    {rows.map((r) => (
      <li key={r.id} className="flex flex-col gap-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate font-medium">{r.name}</span>
          <StatusBadge status={r.status} />
        </div>
        <div className="text-xs text-muted-foreground tabular-nums">{r.updatedAt}</div>
        <div className="flex justify-end gap-2">{/* 與表格相同的列操作 */}</div>
      </li>
    ))}
  </ul>
</Card>
```

**做法二：窄螢幕隱藏次要欄位**（欄位少、只多一兩欄時）。標頭和儲存格都要加，操作欄不加：

```tsx
<TableHead className="hidden md:table-cell">上傳時間</TableHead>
…
<TableCell className="hidden md:table-cell tabular-nums">{r.uploadedAt}</TableCell>
```

- 先決定哪些欄位可以隱藏（時間、ID、網址代稱這類輔助資訊），名稱、狀態、操作永遠保留。
- 三態（loading、empty、error）兩種版面都要有；卡片列表的 loading 用與卡片同高的 Skeleton。
- 真的必須橫向捲動時（例如權限矩陣），把操作欄或第一欄設成 `sticky`（`sticky right-0 bg-card`），並在右緣加漸層提示，讓使用者知道還有內容。

## 上傳（dropzone）

不要直接露出原生的 `<input type="file">`：它的按鈕文字跟著瀏覽器語系，中文介面裡會冒出「Choose File / No file chosen」，樣式也無法統一。改用虛線框的 dropzone：虛線剛好符合流程模組「虛線 = 尚未發生」的語意（檔案還沒上傳）。

```tsx
<label
  htmlFor="upload"
  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
  onDragLeave={() => setDragging(false)}
  onDrop={(e) => { e.preventDefault(); setDragging(false); pick(e.dataTransfer.files); }}
  className={cn(
    "flex cursor-pointer flex-col items-center gap-1 rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground transition-colors hover:bg-muted/50 focus-within:ring-3 focus-within:ring-ring/50",
    dragging && "border-primary bg-primary/5 text-foreground",
  )}
>
  <Upload className="size-5" />
  <span>拖曳檔案到這裡，或 <span className="font-medium text-primary">選擇檔案</span></span>
  <span className="text-xs">單一 .html 檔 · 上限 2 MB</span>
  <input id="upload" type="file" accept=".html,text/html" className="sr-only" onChange={(e) => pick(e.target.files)} />
</label>
{error && <p role="alert" className="text-xs text-destructive">{error}</p>}
```

- **拖曳中**：框線改成 `border-primary`、底色 `bg-primary/5`，讓使用者知道放開就會上傳。
- **檔案限制要事先寫出來**（類型、大小、數量），不要等上傳失敗才告訴使用者；用戶端先檢查一次，錯誤用 `role="alert"` 顯示在框下方。
- 原生 input 用 `sr-only` 隱藏而不是 `display:none`，鍵盤和螢幕閱讀器仍然可以操作；focus 時由 `focus-within` 在外框顯示 focus 環。
- **已選檔案**：框內改顯示檔名、大小和一個「移除」按鈕（`ghost`），上傳中顯示 `Loader2 animate-spin` 或 Progress。
- **不要用停用的上傳按鈕表示「尚未選擇檔案」**。停用狀態對比低，看起來像壞掉；應該在還沒選擇時就不顯示上傳按鈕，或改成選檔之後自動上傳。

## 通用資料展示

**KPI 卡**：label 在上、數字在中、差值在下。

```tsx
<Card className="p-4">
  <div className="text-sm text-muted-foreground">待辦事項</div>
  <div className="mt-1 font-mono text-2xl font-medium tabular-nums">{count}</div>
  <div className="text-xs text-muted-foreground">較昨日 {delta >= 0 ? "+" : ""}{delta}</div>
</Card>
```

- KPI 列用 `grid grid-cols-2 gap-3 lg:grid-cols-4`（最多 5 欄）。
- 可點擊的 KPI 或入口卡加 `cursor-pointer transition-colors hover:bg-muted/50`，並加上 `role="button" tabIndex={0}`，或直接改用 `<button>`。

**數字格式化**

- 把格式化函式集中在 `lib/format.ts`（例如 `pct`、`pctSigned`、`num`、`money`），元件裡不要寫 `toFixed`。
- 有正負之分的數值要帶 `+` 號；null 或 undefined 一律顯示「—」。
- 所有數字都加 `tabular-nums`，對齊用 `text-right`。

**圖表配色**：從 CSS 變數讀取，並在主題切換時重建。不要在 JS 裡另存一份色碼。

```ts
function chartColors() {
  const css = getComputedStyle(document.documentElement);
  const v = (name: string) => css.getPropertyValue(name).trim();
  return {
    series: [1, 2, 3, 4, 5].map((i) => v(`--chart-${i}`)),
    text: v("--muted-foreground"),
    grid: v("--border"),
  };
}
// 在 resolvedTheme 改變時重新呼叫 chartColors() 並重建或 applyOptions
```

圖表背景一律透明，讓 Card 的 `bg-card` 透出來。

## 三態

每個資料區塊都要**同時**處理 loading、empty、error 三種狀態，缺任何一個都算未完成。

**loading**：Skeleton 的高度要跟實際內容一樣，避免資料載入後版面跳動。

```tsx
{loading && (
  <div className="flex flex-col gap-3" aria-hidden>
    {[0, 1, 2].map((i) => <Skeleton key={i} className="h-9 w-full" />)}
  </div>
)}
```

**empty**：置中兩行，第一行說明現況，第二行告訴使用者下一步。

```tsx
{!loading && !error && items.length === 0 && (
  <div className="flex flex-col items-center gap-1 py-6 text-center">
    <p className="text-sm text-muted-foreground">目前沒有待辦</p>
    <p className="text-xs text-muted-foreground">有新的簽核或補件事項時，會顯示在這裡。</p>
  </div>
)}
```

**error**：用 `role="alert"`，訊息要能看懂，並附上重試。

```tsx
{error && (
  <div role="alert" className="flex items-center gap-2 text-sm text-destructive">
    <span>讀取失敗：{error.message}</span>
    <Button variant="outline" size="sm" onClick={retry}>重試</Button>
  </div>
)}
```

表格內的三態用 `<TableRow><TableCell colSpan={n} className="text-center …">` 包起來，放在同一個表格卡裡。

## 語意色使用

| 語意 | 淡底用法（badge、提示框） | 實心用法（少用） | 常見情境 |
|---|---|---|---|
| success | `bg-success/15 text-success` | `bg-success text-success-foreground` | 完成、已上架、正常 |
| warning | `bg-warning/15 text-warning` | `bg-warning text-warning-foreground` | 資料過期、偏空、需要注意 |
| info | `bg-info/15 text-info` | `bg-info text-info-foreground` | 提示、說明、進行中的系統訊息 |
| destructive | `bg-destructive/10 text-destructive` | 不使用 | 失敗、刪除、駁回、錯誤 |

- 提示框（callout）：`rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning`。
- **禁止**在元件裡直接寫色階（`text-emerald-500`、`bg-amber-900/40`、`text-yellow-500`…）。現有 token 不夠用時，先在 tokens 裡新增語意 token，並用 `scripts/contrast.mjs` 驗證對比，再拿來用。
- 只為單一主題設計的顏色（例如永遠深色的 status bar）也算違規；所有表面都要跟著主題切換。
