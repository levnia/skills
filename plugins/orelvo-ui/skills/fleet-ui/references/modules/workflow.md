# 選配模組：流程簽核

> **啟用條件**：做簽核、審批、流程圖（檢視或編輯）、表單建構器、稽核軌跡時才讀；**版本審核、發佈、上下架這類有狀態機的流程也算**（例如「上傳 → 審核 → 發佈 → 上下架」）。判斷方法：資料的狀態會因為某個人的決策而轉換，就不是一般 CRUD。只有新增、編輯、刪除的管理頁不需要讀這份。

## 共通語意：虛線與實線

整個模組共用一條視覺規則：**實線 = 已發生**，**虛線 = 尚未發生或預計**。流程圖節點、連線、預計區塊、drop zone、「僅顯示部分」的提示都遵守這條規則，讓使用者一眼分辨「事實」與「推測」。

## 狀態 badge

所有狀態集中在一個 `STATUS_META` 對應表，元件只依狀態取 label 與 class：

| 狀態 | label | class |
|---|---|---|
| `running` | 進行中 | `border-transparent bg-accent text-accent-foreground` |
| `done` | 已完成 | `border-transparent bg-success/15 text-success` |
| `published` | 已上架 | `border-transparent bg-success/15 text-success` |
| `failed` | 已失敗 | `border-transparent bg-destructive/10 text-destructive` |
| `draft` | 草稿 | `variant="outline"` |
| 未知狀態 | 顯示原字串 | `variant="outline"`，不上色 |

```tsx
<Badge variant="outline" className={STATUS_META[status]?.className}>{STATUS_META[status]?.label ?? status}</Badge>
```

待辦類型可以用不同 variant 區分：待簽核 `variant="default"`、待補件 `variant="secondary"`。

## 決策按鈕

| 動作 | label | variant |
|---|---|---|
| approve | 核准 | `default` |
| reject | 駁回 | `destructive`（淡色） |
| back | 退回 | `outline` |
| 其他（escalate…） | 升級等 | `secondary` |

- 決策按鈕放在詳情頁標題列右側，順序是「核准 → 退回 → 駁回」，最常用的放最左邊。
- 駁回與退回要求填寫原因（Textarea 必填），在 Dialog 中完成。
- 已經決策過或沒有權限時，**隱藏**決策按鈕，改顯示目前狀態。

## 流程圖節點（檢視）

```ts
const NODE_STATE = {
  current: "border-primary bg-primary/10 text-foreground shadow-sm ring-2 ring-primary/40",
  walked:  "border-primary/50 bg-primary/5 text-foreground",
  pending: "border-dashed border-border/70 bg-muted/20 text-muted-foreground",
};
// 節點本體：flex min-w-[9rem] max-w-[13rem] flex-col gap-1 rounded-md border px-3 py-2 text-xs
// 類型標籤：text-[0.625rem] uppercase tracking-wide opacity-70
// 重訪次數：rounded-sm bg-foreground/10 px-1 font-mono text-[0.625rem]，顯示 ×N（例如 ×2）
// 預計區塊：rounded-sm border border-dashed border-current/40 px-1.5 py-1 text-[0.625rem] opacity-80
```

- **連線**：類型 `smoothstep`，轉角半徑 8；走過的連線用 `stroke: var(--color-primary)`、`strokeWidth: 2` 實線；尚未走的用 `strokeDasharray: "4 4"`、`opacity: 0.55`；箭頭 `ArrowClosed`。
- **畫布**：`h-[26rem] w-full overflow-hidden rounded-lg border border-border/60 bg-background`，點狀背景（gap 16、size 1）。
- 流程圖元件是 client-only，SSR 下用 `dynamic(…, { ssr: false })` 並給同高 Skeleton；這段 `dynamic` 呼叫必須寫在 `"use client"` 檔案裡（見 `framework-setup.md`）。
- 顏色從 CSS 變數讀取，不在 JS 另存色碼。

## 流程圖編輯器

- 節點形狀依類型（BPMN 風格）：開始 = 圓形、結束 = 粗框圓形、表單/關卡/會簽 = 圓角矩形、分支 = 菱形、動作 = 直角矩形。
- 角落用 icon 標示類型（FileText 表單、UserCheck 關卡、Users 會簽、Cog 動作）。
- 驗證不通過的節點：`border-destructive bg-destructive/5`，右上角放錯誤數量的小圓點 `size-4 rounded-full bg-destructive text-background text-[0.5rem]`（小圓點是狀態指示，不是按鈕，因此不違反「destructive 不用實心」的按鈕規則）。
- 版面：`grid gap-4 lg:grid-cols-[10rem_minmax(0,1fr)_16rem]`（元件盤 | 畫布 | 屬性面板）。

## 會簽進度

```tsx
<div className="flex flex-col gap-3 rounded-lg border border-border/70 bg-muted/30 p-4">
  <div className="flex items-center justify-between gap-3">
    <span className="text-sm font-medium">會簽進度</span>
    {pending && <Badge variant="secondary">等待其他簽核人</Badge>}
  </div>
  <Progress value={percent} aria-label="核准進度" />
  <div className="flex flex-wrap items-center gap-2 text-xs">
    {/* 各決策的計數 badge：核准 default、駁回 destructive、退回 outline */}
    <span className="text-muted-foreground">共 {total} 位簽核人</span>
  </div>
</div>
```

## 稽核軌跡

```tsx
<ol className="flex flex-col gap-2">
  <li className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-border/60 px-3 py-2 text-sm">
    <span className="font-medium break-words">{from} → {to}</span>
    <Badge variant="outline">{handle ?? "自動"}</Badge>
    <span className={actor ? "text-muted-foreground" : "text-muted-foreground italic"}>{actor ?? "系統"}</span>
    <time className="ms-auto font-mono text-xs text-muted-foreground">{at}</time>
  </li>
</ol>
```

- 由舊到新排列；系統自動執行的步驟 actor 顯示「系統」並用斜體。
- 只顯示部分紀錄時，最上方放虛線提示：`rounded-md border border-dashed border-border/70 bg-muted/40 px-3 py-2 text-sm text-muted-foreground`。
- 「即時預覽」與「凍結快照」要在視覺上有明顯區別（例如快照加上時間戳與 `outline` badge「快照」）。

## 表單建構器

版面用 container query，因為建構器常被放在分割後的窄窗格裡：

```tsx
<div className="@container">
  <div className="grid grid-cols-1 gap-4 @min-[680px]:grid-cols-[220px_minmax(0,1fr)] @min-[940px]:grid-cols-[220px_minmax(0,1fr)_320px]">
    <FieldPalette />   {/* 欄位元件盤 */}
    <Canvas />         {/* 表單畫布 */}
    <PropertyPanel />  {/* 屬性面板：窄時落到下方 */}
  </div>
</div>
```

- 元件盤項目：`rounded-lg border border-border px-2.5 py-2 text-sm hover:bg-muted`。
- 畫布中被選取的欄位：`rounded-lg border px-3 py-2`，選中 `border-primary bg-primary/5`，未選中 `border-border hover:bg-muted`。
- drop zone：`border border-dashed border-border p-4 text-center text-sm text-muted-foreground`，拖曳經過時 `bg-primary/10`。
- 預覽模式與編輯模式要明顯區分；預覽中的提示文字用 `text-xs text-warning`。
