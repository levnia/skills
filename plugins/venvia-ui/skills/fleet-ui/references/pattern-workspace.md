# 工作區外殼

fleet 系列應用共用同一個外殼：可收合、可拖寬的 sidebar，一條 header，加上以 Chrome 式分頁組成的工作區（最多兩個窗格並排）。外殼只負責「框」；框裡的頁面怎麼排，見 `pattern-pages.md`。

## 結構

```
SidebarProvider  style={{ "--sidebar-width": width }}   ← 寬度可拖 180–420px，存 localStorage
├ Sidebar collapsible="icon"
│   SidebarHeader : 品牌方塊 size-8 rounded-lg bg-primary text-primary-foreground + 名稱 / 副標 text-xs text-muted-foreground
│   SidebarContent: 分組導覽（SidebarGroup + SidebarMenu gap-1）；沒有權限的項目「隱藏」，不是 disabled
│   SidebarFooter : NavUser（頭像 size-8 rounded-lg + 名稱 + ChevronsUpDown；DropdownMenu side="top"）
├ SidebarResizeHandle   fixed inset-y-0 z-20 w-1 cursor-col-resize transition-colors hover:bg-sidebar-border
└ SidebarInset          h-svh min-w-0 overflow-hidden
    header   flex h-14 shrink-0 items-center gap-2 border-b px-4
             SidebarTrigger -ml-1 ・ 情境內容（標題、跑馬燈…）・ ml-auto 右側 ghost icon 按鈕（分割、主題）
    main     min-h-0 flex-1 → WorkspaceShell（1–2 個窗格）
    footer   （選用）flex h-8 shrink-0 items-center justify-between border-t px-4 text-xs text-muted-foreground
```

- 整個外殼是 `h-svh overflow-hidden`，只有窗格內容會捲動。
- sidebar 快捷鍵沿用 shadcn 的 `b`。
- 導覽中「即將推出」的項目：如果使用者需要知道它存在，就用 `opacity-50 pointer-events-none` 加 tooltip；如果是權限不足，就直接隱藏，而且整組都被隱藏時連組標題也一起拿掉。

## 統一尺寸

| 元素 | 值 |
|---|---|
| header 高 | `h-14` |
| sidebar 預設寬 | `16rem`（導覽很短的產品可設 `11rem`）；icon 模式 `3rem`；手機 `18rem` |
| sidebar 拖曳範圍 | 180–420px |
| 分頁列 | `h-10` |
| 分頁 | `h-9 min-w-[112px] text-[13px]` |
| 窗格內容內距 | `p-6` |
| footer（選用） | `h-8 text-xs` |

## Chrome 式分頁

分頁列放在每個窗格頂端。active 分頁與內容區同色，下緣用兩個凹角「外彎」接到底線上，看起來像瀏覽器分頁。

```tsx
// 分頁列
<div className={cn("flex h-10 shrink-0 items-end border-b", focused ? "bg-muted/60" : "bg-muted/30", isOver && "bg-primary/10")}>
  <div role="tablist" className="flex min-w-0 flex-1 items-end gap-1 overflow-x-auto px-2">{tabs}</div>
</div>

// 單一分頁：role="tab" + 可聚焦，Enter/Space 啟用，←/→ 在分頁間移動
<div role="tab" aria-selected={active} tabIndex={active ? 0 : -1}
  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); activate(); } }}
  className={cn(
  "group relative -mb-px flex h-9 min-w-[112px] cursor-pointer select-none items-center justify-between gap-2 rounded-t-lg px-3 text-[13px]",
  active ? "z-10 bg-background text-foreground" : "text-muted-foreground hover:bg-muted/70",
  isDragging && "opacity-0",
)}>
  {active && (
    <>
      <span className="pointer-events-none absolute bottom-0 -left-2 size-2 [background:radial-gradient(circle_at_0_0,transparent_8px,var(--background)_8px)]" />
      <span className="pointer-events-none absolute -right-2 bottom-0 size-2 [background:radial-gradient(circle_at_100%_0,transparent_8px,var(--background)_8px)]" />
    </>
  )}
  <span className="truncate">{title}</span>
  <button className={cn("rounded-full p-0.5 opacity-0 hover:bg-muted-foreground/20 group-hover:opacity-100 focus-visible:opacity-100", active && "opacity-100")}
    aria-label="關閉分頁">
    <X className="size-3" />
  </button>
</div>
```

- 分頁要能用鍵盤操作（`focus-visible:ring-3 focus-visible:ring-ring/50`）；關閉鈕是獨立的 `<button>`，不要把整個分頁包成 button（button 不能巢狀）。
- 凹角一律用上面這種 Tailwind 行內 radial-gradient 寫法，不另寫 CSS class 或 mask。
- 拖曳排序與跨窗格移動用 `@dnd-kit`；拖曳中的浮層為 `flex h-9 items-center rounded-t-lg border border-border bg-background px-3 text-[13px] font-medium shadow-lg`。
- 分頁過多時橫向捲動，右側放一個溢出選單（`Ellipsis` icon）列出全部分頁。

## 窗格與分割

- 用 `react-resizable-panels`，最多兩個窗格水平並排，預設 50/50，每個窗格至少 20%。
- 分隔線：`w-1 shrink-0 cursor-col-resize bg-border transition-colors hover:bg-primary`。
- 窗格：`flex h-full flex-col` → 分頁列 → 內容 `min-h-0 flex-1 overflow-auto p-6`。
- 目前聚焦的窗格，分頁列底色較深（`bg-muted/60`，未聚焦為 `bg-muted/30`）。
- header 右側的分割按鈕在分割狀態時加 `text-primary`。

## 路由與 view registry

- 路由檔只負責把對應的 view「種」進工作區：Next 的 `page.tsx` 只渲染 `<RouteSeeder href="/inbox" />`，然後回傳 null。
- 實際畫面由 view registry（`lib/views.tsx`，以 href 為 key）渲染；工作區狀態（窗格、分頁、active）存在 zustand，並持久化到 localStorage。
- 分頁 id 需要帶參數時用 `::` 分隔（例如 `/stock::2330`），因此 href 本身**禁止**包含 `::` 與 `|`。
- 切換分頁時 view 要用 `key={href}` 重新掛載，避免不同分頁之間共用 state。

## 窄螢幕

- 768px 以下（`useIsMobile`）：sidebar 改成 Sheet（shadcn 預設行為）；分割按鈕隱藏（`hidden md:inline-flex`）；只顯示一個窗格。
- 窗格內的版面用 container query，而不是 viewport breakpoint，因為分割後窗格可能很窄：

  ```tsx
  <div className="@container">
    <div className="grid grid-cols-1 gap-4 @min-[680px]:grid-cols-[220px_minmax(0,1fr)]">…</div>
  </div>
  ```

- header 裡的次要資訊（跑馬燈、說明文字）在窄螢幕隱藏（`hidden md:block`）。

## 不需要工作區的小型應用

內部小工具或只有 2–3 頁的應用，可以只保留 sidebar + header，省略分頁與分割：`SidebarInset` 裡直接放 `<main className="min-h-0 flex-1 overflow-auto p-6">`，頁面規則照 `pattern-pages.md` 走。等頁面多到使用者需要同時開好幾個時，再升級成完整的工作區。
