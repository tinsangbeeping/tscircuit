# Schematic Editor 整合指南

## Part 2A: 建立 patchApi.ts

在 `/workspaces/schematic-editor/src/lib/patchApi.ts` 中建立以下代碼：

```typescript
import type { PatchData, PatchMetadata } from "@tscircuit/lib/patch";

export interface PatchMeta {
  id: string;
  name: string;
  updatedAt: string;
  componentCount: number;
  interfacePinCount: number;
}

const API_BASE = "http://localhost:3000/api";

/**
 * 獲取所有 Patch 列表
 */
export async function listPatches(): Promise<PatchMeta[]> {
  try {
    const response = await fetch(`${API_BASE}/patches`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Failed to list patches:", error);
    return [];
  }
}

/**
 * 獲取特定 Patch 的完整內容
 */
export async function getPatch(id: string): Promise<PatchData | null> {
  try {
    const response = await fetch(`${API_BASE}/patches/${id}`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error(`Failed to get patch ${id}:`, error);
    return null;
  }
}

/**
 * 保存新 Patch
 * @returns { patch: PatchMeta, warnings?: string[] }
 */
export async function savePatch(
  patch: PatchData
): Promise<{ patch: PatchMeta; warnings?: string[] }> {
  try {
    const response = await fetch(`${API_BASE}/patches`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.errors?.[0] || "Failed to save patch");
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to save patch:", error);
    throw error;
  }
}

/**
 * 導入 Patch JSON
 */
export async function importPatch(patchJson: any): Promise<PatchMeta> {
  try {
    const response = await fetch(`${API_BASE}/patches/import`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patchJson),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const result = await response.json();
    return result.patch;
  } catch (error) {
    console.error("Failed to import patch:", error);
    throw error;
  }
}
```

---

## Part 2B: 更新 ComponentSidebar.tsx

在 `ComponentSidebar.tsx` 中做以下更改：

### 1. 在頂部導入
```typescript
import { listPatches, getPatch, savePatch } from "../lib/patchApi";
import type { PatchMeta } from "../lib/patchApi";
```

### 2. 在 state 中添加 Patches
```typescript
const [patches, setPatches] = useState<PatchMeta[]>([]);
const [loadingPatches, setLoadingPatches] = useState(false);
```

### 3. 添加加載 Patches 的效果
```typescript
useEffect(() => {
  refreshPatches();
}, []);

const refreshPatches = async () => {
  setLoadingPatches(true);
  try {
    const list = await listPatches();
    setPatches(list);
  } finally {
    setLoadingPatches(false);
  }
};
```

### 4. 添加插入 Patch 的處理
```typescript
const handleInsertPatch = async (patchId: string) => {
  const patch = await getPatch(patchId);
  if (!patch) {
    alert("無法載入 Patch");
    return;
  }
  
  // 調用父組件的回調
  onInsertPatch?.(patch);
};
```

### 5. 替換 "Predefined Patches" 硬編碼部分
替換：
```typescript
<div className="text-sm font-semibold mb-2">Predefined Patches</div>
<div className="space-y-1">
  {["LED Circuit", "Power Module", "Filter"].map((name) => (
    <button
      key={name}
      className="w-full text-left px-3 py-2 rounded hover:bg-blue-600 text-sm"
      onClick={() => console.log(`Insert ${name}`)}
    >
      {name}
    </button>
  ))}
</div>
```

使用：
```typescript
<div className="text-sm font-semibold mb-2 flex justify-between items-center">
  Patches
  <button
    onClick={refreshPatches}
    disabled={loadingPatches}
    className="text-xs px-2 py-1 bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
  >
    {loadingPatches ? "..." : "🔄"}
  </button>
</div>
<div className="space-y-1">
  {patches.length === 0 ? (
    <div className="text-xs text-gray-400">無 Patch</div>
  ) : (
    patches.map((patch) => (
      <button
        key={patch.id}
        className="w-full text-left px-3 py-2 rounded hover:bg-blue-600 text-sm"
        onClick={() => handleInsertPatch(patch.id)}
      >
        {patch.name} ({patch.componentCount} 元件)
      </button>
    ))
  )}
</div>
```

