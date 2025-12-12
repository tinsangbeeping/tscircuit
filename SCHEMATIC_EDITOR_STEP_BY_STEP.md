# Schematic Editor Patch 整合：完整實現指南

## 概述

本指南詳細說明如何在 schematic-editor 中集成 Patch 系統。系統包括以下功能：

1. **Patch 列表管理** - 動態載入和顯示可用的 Patch
2. **多選功能** - 選擇多個元件以建立新 Patch
3. **Patch 保存** - 將選定的元件和連接保存為可重用的 Patch
4. **Patch 插入** - 將 Patch 展開插入到原理圖中

---

## Part 2B: ComponentSidebar.tsx 修改

### 步驟 1：導入所需的函數和類型

```typescript
import { listPatches, getPatch, type PatchMeta } from "../lib/patchApi";
import React, { useState, useEffect } from "react";
```

### 步驟 2：添加 Patch 狀態和效果

在 ComponentSidebar 元件中添加：

```typescript
const [patches, setPatches] = useState<PatchMeta[]>([]);
const [loadingPatches, setLoadingPatches] = useState(false);

// 在元件掛載時載入 Patch 列表
useEffect(() => {
  refreshPatches();
}, []);

// 監聽 patchSaved 事件以自動刷新
useEffect(() => {
  const handlePatchSaved = () => refreshPatches();
  window.addEventListener("patchSaved", handlePatchSaved);
  return () => window.removeEventListener("patchSaved", handlePatchSaved);
}, []);
```

### 步驟 3：實現 refreshPatches 和 handleInsertPatch

```typescript
const refreshPatches = async () => {
  setLoadingPatches(true);
  try {
    const list = await listPatches();
    setPatches(list);
  } catch (error) {
    console.error("Failed to load patches:", error);
  } finally {
    setLoadingPatches(false);
  }
};

const handleInsertPatch = async (patchId: string) => {
  try {
    const patch = await getPatch(patchId);
    if (!patch) {
      alert("無法載入 Patch");
      return;
    }
    
    // 觸發父元件的 onInsertPatch 回調
    onInsertPatch?.(patch);
  } catch (error) {
    alert("插入失敗：" + error.message);
  }
};
```

### 步驟 4：更新 Sidebar UI

替換硬編碼的 "Predefined Patches" 部分：

```typescript
<div className="border-t border-gray-700 mt-4 pt-4">
  <div className="text-sm font-semibold mb-2 flex justify-between items-center">
    <span>Patches</span>
    <button
      onClick={refreshPatches}
      disabled={loadingPatches}
      className="text-xs px-2 py-1 bg-blue-500 rounded hover:bg-blue-600 disabled:opacity-50 transition"
      title="Refresh patch list"
    >
      {loadingPatches ? "..." : "🔄"}
    </button>
  </div>
  
  <div className="space-y-1 max-h-48 overflow-y-auto">
    {patches.length === 0 ? (
      <div className="text-xs text-gray-400 italic">
        {loadingPatches ? "載入中..." : "無可用 Patch"}
      </div>
    ) : (
      patches.map((patch) => (
        <button
          key={patch.id}
          onClick={() => handleInsertPatch(patch.id)}
          className="w-full text-left px-3 py-2 rounded hover:bg-blue-600 transition text-sm hover:text-white"
          title={`插入 ${patch.name}`}
        >
          <div className="flex justify-between items-center">
            <span>{patch.name}</span>
            <span className="text-xs text-gray-400">
              {patch.componentCount} 元件
            </span>
          </div>
        </button>
      ))
    )}
  </div>
</div>
```

---

## Part 2C: SchematicCanvas.tsx 修改

### 步驟 1：添加多選狀態

```typescript
const [selectedComponentIds, setSelectedComponentIds] = useState<Set<string>>(new Set());
const [showSavePatchDialog, setShowSavePatchDialog] = useState(false);
```

### 步驟 2：實現多選邏輯

在畫布的點擊事件處理器中修改：

