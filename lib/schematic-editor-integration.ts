/**
 * 完整的 Schematic Editor Patch 整合示例
 * 
 * 這個檔案展示了如何在 schematic-editor 中實現完整的 Patch 系統
 * 包括：UI 元件、API 通信、狀態管理和事件處理
 */

// ============================================
// 1. 型別定義和介面
// ============================================

export interface PatchMeta {
  id: string;
  name: string;
  updatedAt: string;
  componentCount: number;
  interfacePinCount: number;
}

export interface SchematicComponent {
  id: string;
  type: string;
  name: string;
  x: number;
  y: number;
  rotation?: number;
  properties?: Record<string, any>;
}

export interface SchematicConnection {
  id: string;
  net: string;
  connections: string[]; // "ComponentName.PinName" 格式
}

export interface SchematicState {
  components: SchematicComponent[];
  connections: SchematicConnection[];
}

// ============================================
// 2. Patch API 客戶端
// ============================================

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:3000/api";

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

export async function getPatch(id: string): Promise<any> {
  try {
    const response = await fetch(`${API_BASE}/patches/${id}`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error(`Failed to get patch ${id}:`, error);
    return null;
  }
}

export async function savePatch(patch: any): Promise<{ patch: PatchMeta; warnings?: string[] }> {
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

// ============================================
// 3. Patch 提取器
// ============================================

export function extractPatchFromSchematic(
  schematicState: SchematicState,
  selectedIds: Set<string>,
  patchName: string
): any {
  const { components, connections } = schematicState;

  // 篩選選中的元件
  const selectedComponents = components.filter((c) => selectedIds.has(c.id));
  const selectedComponentNames = new Set(selectedComponents.map((c) => c.name));

  if (selectedComponents.length === 0) {
    throw new Error("至少選擇 2 個元件");
  }

  // 轉換元件為 Patch 格式
  const patchComponents = selectedComponents.map((c) => ({
    id: c.id,
    type: c.type,
    name: c.name,
    position: { x: c.x, y: c.y },
    properties: c.properties || {},
  }));

  // 提取相關的網絡
  const internalNets: any[] = [];
  const interfacePins: any[] = [];
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

    // 內部網絡
    if (externalEndpoints.length === 0 && selectedEndpoints.length > 0) {
      internalNets.push({
        id: conn.id,
        name: conn.net,
        connections: selectedEndpoints.map((ep) => {
          const [compName, pinName] = ep.split(".");
          return { componentId: compName, pinName };
        }),
      });
    }

    // 接口引腳
    if (selectedEndpoints.length > 0 && externalEndpoints.length > 0) {
      for (const endpoint of selectedEndpoints) {
        interfacePins.push({
          id: endpoint,
          name: endpoint,
          internalNetName: conn.net,
          type: "signal",
        });
      }
    }

    processedNets.add(conn.id);
  }

  return {
    id: patchName.toLowerCase().replace(/\s+/g, "-"),
    metadata: {
      name: patchName,
      version: "1.0",
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
    },
    components: patchComponents,
    nets: internalNets,
    interfacePins: interfacePins,
  };
}

// ============================================
// 4. React 元件示例 (Hooks 和狀態管理)
// ============================================

/**
 * 在 ComponentSidebar.tsx 中使用：
 */
export const UsePatchesSidebar = () => {
  const [patches, setPatches] = React.useState<PatchMeta[]>([]);
  const [loadingPatches, setLoadingPatches] = React.useState(false);

  const refreshPatches = async () => {
    setLoadingPatches(true);
    try {
      const list = await listPatches();
      setPatches(list);
    } finally {
      setLoadingPatches(false);
    }
  };

  React.useEffect(() => {
    refreshPatches();
  }, []);

  const handleInsertPatch = async (patchId: string) => {
    const patch = await getPatch(patchId);
    if (!patch) {
      alert("無法載入 Patch");
      return;
    }
    // 觸發插入邏輯
    onInsertPatch?.(patch);
  };

  return (
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
  );
};

/**
 * 在 SchematicCanvas.tsx 中的多選邏輯：
 */
export const UseMultiSelect = (initialState: SchematicState) => {
  const [selectedComponentIds, setSelectedComponentIds] = React.useState<Set<string>>(new Set());
  const [showPatchDialog, setShowPatchDialog] = React.useState(false);
  const [schematicState, setSchematicState] = React.useState(initialState);

  const handleCanvasClick = (event: React.MouseEvent, componentAtClick?: SchematicComponent) => {
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
  };

  const handleSavePatch = async (patchName: string) => {
    try {
      const patch = extractPatchFromSchematic(schematicState, selectedComponentIds, patchName);
      const result = await savePatch(patch);
      alert(`✅ Patch "${result.patch.name}" saved!`);
      setSelectedComponentIds(new Set());
      setShowPatchDialog(false);
      // 觸發父組件刷新 Patch 列表
      window.dispatchEvent(new CustomEvent("patchSaved"));
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
    }
  };

  return {
    selectedComponentIds,
    showPatchDialog,
    setShowPatchDialog,
    handleCanvasClick,
    handleSavePatch,
  };
};

/**
 * 在 SchematicCanvas.tsx 中的插入邏輯：
 */
export const UseInsertPatch = (initialState: SchematicState) => {
  const [schematicState, setSchematicState] = React.useState(initialState);

  const onInsertPatch = (patch: any) => {
    const offset = { x: 80, y: 80 };

    // 添加 Patch 的元件，使用偏移量
    const newComponents = patch.components.map((comp: any) => ({
      ...comp,
      id: `${comp.id}-${Date.now()}`, // 避免 ID 碰撞
      x: comp.position?.x ? comp.position.x + offset.x : offset.x,
      y: comp.position?.y ? comp.position.y + offset.y : offset.y,
    }));

    // 添加 Patch 的內部網絡
    const newConnections = patch.nets.map((net: any) => ({
      id: `${net.id}-${Date.now()}`,
      net: net.name,
      connections: net.connections.map((conn: any) => {
        // 重新映射到新的元件 ID
        const newCompId = newComponents.find((c: any) => c.name === conn.componentId)?.id;
        return `${newCompId || conn.componentId}.${conn.pinName}`;
      }),
    }));

    // 更新原理圖狀態
    setSchematicState((prev) => ({
      ...prev,
      components: [...prev.components, ...newComponents],
      connections: [...prev.connections, ...newConnections],
    }));

    alert(`✅ Inserted patch with ${newComponents.length} components`);
  };

  return {
    schematicState,
    setSchematicState,
    onInsertPatch,
  };
};

// ============================================
// 5. 完整的 UI 元件組合
// ============================================

/**
 * SavePatchDialog 元件
 */
export function SavePatchDialog({
  selectedIds,
  onSave,
  onCancel,
}: {
  selectedIds: Set<string>;
  onSave: (name: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = React.useState("");

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

// 為 TypeScript 導入 React
declare namespace React {
  function useState<T>(initialState: T | (() => T)): [T, (value: T) => void];
  function useEffect(effect: () => void | (() => void), deps?: any[]): void;
}
