# 選配模組：地圖

> **啟用條件**：畫面主體是 2D/3D 地圖或場景檢視器（Cesium、deck.gl、MapLibre…）時才讀。只是在頁面角落放一張小地圖時不需要。

## 核心原則：viewer 滿版，所有 chrome 浮動

地圖填滿整個內容區；工具列、面板、圖例、狀態列全部浮在地圖上，不佔版面高度。

```tsx
<div className="relative min-w-0 flex-1">
  <MapHost />   {/* absolute inset-0 */}
  <div className={isMapRoute
    ? "pointer-events-none absolute inset-0 z-10"     // 地圖頁：上層不擋滑鼠
    : "relative z-10 h-full overflow-y-auto bg-background"}>  // 一般頁：蓋住地圖
    {children}
  </div>
</div>
```

- 上層容器是 `pointer-events-none`，讓拖曳、縮放直接作用在地圖上；每個浮動元件自己加 `pointer-events-auto`，把滑鼠事件取回來。
- 切換到非地圖頁時，viewer 只用 `invisible` 隱藏，**不要 unmount**，重新初始化 3D 場景的代價很高。
- 地圖本身是 client-only 元件，SSR 下要用 `dynamic(…, { ssr: false })`，而且這段呼叫必須寫在 `"use client"` 檔案裡（見 `framework-setup.md`）。

## 浮動面板配方

| 元件 | class |
|---|---|
| 面板（圖層、檢視器、比較） | `pointer-events-auto absolute z-10 flex flex-col overflow-y-auto rounded-lg border bg-card/95 shadow-sm backdrop-blur` |
| 工具列 | `pointer-events-auto absolute z-10 flex items-center gap-1 rounded-lg border bg-card/90 p-1 shadow-sm backdrop-blur` |
| 工具按鈕 | `flex size-8 items-center justify-center rounded-md transition-colors`；選中 `bg-primary text-primary-foreground`；未選中 `hover:bg-accent` |
| 工具列分隔線 | `mx-0.5 h-5 w-px bg-border` |
| 面板標題 | `text-xs font-medium text-muted-foreground`，數量 `text-xs tabular-nums text-muted-foreground` |
| 圖例 | 面板配方 + `w-56`；標題列是可收合的按鈕 `px-3 py-2 text-xs font-medium hover:bg-accent/50`；色塊 `size-3.5 rounded-sm border` |

全部面板共用同一套配方，不另外加陰影、glow 或其他顏色。

## 錨點與尺寸

| 項目 | 值 |
|---|---|
| 邊距錨點 | `left-3` / `right-3` / `top-3`（3 的倍數）；上方有時間軸（`h-24`）時，面板改從 `top-28` 開始 |
| 面板往下堆疊 | 工具列在 `top-3`，面板從 `top-16` 開始 |
| 面板寬度檔位 | `w-56`（圖例）、`w-64`（圖層、變換）、`w-72`（檢視器、比較）、`w-80`（樣式面板、Sheet） |
| 面板高度上限 | `max-h-[calc(100%-7rem)]`，避開底部狀態列 |
| 右下控制（視角、指北針） | `right-3 bottom-14`，垂直排列 |

## z-order

| 層級 | 用途 |
|---|---|
| `z-10` | 面板、工具列、圖例、狀態列 |
| `z-20` | 面板開關按鈕、時間軸 |
| `z-40` | 選單的點擊攔截層（`fixed inset-0`） |
| `z-50` | 下拉選單、popover |

## 狀態列與 attribution

- 狀態列放在底部 `absolute inset-x-0 bottom-0 z-10`：`flex items-center gap-4 border-t bg-card/90 px-3 py-1 text-xs text-muted-foreground backdrop-blur`。
- **狀態列必須使用 token**，跟著主題切換；不要寫死 `bg-neutral-900`，亮色模式下會突兀。
- 座標、高度、FPS 等數字一律 `tabular-nums`。
- 資料來源的 attribution 必須清楚可讀；被狀態列蓋住時，用 CSS 把它往上推（例如 `bottom: 1.75rem`）。

## 窄螢幕

- `lg` 以下，右側的檢視器面板改成 `<Sheet side="right" className="w-80">`，由一個浮動按鈕開啟。
- 手機以檢視與簡單量測為主，隱藏編輯類工具。

## 地圖圖形色

- hover 高亮、量測線、選取框等「畫在地圖上」的顏色，與 UI token 分開管理，但要集中定義在一個檔案（例如 `map/colors.ts`），不要散落在各個工具裡。
- 圖形色要能在深色與淺色底圖上都看得清楚（通常加白色或黑色外框）。
