# 頁面原型

外殼（`pattern-workspace.md`）是容器；這份文件規定容器裡的頁面怎麼排。新增頁面時，先判斷它屬於哪一種原型，再照該節的結構寫。元件細節（KPI 卡、三態、語意色）見 `components.md`，這裡不重複。

## 共通規則

- **容器寬度依內容決定**：表單、設定頁用 `max-w-2xl`；一般頁用 `mx-auto w-full max-w-5xl`；資料密集頁（大表格、圖表、儀表板）不設上限。
- **標題區**：

  ```tsx
  <div className="flex items-start justify-between gap-4">
    <div>
      <h1 className="font-heading text-2xl font-semibold tracking-tight">人員管理</h1>
      <p className="mt-1 text-sm text-muted-foreground">管理可登入系統的帳號與其角色。</p>
    </div>
    <div className="flex shrink-0 items-center gap-2">{/* 頁面層級操作 */}</div>
  </div>
  ```

  首頁或重點頁可以用 `text-3xl`。
- **區塊間距**：頁面根元素用 `flex flex-col gap-6`；區塊標題 `h2 className="font-heading text-lg font-semibold tracking-tight"`。
- **每個資料區塊都要有三態**（見 `components.md`）。
- 頁面層級的主要操作最多一個 `default` 按鈕，其餘用 `outline` 或 `ghost`。

## 列表頁

用途：資料清單、待辦、目錄、搜尋結果。

結構（由上到下）：
1. 標題區（右側放「新增」等主要操作）
2. 工具列：`flex flex-wrap items-center gap-2`，搜尋框在左（`w-64`，前置 icon），篩選在中，次要操作靠右（`ml-auto`）
3. 表格卡：`<Card className="overflow-hidden p-0"><Table>…</Table></Card>`
4. 分頁或「載入更多」：`flex items-center justify-between text-sm text-muted-foreground`，左邊顯示總數，右邊放上一頁/下一頁

規則：
- 數字欄 `text-right tabular-nums`；ID 欄 `font-mono text-xs text-muted-foreground`；狀態欄用 Badge。
- 列操作放最右欄（`text-right`）：`<Button variant="outline" size="sm">查看<ArrowRight data-icon="inline-end" /></Button>`；多個操作時改用 `ghost` icon 按鈕 + DropdownMenu。
- 整列可點擊時，把名稱欄做成可聚焦的 `<Link>`（鍵盤使用者靠它進入詳情）；列上的 `onClick` + `cursor-pointer` 只是加大滑鼠點擊範圍。列內的按鈕要 `stopPropagation`。
- 三態放在表格內（`colSpan` 橫跨所有欄）。
- 手機寬度下操作欄必須可見：`md` 以下改卡片列表，或隱藏次要欄位（見 `components.md` 的「響應式表格」）。列操作的按鈕樣式見同一份文件的「列操作」。
- 有篩選條件時，empty 狀態要提示「清除篩選」。

## 詳情頁

用途：單筆資料、簽核單、使用者資料。

結構：
1. 標題區：h1 是名稱，下方一行放 mono ID 與狀態 Badge：`<div className="mt-1 flex items-center gap-2"><span className="font-mono text-xs text-muted-foreground">{id}</span><StatusBadge … /></div>`；操作按鈕固定在標題列右側
2. 內容分成多張 Card，每張 Card 一個主題（基本資料、關聯項目、歷程…）
3. 歷程或稽核軌跡放在最後

規則：
- key-value 用兩欄：

  ```tsx
  <dl className="grid grid-cols-[8rem_minmax(0,1fr)] gap-x-4 gap-y-2 text-sm">
    <dt className="text-muted-foreground">建立者</dt><dd>{creator}</dd>
  </dl>
  ```

- 資訊多、而且主要內容與輔助資訊明顯可分時，可用 `grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]`，右欄放摘要 Card。
- 找不到資料時整頁顯示 empty 狀態（說明加「返回列表」按鈕），不要留白。

## 表單／編輯頁

用途：新增、編輯單筆資料。

結構：
1. 標題區（「新增 X」／「編輯 X」）
2. 表單本體：`max-w-2xl`，放在一張 Card 裡，欄位間 `flex flex-col gap-4`
3. 底部操作列：`flex justify-end gap-2`，取消用 `outline`，送出用 `default`

