/**
 * Patch Extractor - 從原理圖狀態和選定元件提取 Patch
 */

import type { PatchData, PatchComponent, PatchNet, PatchInterfacePin } from "./patch";

/**
 * 代表原理圖中的元件
 */
export interface SchematicComponent {
  id: string;
  type: string;
  name: string;
  x: number;
  y: number;
  rotation?: number;
  properties?: Record<string, any>;
}

/**
 * 代表原理圖中的連接/網絡
 */
export interface SchematicConnection {
  id: string;
  net: string;
  connections: string[]; // "ComponentName.PinName" 格式
}

export interface SchematicState {
  components: SchematicComponent[];
  connections: SchematicConnection[];
}

/**
 * 從原理圖狀態和選定的元件 ID 提取 Patch
 *
 * @param schematicState 原理圖的當前狀態（元件和連接）
 * @param selectedIds 選定元件的 ID 集合
 * @param patchName Patch 的名稱
 * @returns 返回提取的 Patch 數據
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

  if (selectedComponents.length === 0) {
    throw new Error("至少選擇 2 個元件");
  }

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

    // 分類端點：在選中元件內 vs 在選中元件外
    const selectedEndpoints = connectedEndpoints.filter((endpoint) => {
      const [compName] = endpoint.split(".");
      return selectedComponentNames.has(compName);
    });

    const externalEndpoints = connectedEndpoints.filter((endpoint) => {
      const [compName] = endpoint.split(".");
      return !selectedComponentNames.has(compName);
    });

    // 情況 1：所有端點都在選中元件內 → 內部網絡
    if (externalEndpoints.length === 0 && selectedEndpoints.length > 0) {
      internalNets.push({
        id: conn.id,
        name: conn.net,
        connections: selectedEndpoints,
      });
    }

    // 情況 2：網絡跨越邊界 → 創建接口引腳
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

  // 如果沒有任何網絡，使用空數組
  if (internalNets.length === 0 && interfacePins.length === 0) {
    console.warn("警告：提取的 Patch 沒有連接");
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
      description: `Extracted patch from schematic containing ${selectedComponents.length} components`,
    },
  };
}

/**
 * 驗證 extractPatchFromSchematic 的輸出
 */
export function validateExtractedPatch(patch: PatchData): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!patch.id || !patch.name) {
    errors.push("Patch 必須有 ID 和名稱");
  }

  if (patch.components.length === 0) {
    errors.push("Patch 至少必須有一個元件");
  }

  if (patch.components.length === 1) {
    warnings.push("Patch 只有一個元件，考慮使用符號代替");
  }

  // 檢查所有網絡端點都引用了有效的元件
  const componentNames = new Set(patch.components.map((c) => c.name));

  for (const net of patch.nets) {
    for (const connection of net.connections) {
      const [compName] = connection.split(".");
      if (!componentNames.has(compName)) {
        errors.push(`網絡 ${net.name} 引用了不存在的元件 ${compName}`);
      }
    }
  }

  for (const pin of patch.interfacePins) {
    const [compName] = pin.name.split(".");
    if (!componentNames.has(compName)) {
      errors.push(`接口引腳 ${pin.name} 引用了不存在的元件 ${compName}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