---

## Part 2C: 更新 SchematicCanvas.tsx

### 1. 導入所需函數
```typescript
import { savePatch } from "../lib/patchApi";
import { extractPatchFromSchematic } from "../lib/patchExtractor";
```

### 2. 添加多選狀態
```typescript
const [selectedComponentIds, setSelectedComponentIds] = useState<Set<string>>(new Set());
const [showPatchDialog, setShowPatchDialog] = useState(false);
```

### 3. 實現多選邏輯（在畫布點擊處理中）
```typescript
// 在現有的點擊處理中修改
if (componentAtClick) {
  if (event.shiftKey) {
    // Shift+click：切換選擇
    const newSelected = new Set(selectedComponentIds);
    if (newSelected.has(componentAtClick.id)) {
      newSelected.delete(componentAtClick.id);
    } else {
      newSelected.add(componentAtClick.id);
    }
    setSelectedComponentIds(newSelected);
  } else {
    // 普通點擊：單選
    setSelectedComponentIds(new Set([componentAtClick.id]));
  }
} else {
  // 點擊空白：清除選擇
  setSelectedComponentIds(new Set());
}
```

### 4. 在畫布上方添加 "Save Patch" 按鈕
```typescript
<div className="absolute top-2 left-2 flex gap-2 z-10">
  <button
    onClick={() => setShowPatchDialog(true)}
    disabled={selectedComponentIds.size < 2}
    className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
  >
    Save Patch ({selectedComponentIds.size})
  </button>
</div>
```

### 5. 添加保存 Patch 對話框
```typescript
{showPatchDialog && (
  <SavePatchDialog
    selectedIds={selectedComponentIds}
    onSave={async (patchName) => {
      try {
        const patch = extractPatchFromSchematic(schematicState, selectedComponentIds, patchName);
        const result = await savePatch(patch);
        alert(`✅ Patch "${result.patch.name}" saved!`);
        setSelectedComponentIds(new Set());
        setShowPatchDialog(false);
        // 觸發父組件刷新 Patch 列表
        onPatchSaved?.();
      } catch (error) {
        alert(`❌ Error: ${error.message}`);
      }
    }}
    onCancel={() => setShowPatchDialog(false)}
  />
)}
```

### 6. 添加簡單的對話框元件
```typescript
interface SavePatchDialogProps {
  selectedIds: Set<string>;
  onSave: (name: string) => void;
  onCancel: () => void;
}

function SavePatchDialog({ onSave, onCancel }: SavePatchDialogProps) {
  const [name, setName] = useState("");

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg w-80">
        <h2 className="text-lg font-bold mb-4">Save as Patch</h2>
        <input
          type="text"
          placeholder="Patch name..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 rounded mb-4 text-white"
          autoFocus
        />
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(name)}
            disabled={!name.trim()}
            className="px-4 py-2 bg-green-600 rounded hover:bg-green-700 disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## Part 2D: 建立 patchExtractor.ts

在 `/workspaces/schematic-editor/src/lib/patchExtractor.ts` 中建立：

```typescript
import type { PatchData, PatchComponent, PatchNet, PatchInterfacePin } from "@tscircuit/lib/patch";
import type { SchematicComponent, SchematicConnection } from "./schematic";

export interface SchematicState {
  components: SchematicComponent[];
  connections: SchematicConnection[];
}

/**
 * 從原理圖狀態和選定的元件 ID 提取 Patch
 */
