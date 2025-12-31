# Schematic Editor Patch 系統：快速開始指南

## 🎯 任務完成情況

✅ **所有後端實現完成並測試通過**

**完成的工作**:
- Part 1: Patch API 端點實現 ✅
- Part 2A: 客戶端 API 層 ✅
- Part 2D: Patch 提取工具 ✅
- Part 3: 導入處理修改（文檔提供）✅
- 5 個 API 測試全部通過 ✅
- 詳細文檔和示例代碼 ✅

---

## 🚀 快速開始

### 1. 啟動伺服器

```bash
cd /workspaces/tscircuit
bun server.ts
```

**預期輸出**:
```
╔════════════════════════════════════════════╗
║   ✨ tscircuit + Schematic Editor Server   ║
╚════════════════════════════════════════════╝

🌐 Server running at: http://localhost:3000
📁 Patches stored at: /workspaces/tscircuit/patches

📋 API Endpoints:
   • GET  /api/patches           → List all patches
   • GET  /api/patches/:id       → Get patch details
   • POST /api/patches           → Create/save patch
   • POST /api/patches/import    → Import patch
```

### 2. 驗證 API 工作

```bash
bun scripts/test-patch-api.ts
```

**預期結果**: 所有 5 個測試通過 ✅

### 3. 在 schematic-editor 中集成

按照以下文檔逐個實現：

1. **`SCHEMATIC_EDITOR_STEP_BY_STEP.md`** - 分步指南
   - Part 2B: ComponentSidebar 修改
   - Part 2C: SchematicCanvas 修改
   - Part 2E: Patch 插入邏輯
   - Part 3: 導入處理器

2. **`SCHEMATIC_EDITOR_INTEGRATION.md`** - API 參考

---

## 📂 重要檔案位置

```
/workspaces/tscircuit/
├── server.ts                           ← Patch API 伺服器
├── lib/
│   ├── patch-api-client.ts            ← 客戶端 API 層
│   ├── patch-extractor.ts             ← Patch 提取工具
│   └── schematic-editor-integration.ts ← React 示例
├── scripts/
│   └── test-patch-api.ts              ← API 測試
├── patches/                           ← Patch 存儲目錄
│   ├── *.tscircuit                    ← Patch 檔案
│   └── library/index.json             ← Patch 索引
└── *.md                               ← 文檔文件
```

---

## 🔌 API 端點速查表

| 方法 | 端點 | 用途 | 返回 |
|------|------|------|------|
| GET | `/api/patches` | 列出所有 Patch | PatchLibraryEntry[] |
| GET | `/api/patches/:id` | 獲取特定 Patch | PatchData |
| POST | `/api/patches` | 保存新 Patch | { patch, warnings? } |
| POST | `/api/patches/import` | 導入 Patch | { patch } |
| OPTIONS | `/api/patches` | CORS preflight | 200 OK |

**Base URL**: `http://localhost:3000/api`

---

## 💡 核心概念

### 1. Patch 是什麼？

Patch = 可重用的電路子單元

```
選擇元件 → 保存為 Patch → 重複使用
  ↓                        ↓
 3 個元件          自動插入相同的
  2 個連接              3 個元件
                        2 個連接
```

### 2. 三步集成流程

```
Step 1: 選擇           Step 2: 保存          Step 3: 使用
─────────────────────────────────────────────────────
點擊元件 → POST to API → Patch 保存 → GET from API → 插入畫布
(多選)                (驗證)         (列表)         (展開)
```

### 3. Patch 檔案格式

```typescript
{
  metadata: {
    name: "LED Circuit",
    version: "1.0",
    createdAt: "2025-12-12T...",
  },
  components: [
    { id: "r1", name: "R1", type: "resistor", ... },
    { id: "led1", name: "LED1", type: "led", ... }
  ],
  nets: [
    { id: "net1", name: "vcc", connections: [...] },
    { id: "net2", name: "gnd", connections: [...] }
  ],
  interfacePins: [
    { name: "VCC", internalNetName: "vcc", ... }
  ]
}
```

---

## 🔧 實現清單 (前端開發者)

### Step 1: 安裝客戶端 API

```bash
# 複製以下檔案到 schematic-editor:
# - /workspaces/tscircuit/lib/patch-api-client.ts → src/lib/patchApi.ts
# - /workspaces/tscircuit/lib/patch-extractor.ts → src/lib/patchExtractor.ts
```

### Step 2: 實現 ComponentSidebar 修改

按照 `SCHEMATIC_EDITOR_STEP_BY_STEP.md` 的 Part 2B

**關鍵點**:
- `useState` 管理 patches 列表
- `useEffect` 在掛載時加載
- `refreshPatches()` 按鈕
- `handleInsertPatch()` 觸發插入

### Step 3: 實現 SchematicCanvas 修改

按照 `SCHEMATIC_EDITOR_STEP_BY_STEP.md` 的 Part 2C