```typescript
const handleCanvasClick = (event: React.MouseEvent, componentAtPoint?: any) => {
  if (!componentAtPoint) {
    // 點擊空白區域：清除選擇
    setSelectedComponentIds(new Set());
    return;
  }

  const componentId = componentAtPoint.id;
  const newSelected = new Set(selectedComponentIds);

  if (event.shiftKey) {
    // Shift+Click：切換選擇
    if (newSelected.has(componentId)) {
      newSelected.delete(componentId);
    } else {
      newSelected.add(componentId);
    }
  } else if (event.ctrlKey || event.metaKey) {
    // Ctrl/Cmd+Click：多選
    if (newSelected.has(componentId)) {
      newSelected.delete(componentId);
    } else {
      newSelected.add(componentId);
    }
  } else {
    // 普通點擊：單選
    newSelected.clear();
    newSelected.add(componentId);
  }

  setSelectedComponentIds(newSelected);
};
```

### 步驟 3：渲染選定的元件

修改元件渲染以顯示選定狀態：

```typescript
{components.map((comp) => {
  const isSelected = selectedComponentIds.has(comp.id);
  return (
    <g
      key={comp.id}
      onClick={(e) => handleCanvasClick(e, comp)}
      className={isSelected ? "opacity-75 outline outline-2 outline-yellow-400" : ""}
    >
      {/* 元件渲染代碼 */}
    </g>
  );
})}
```

### 步驟 4：添加 "Save Patch" 工具欄

在畫布上方添加工具欄：

```typescript
<div className="absolute top-4 left-4 flex gap-2 z-10">
  <button
    onClick={() => setShowSavePatchDialog(true)}
    disabled={selectedComponentIds.size < 2}
    className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white rounded transition"
  >
    💾 Save Patch ({selectedComponentIds.size})
  </button>
</div>
```

### 步驟 5：添加保存對話框

```typescript
{showSavePatchDialog && (
  <SavePatchDialog
    selectedCount={selectedComponentIds.size}
    onSave={handleSavePatch}
    onCancel={() => setShowSavePatchDialog(false)}
  />
)}
```

### 步驟 6：實現 handleSavePatch

```typescript
const handleSavePatch = async (patchName: string) => {
  try {
    // 導入 extractPatchFromSchematic
    const { extractPatchFromSchematic } = await import("../lib/patchExtractor");
    const { savePatch } = await import("../lib/patchApi");

    const patch = extractPatchFromSchematic(
      { components, connections },
      selectedComponentIds,
      patchName
    );

    const result = await savePatch(patch);

    if (result.warnings?.length) {
      console.warn("Patch 保存時有警告：", result.warnings);
    }

    alert(`✅ Patch "${result.patch.name}" 已保存！`);
    setSelectedComponentIds(new Set());
    setShowSavePatchDialog(false);

    // 通知 Sidebar 刷新 Patch 列表
    window.dispatchEvent(new CustomEvent("patchSaved"));
  } catch (error: any) {
    alert(`❌ 保存失敗：${error.message}`);
  }
};
```

---

## Part 2E: 實現 Patch 插入邏輯

### 步驟 1：添加 insertPatch 函數

```typescript
const insertPatch = (patch: any) => {
  const offset = { x: 80, y: 80 };
  const now = Date.now();

  // 為新元件生成唯一 ID
  const idMap = new Map<string, string>();
  const newComponents = patch.components.map((comp: any) => {
    const newId = `${comp.id}-${now}`;
    idMap.set(comp.name, newId);
    return {
      ...comp,
      id: newId,
      x: (comp.position?.x || 0) + offset.x,
      y: (comp.position?.y || 0) + offset.y,
    };
  });

  // 添加新連接
  const newConnections = patch.nets.map((net: any) => {
    const newConnections = net.connections.map((conn: any) => {
      const newComponentId = idMap.get(conn.componentId) || conn.componentId;
      return `${newComponentId}.${conn.pinName}`;
    });

    return {
      id: `${net.id}-${now}`,
      net: net.name,
      connections: newConnections,
    };
  });

  // 更新原理圖狀態
  setComponents([...components, ...newComponents]);
  setConnections([...connections, ...newConnections]);

  alert(`✅ 已插入 Patch，包含 ${newComponents.length} 個元件`);
};
```

