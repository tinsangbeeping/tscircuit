#!/usr/bin/env bun
import { serve } from "bun";
import { join } from "path";
import { readFileSync, existsSync } from "fs";

const PORT = 3000;
const OUT_DIR = join(import.meta.dir, "./out");

const server = serve({
  port: PORT,
  async fetch(req) {
    try {
      const url = new URL(req.url);
      let filePath = url.pathname === "/" ? "/index.html" : url.pathname;

      // Remove leading slash
      filePath = filePath.startsWith("/") ? filePath.slice(1) : filePath;

      // Prevent directory traversal
      if (filePath.includes("..")) {
        return new Response("Forbidden", { status: 403 });
      }

      const fullPath = join(OUT_DIR, filePath);

      // Check if file exists
      if (!existsSync(fullPath)) {
        return new Response("Not Found", { status: 404 });
      }

      // Read file
      const fileContent = readFileSync(fullPath);

      // Determine content type
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
      return new Response("Internal Server Error", { status: 500 });
    }
  },
});

console.log(`
╔════════════════════════════════════════════════════════════════╗
║          ✨ tscircuit SVG Viewer Server Started ✨              ║
╚════════════════════════════════════════════════════════════════╝

🌐 Server running at: http://localhost:${PORT}
📂 Serving files from: ${OUT_DIR}

📋 Available endpoints:
   • http://localhost:${PORT}              → Main viewer
   • http://localhost:${PORT}/blink-schematic.svg  → SVG file
   • http://localhost:${PORT}/index.html   → HTML viewer

💡 Press Ctrl+C to stop the server
`);