export function extractPatchFromSchematic(
  schematicState: SchematicState,
  selectedIds: Set<string>,
  patchName: string
): PatchData {
  const { components, connections } = schematicState;

  // 篩選選中的元件
  const selectedComponents = components.filter((c) => selectedIds.has(c.id));
  const selectedComponentNames = new Set(selectedComponents.map((c) => c.name));

  // 轉換元件為 Patch 格式
  const patchComponents: PatchComponent[] = selectedComponents.map((c) => ({
    id: c.id,
    type: c.type,
    name: c.name,
    x: c.x,
    y: c.y,
    rotation: c.rotation || 0,
    properties: c.properties || {},
  }));

  // 提取相關的網絡
  const internalNets: PatchNet[] = [];
  const interfacePins: PatchInterfacePin[] = [];
  const processedNets = new Set<string>();

  for (const conn of connections) {
    if (processedNets.has(conn.id)) continue;

    const connectedEndpoints = conn.connections || [];
    const selectedEndpoints = connectedEndpoints.filter((endpoint) => {
      const [compName] = endpoint.split(".");
      return selectedComponentNames.has(compName);
    });

    const externalEndpoints = connectedEndpoints.filter((endpoint) => {
      const [compName] = endpoint.split(".");
      return !selectedComponentNames.has(compName);
    });

    // 如果所有端點都在選中元件內，這是內部網絡
    if (externalEndpoints.length === 0 && selectedEndpoints.length > 0) {
      internalNets.push({
        id: conn.id,
        name: conn.net,
        connections: selectedEndpoints,
      });
    }

    // 如果網絡跨越邊界，創建接口引腳
    if (selectedEndpoints.length > 0 && externalEndpoints.length > 0) {
      for (const endpoint of selectedEndpoints) {
        interfacePins.push({
          name: endpoint,
          net: conn.net,
        });
      }
    }

    processedNets.add(conn.id);
  }

  return {
    id: patchName.toLowerCase().replace(/\s+/g, "-"),
    name: patchName,
    components: patchComponents,
    nets: internalNets,
    interfacePins: interfacePins,
    metadata: {
      version: "1.0",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };
}
```

---

## Part 2E: 實現 Patch 插入邏輯

在 `SchematicCanvas.tsx` 中添加插入處理：

```typescript
export function onInsertPatch(patch: PatchData) {
  // 計算偏移量以避免與現有元件重疊
  const offset = { x: 80, y: 80 };

  // 添加 Patch 的元件，使用偏移量
  const newComponents = patch.components.map((comp) => ({
    ...comp,
    id: `${comp.id}-${Date.now()}`, // 避免 ID 碰撞
    x: comp.x + offset.x,
    y: comp.y + offset.y,
  }));

  // 添加 Patch 的內部網絡
  const newConnections = patch.nets.map((net) => ({
    id: `${net.id}-${Date.now()}`,
    net: net.name,
    connections: net.connections, // 保持原始連接
  }));

  // 更新原理圖狀態
  setSchematicState((prev) => ({
    ...prev,
    components: [...prev.components, ...newComponents],
    connections: [...prev.connections, ...newConnections],
  }));

  alert(`✅ Inserted patch with ${newComponents.length} components`);
}
```

---

## Part 3: 修改導入處理器

在 `SchematicCanvas.tsx` 的檔案導入處理中：

```typescript
async function handleImportFile(json: any) {
  // 檢測是原理圖還是 Patch
  if (json.components && json.connections) {
    // 這是原理圖，使用現有的載入邏輯
    setSchematicState(json);
  } else if (json.components && json.nets && json.interfacePins) {
    // 這是 Patch，調用插入邏輯
    onInsertPatch(json);
  } else {
    alert("❌ Unknown file format");
  }
}
```

---

## 測試清單

- [ ] Patch API 伺服器正常啟動（`bun server.ts`）
- [ ] 可以列出 Patch 列表（`GET /api/patches`）
- [ ] 可以保存 Patch（`POST /api/patches`）
- [ ] Sidebar 顯示 Patch 列表
- [ ] 可以點擊 Patch 進行插入
- [ ] 多選功能正常
- [ ] 保存 Patch 對話框正常
- [ ] 插入後元件和網絡正確添加
- [ ] Patch 列表在保存後刷新

