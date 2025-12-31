/**
 * Patch API Client - 供 schematic-editor 使用
 * 與後端 /api/patches 端點通信
 */

import type { PatchData } from "./patch";

export interface PatchMeta {
  id: string;
  name: string;
  updatedAt: string;
  componentCount: number;
  interfacePinCount: number;
}

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:3000/api";

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