規則：
- label 在欄位上方：`<label className="text-sm font-medium" htmlFor=…>`；說明文字 `text-xs text-muted-foreground`。
- 錯誤訊息貼在欄位下方：`text-xs text-destructive`，欄位加 `aria-invalid`。
- 長表單分區，每區加 h2 與一行說明；超過三區時考慮改成多步驟。
- 送出中按鈕 disabled 並顯示 `Loader2 animate-spin`；成功後用 toast 告知並導回詳情頁。
- 有未儲存變更時，離開前要提醒。

## 設定頁

用途：個人偏好、系統設定。

結構：`max-w-2xl`，每個分區一張 Card；Card 內每個設定一列：

```tsx
<div className="flex items-center justify-between gap-4 py-3">
  <div>
    <div className="text-sm font-medium">預設主題</div>
    <div className="text-xs text-muted-foreground">新開啟的視窗會套用這個主題。</div>
  </div>
  <Select …/>
</div>
```

規則：
- 設定列之間用 `divide-y`；控制項靠右對齊。
- Switch 類設定即時生效，不需要「儲存」按鈕；文字類設定用明確的儲存按鈕。
- 危險設定（重設、刪除帳號）放在最後一張 Card，標題用 `text-destructive`。

## 管理頁

用途：人員、角色、權限、組織、指派規則等 admin CRUD。

結構：以列表頁為基礎，再加上編輯方式：
- 欄位少（≤ 6）：點列打開右側 Sheet 編輯（`<Sheet side="right">`，寬 `sm:max-w-md`），不離開列表。
- 欄位多或有子表：導到獨立的表單頁。
- 只改一個值（例如啟用/停用）：行內 Switch，即時生效。

規則：
- **權限矩陣**用表格：列是角色或人員，欄是權限，儲存格放 Switch 或 Checkbox；表頭固定（`sticky top-0 bg-card`）。
- **危險操作**（刪除、停用、移除成員）用淡色 destructive 按鈕，並要求**二次確認**：用 Dialog 說明後果；影響重大的操作（例如刪除組織）要輸入名稱才能確認。
- **沒有權限的區塊直接隱藏**，不要顯示為 disabled，也不要顯示「無權限」。
- 批次操作：勾選列之後，在表格上方出現操作列（`flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-sm`），顯示已選數量。
- 管理員「以他人身份檢視」這類會改變整個介面的狀態，要在 header 下方放一條 `bg-warning/10 text-warning` 的狀態列，並提供結束按鈕。

## 儀表板首頁

用途：登入後的總覽。

結構：
1. 標題區（可用 `text-3xl`）與一句問候或日期
2. KPI 列：`grid grid-cols-2 gap-3 lg:grid-cols-4`（最多 5 欄），每張為 `components.md` 的 KPI 卡
3. 快速入口卡：`grid gap-4 md:grid-cols-2`（或 3 欄）

   ```tsx
   <button className="group flex flex-col gap-3 rounded-xl bg-card p-4 text-left text-sm ring-1 ring-foreground/10 transition-colors hover:ring-primary/40 focus-visible:ring-3 focus-visible:ring-ring/50">
     <div className="flex items-center justify-between">
       <span className="flex size-9 items-center justify-center rounded-md bg-accent text-accent-foreground"><Icon className="size-4" /></span>
       <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
     </div>
     <div>
       <p className="font-heading font-semibold">{title}</p>
       <p className="mt-0.5 text-muted-foreground">{description}</p>
     </div>
   </button>
   ```

4. 近期項目：一張 Card 內的精簡列表（最多 5 列），右上角「查看全部」連到列表頁

規則：KPI 點擊後應導到對應的列表頁並帶上篩選條件。

## 獨立頁

用途：登入、404、無權限、維護中、錯誤邊界。這些頁面**不在工作區外殼內**，不顯示 sidebar。

結構：

```tsx
<div className="flex min-h-svh items-center justify-center bg-background p-6">
  <Card className="w-full max-w-sm">
    <CardHeader>
      {/* 品牌方塊 + 產品名 */}
      <CardTitle>找不到這個頁面</CardTitle>
      <CardDescription>連結可能已失效，或頁面已被移除。</CardDescription>
    </CardHeader>
    <CardContent><Button className="w-full">回到首頁</Button></CardContent>
  </Card>
</div>
```

規則：
- 只放品牌、一句說明、**一個**主要操作；次要操作用文字連結。
- 登入頁可列出登入方式或帳號選擇列（`rounded-lg px-3 py-2 ring-1 ring-foreground/10 hover:bg-muted`）。
- 錯誤頁要提供可以回報的資訊（錯誤代碼，用 `font-mono text-xs`）。
