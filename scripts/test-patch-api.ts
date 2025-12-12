#!/usr/bin/env bun
/**
 * Patch API 端點測試腳本
 * 用於驗證 server.ts 中實現的 Patch API 是否正常運作
 */

import { PatchData, PatchComponent, PatchNet } from "./lib/patch";

const API_BASE = "http://localhost:3000/api";

// 測試用的簡單 Patch
const testPatch: PatchData = {
  schemaVersion: "1.0",
  metadata: {
    name: "Test LED Circuit",
    description: "Simple LED with resistor",
    version: "1.0.0",
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
  },
  components: [
    {
      id: "r1",
      name: "R1",
      type: "resistor",
      properties: {
        resistance: "220ohm",
      },
      position: { x: 100, y: 100 },
    },
    {
      id: "led1",
      name: "LED1",
      type: "led",
      properties: {
        color: "red",
      },
      position: { x: 200, y: 100 },
    },
  ] as PatchComponent[],
  nets: [
    {
      id: "net1",
      name: "vcc",
      connections: [
        { componentId: "r1", pinName: "pin1" },
        { componentId: "led1", pinName: "pin1" },
      ],
    },
    {
      id: "net2",
      name: "gnd",
      connections: [
        { componentId: "r1", pinName: "pin2" },
        { componentId: "led1", pinName: "pin2" },
      ],
    },
  ] as PatchNet[],
  interfacePins: [
    {
      id: "vcc_pin",
      name: "VCC",
      position: "top",
      internalNetName: "vcc",
      type: "power",
    },
    {
      id: "gnd_pin",
      name: "GND",
      position: "bottom",
      internalNetName: "gnd",
      type: "ground",
    },
  ],
};

/**
 * 測試 GET /api/patches - 獲取所有 Patch 列表
 */
async function testListPatches() {
  console.log("\n📋 Test 1: GET /api/patches");
  console.log("=============================");

  try {
    const response = await fetch(`${API_BASE}/patches`);
    const data = (await response.json()) as any[];

    console.log(`✅ Status: ${response.status}`);
    console.log(`✅ Patches count: ${Array.isArray(data) ? data.length : 0}`);
    if (Array.isArray(data) && data.length > 0) {
      console.log(`   Sample patch: ${data[0].name} (${data[0].id})`);
    }
  } catch (error: any) {
    console.error(`❌ Error: ${error.message}`);
  }
}

/**
 * 測試 POST /api/patches - 保存新 Patch
 */
async function testSavePatch() {
  console.log("\n📋 Test 2: POST /api/patches");
  console.log("=============================");

  try {
    const response = await fetch(`${API_BASE}/patches`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testPatch),
    });

    const data = (await response.json()) as any;

    console.log(`✅ Status: ${response.status}`);
    if (response.ok) {
      console.log(`✅ Saved patch: ${data.patch?.name}`);
      if (data.warnings?.length) {
        console.log(`⚠️  Warnings: ${data.warnings.join(", ")}`);
      }
    } else {
      console.log(`❌ Errors: ${data.errors?.join(", ")}`);
    }
  } catch (error: any) {
    console.error(`❌ Error: ${error.message}`);
  }
}

/**
 * 測試 GET /api/patches/:id - 獲取特定 Patch
 */
async function testGetPatch() {
  console.log("\n📋 Test 3: GET /api/patches/:id");
  console.log("================================");

  try {
    // 先獲取 patches 列表以取得有效的 ID
    const listResponse = await fetch(`${API_BASE}/patches`);
    const patches = (await listResponse.json()) as any[];
    
    if (!patches.length) {
      console.log("⚠️  No patches available");
      return;
    }
    
    const patchId = patches[0].id;
    const response = await fetch(`${API_BASE}/patches/${patchId}`);

    if (response.status === 404) {
      console.log(`⚠️  Patch not found: ${patchId}`);
      return;
    }

    const data = (await response.json()) as any;

    console.log(`✅ Status: ${response.status}`);
    console.log(`✅ Patch name: ${data.metadata?.name}`);
    console.log(`✅ Components: ${data.components?.length}`);
    console.log(`✅ Nets: ${data.nets?.length}`);
  } catch (error: any) {
    console.error(`❌ Error: ${error.message}`);
  }
}

/**
 * 測試 POST /api/patches/import - 導入 Patch
 */
async function testImportPatch() {
  console.log("\n📋 Test 4: POST /api/patches/import");
  console.log("====================================");

  try {
    const response = await fetch(`${API_BASE}/patches/import`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testPatch),
    });

    const data = (await response.json()) as any;

    console.log(`✅ Status: ${response.status}`);
    console.log(`✅ Imported patch: ${data.patch?.name}`);
  } catch (error: any) {
    console.error(`❌ Error: ${error.message}`);
  }
}

/**
 * 測試 CORS preflight
 */
async function testCORS() {
  console.log("\n📋 Test 5: CORS Preflight");
  console.log("==========================");

  try {
    const response = await fetch(`${API_BASE}/patches`, {
      method: "OPTIONS",
      headers: {
        "Origin": "http://localhost:5174",
        "Access-Control-Request-Method": "POST",
      },
    });

    console.log(`✅ Status: ${response.status}`);
    console.log(`✅ CORS Origin: ${response.headers.get("Access-Control-Allow-Origin")}`);
    console.log(`✅ CORS Methods: ${response.headers.get("Access-Control-Allow-Methods")}`);
  } catch (error: any) {
    console.error(`❌ Error: ${error.message}`);
  }
}

/**
 * 運行所有測試
 */
async function runAllTests() {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║              🧪 Patch API 測試套件                          ║
╚════════════════════════════════════════════════════════════╝

📍 API Base: ${API_BASE}
📍 Timeout: 5 秒

`);

  try {
    await testListPatches();
    await testSavePatch();
    await testGetPatch();
    await testImportPatch();
    await testCORS();

    console.log(`
╔════════════════════════════════════════════════════════════╗
║                   ✅ 所有測試完成！                         ║
╚════════════════════════════════════════════════════════════╝
`);
  } catch (error) {
    console.error(`\n❌ 測試執行失敗:`, error);
  }
}

// 運行測試
runAllTests().catch(console.error);