**關鍵點**:
- 多選邏輯 (普通、Shift、Ctrl)
- "Save Patch" 工具欄按鈕
- SavePatchDialog 對話框
- `extractPatchFromSchematic()` 提取

### Step 4: 實現 Patch 插入邏輯

按照 `SCHEMATIC_EDITOR_STEP_BY_STEP.md` 的 Part 2E

**關鍵點**:
- ID 映射（避免衝突）
- 80px 偏移
- 連接重新映射

### Step 5: 修改導入處理器

按照 `SCHEMATIC_EDITOR_STEP_BY_STEP.md` 的 Part 3

**檢測邏輯**:
```typescript
if (json.components && json.nets) {
  // 是 Patch
  insertPatch(json);
} else if (json.components && json.connections) {
  // 是原理圖
  loadSchematic(json);
}
```

---

## 🧪 測試方式

### 1. 手動測試 API

```bash
# 列出所有 Patch
curl http://localhost:3000/api/patches

# 保存 Patch
curl -X POST http://localhost:3000/api/patches \
  -H "Content-Type: application/json" \
  -d '{"metadata":{"name":"Test"},...}'

# 插入 Patch
curl http://localhost:3000/api/patches/patch_Test
```

### 2. 自動化測試

```bash
bun scripts/test-patch-api.ts
```

### 3. UI 測試流程

1. 打開 schematic-editor
2. 在畫布上放置 2+ 個元件
3. 選擇元件（Shift+Click）
4. 點擊 "Save Patch"
5. 輸入名稱，保存
6. 在 Sidebar 中看到新 Patch
7. 點擊 Patch 進行插入
8. 驗證元件和連接是否正確

---

## ⚠️ 常見問題

### Q: "Connection refused" 錯誤

**A**: 確保 server.ts 正在運行
```bash
# 檢查
curl http://localhost:3000/api/patches

# 如果失敗，啟動
bun server.ts
```

### Q: Patch 列表為空

**A**: 正常狀態。保存第一個 Patch：
1. 選擇元件
2. 點擊 "Save Patch"
3. 輸入名稱
4. 點擊 Save

### Q: 插入時元件重疊

**A**: 這是設計行為。80px 偏移防止完全重疊。可調整：

```typescript
const offset = { x: 150, y: 150 }; // 增加偏移量
```

### Q: ID 衝突導致連接錯誤

**A**: 使用 timestamp 生成唯一 ID（已實現）:

```typescript
const newId = `${comp.id}-${Date.now()}`;
```

### Q: CORS 錯誤

**A**: Server 已配置 CORS，確保 API_BASE 正確：

```typescript
const API_BASE = "http://localhost:3000/api"; // 必須正確
```

---

## 📚 相關文檔

| 檔案 | 用途 |
|------|------|
| `SCHEMATIC_EDITOR_STEP_BY_STEP.md` | ⭐ 主要實現指南 |
| `SCHEMATIC_EDITOR_INTEGRATION.md` | API 參考和基本說明 |
| `SCHEMATIC_EDITOR_COMPLETION_REPORT.md` | 完整技術報告 |
| `PHASE_1_4_IMPLEMENTATION_SUMMARY.md` | Phase 1-4 概述 |

---

## 🎓 學習路徑

1. **理解概念** (5 分鐘)
   - 讀 "Patch 是什麼" 部分
   - 讀 "三步集成流程"

2. **查看示例** (10 分鐘)
   - 檢查 `lib/schematic-editor-integration.ts`
   - 查看 SavePatchDialog 實現

3. **實現 Part 2B** (30 分鐘)
   - ComponentSidebar 動態列表
   - 刷新和插入按鈕

4. **實現 Part 2C** (45 分鐘)
   - 多選邏輯
   - Save Patch 按鈕和對話框

5. **實現 Part 2E** (30 分鐘)
   - 插入邏輯
   - ID 映射和偏移

6. **實現 Part 3** (15 分鐘)
   - 導入處理器修改

7. **測試** (15 分鐘)
   - 完整工作流測試

**總時間**: ~2-3 小時完整實現

---

## ✨ 下一步

實現完成後，可以考慮：

- [ ] Patch 搜索和篩選
- [ ] Patch 預覽圖（SVG 縮圖）
- [ ] 版本管理
- [ ] 刪除 Patch
- [ ] 重命名 Patch
- [ ] 嵌套 Patch（Patch 中的 Patch）

---

## 📞 支援

遇到問題？檢查以下內容：

1. ✅ 伺服器正在運行 (`http://localhost:3000`)
2. ✅ API 端點可訪問 (`/api/patches`)
3. ✅ 所有測試通過 (`bun scripts/test-patch-api.ts`)
4. ✅ 查看詳細文檔 (`SCHEMATIC_EDITOR_STEP_BY_STEP.md`)
5. ✅ 檢查伺服器日誌中的錯誤

---

**完成日期**: 2025-12-12  
**狀態**: ✅ 生產就緒 (Ready for Integration)  
**分支**: `codespace-scaling-fiesta-5gpr6ww5v7xg37qv`

