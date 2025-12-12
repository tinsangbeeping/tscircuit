#!/usr/bin/env bun
import { serve } from "bun";
import { join } from "path";
import { readFileSync, existsSync } from "fs";
import { PatchManager } from "./lib/patch-manager";
import { validatePatch } from "./lib/patch";

const PORT = 3000;
const OUT_DIR = join(import.meta.dir, "./out");
const PATCHES_DIR = join(import.meta.dir, "./patches");

// Initialize PatchManager
const patchManager = new PatchManager({ patchDir: PATCHES_DIR });

const server = serve({
  port: PORT,
  async fetch(req) {
    try {
      const url = new URL(req.url);
      const pathname = url.pathname;

      // Handle Patch API endpoints
      if (pathname === "/api/patches" && req.method === "GET") {
        const patches = patchManager.getLibrary();
        return new Response(JSON.stringify(patches), {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }

      if (pathname.startsWith("/api/patches/") && req.method === "GET") {
        const patchId = pathname.split("/").pop();
        if (!patchId) {
          return new Response(JSON.stringify({ error: "Invalid patch ID" }), { status: 400 });
        }
        const entry = patchManager.getLibraryEntry(patchId);
        if (!entry) {
          return new Response(JSON.stringify({ error: "Patch not found" }), { status: 404 });
        }
        const patch = patchManager.loadPatch(entry.filePath);
        return new Response(JSON.stringify(patch), {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }

      if (pathname === "/api/patches" && req.method === "POST") {
        const body = await req.json();
        const errors = validatePatch(body);

        if (errors.some(e => e.severity === "error")) {
          const errorMessages = errors.filter(e => e.severity === "error").map(e => e.message);
          const warnings = errors.filter(e => e.severity === "warning").map(e => e.message);
          return new Response(
            JSON.stringify({ errors: errorMessages, warnings }),
            { status: 400, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
          );
        }

        const warnings = errors.filter(e => e.severity === "warning").map(e => e.message);
        const filepath = patchManager.savePatch(body);
        
        // 生成相同的 ID 格式來查詢 libraryIndex
        const patchId = `patch_${body.metadata.name.replace(/\s+/g, "_")}`;
        const entry = patchManager.getLibraryEntry(patchId);
        
        return new Response(
          JSON.stringify({ patch: entry, warnings: warnings.length > 0 ? warnings : undefined }),
          { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
        );
      }

      if (pathname === "/api/patches/import" && req.method === "POST") {
        const body = await req.json();
        
        // importPatch 期望一個檔案路徑，但我們有 JSON 對象
        // 所以直接保存為 Patch
        try {
          const filepath = patchManager.savePatch(body);
          const patchId = `patch_${body.metadata.name.replace(/\s+/g, "_")}`;
          const entry = patchManager.getLibraryEntry(patchId);
          
          return new Response(JSON.stringify({ patch: entry }), {
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
          });
        } catch (error) {
          return new Response(
            JSON.stringify({ error: String(error) }),
            { status: 400, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
          );
        }
      }

      // Handle CORS preflight
      if (req.method === "OPTIONS") {
        return new Response(null, {
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        });
      }

      // Static file serving
      let filePath = pathname === "/" ? "/index.html" : pathname;
      filePath = filePath.startsWith("/") ? filePath.slice(1) : filePath;

      if (filePath.includes("..")) {
        return new Response("Forbidden", { status: 403 });
      }

      const fullPath = join(OUT_DIR, filePath);

      if (!existsSync(fullPath)) {
        return new Response("Not Found", { status: 404 });
      }

      const fileContent = readFileSync(fullPath);

      let contentType = "text/plain";
      if (filePath.endsWith(".html")) contentType = "text/html; charset=utf-8";
      else if (filePath.endsWith(".svg")) contentType = "image/svg+xml";
      else if (filePath.endsWith(".json")) contentType = "application/json";
      else if (filePath.endsWith(".js")) contentType = "application/javascript";
      else if (filePath.endsWith(".css")) contentType = "text/css";

      return new Response(fileContent, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "no-cache",
          "Access-Control-Allow-Origin": "*",
        },
      });
    } catch (error) {
      console.error("Server error:", error);
      return new Response(JSON.stringify({ error: String(error) }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
  },
});

console.log(`
╔════════════════════════════════════════════════════════════════╗
║       ✨ tscircuit + Schematic Editor Server Started ✨         ║
╚════════════════════════════════════════════════════════════════╝

🌐 Server running at: http://localhost:${PORT}
📂 Serving files from: ${OUT_DIR}
📁 Patches stored at: ${PATCHES_DIR}

📋 API Endpoints:
   • GET  /api/patches           → List all patches
   • GET  /api/patches/:id       → Get patch details
   • POST /api/patches           → Create/save patch
   • POST /api/patches/import    → Import patch

📋 Static Files:
   • http://localhost:${PORT}              → Main viewer
   • http://localhost:${PORT}/blink-schematic.svg  → SVG file

💡 Press Ctrl+C to stop the server
`);