### 步驟 2：在 ComponentSidebar 中使用

```typescript
// 在 ComponentSidebar 中
const onInsertPatch = (patch: any) => {
  insertPatch(patch);
};

// 傳遞給 ComponentSidebar
<ComponentSidebar
  components={components}
  onInsertPatch={onInsertPatch}
  // ... 其他 props
/>
```

---

## Part 3: 導入處理器修改

### 在文件導入處理中檢測類型

```typescript
async function handleFileImport(file: File) {
  try {
    const text = await file.text();
    const json = JSON.parse(text);

    // 檢測是否是原理圖還是 Patch
    if (json.components && json.connections && !json.nets) {
      // 原理圖格式（無 nets）
      setComponents(json.components);
      setConnections(json.connections);
    } else if (json.components && json.nets && json.interfacePins) {
      // Patch 格式（有 nets 和 interfacePins）
      insertPatch(json);
    } else {
      alert("❌ 未知的檔案格式");
    }
  } catch (error) {
    alert("❌ 導入失敗：" + error.message);
  }
}
```

---

## SavePatchDialog 元件完整實現

```typescript
interface SavePatchDialogProps {
  selectedCount: number;
  onSave: (name: string) => Promise<void>;
  onCancel: () => void;
}

export function SavePatchDialog({
  selectedCount,
  onSave,
  onCancel,
}: SavePatchDialogProps) {
  const [patchName, setPatchName] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);

  const handleSave = async () => {
    if (!patchName.trim()) return;

    setIsSaving(true);
    try {
      await onSave(patchName);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-96">
        <h2 className="text-xl font-bold text-white mb-4">
          💾 Save Patch
        </h2>

        <div className="mb-4">
          <p className="text-sm text-gray-300 mb-2">
            選定 {selectedCount} 個元件
          </p>
          <input
            type="text"
            placeholder="輸入 Patch 名稱..."
            value={patchName}
            onChange={(e) => setPatchName(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSave()}
            disabled={isSaving}
            className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 outline-none disabled:opacity-50"
            autoFocus
          />
        </div>

        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            disabled={isSaving}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!patchName.trim() || isSaving}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## 測試檢查清單

- [ ] 能否看到 Sidebar 中的 Patches 部分
- [ ] 刷新按鈕是否工作（無錯誤）
- [ ] 能否選擇多個元件（普通點擊、Shift+點擊）
- [ ] Save Patch 按鈕是否在選擇 ≥2 個元件時啟用
- [ ] 能否在對話框中輸入 Patch 名稱並保存
- [ ] Patch 是否在 Sidebar 中立即出現
- [ ] 能否點擊 Patch 進行插入
- [ ] 插入的元件是否有正確的偏移量
- [ ] 連接是否被正確保留
- [ ] 服務器日誌中是否有錯誤

---

## 常見問題

### Q: API 端點連接失敗
**A**: 確保 server.ts 正在運行（`bun server.ts`），且 API_BASE 指向正確的 URL（默認 `http://localhost:3000/api`）

### Q: Patch 保存時出現驗證錯誤
**A**: 檢查是否有未連接的引腳或浮動網絡。validatePatch 可能會報告警告。

### Q: 插入後 ID 衝突
**A**: insertPatch 函數使用 timestamp 來生成唯一 ID。確保時間戳不同。

### Q: CORS 錯誤
**A**: 確保 server.ts 返回正確的 CORS 頭部。檢查 OPTIONS 端點。

---

## 下一步

完成基本整合後，可以考慮：

1. **增強的 UI** - 使用 drag-and-drop 重新排列元件
2. **Patch 編輯** - 在 Patch Editor 中修改現有 Patch
3. **版本控制** - 管理 Patch 的多個版本
4. **搜索和篩選** - 快速查找 Patch
5. **Patch 預覽** - 顯示 Patch 的 SVG 預覽圖

