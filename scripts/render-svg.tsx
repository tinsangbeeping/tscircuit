#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import { runTscircuitCode } from "@tscircuit/eval";
import { convertCircuitJsonToSchematicSvg } from "circuit-to-svg";

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error("Usage: npx tsx scripts/render-svg.tsx <component-file> [out.svg]");
    process.exit(2);
  }
  const compFile = path.resolve(args[0]);
  const outFile = path.resolve(args[1] ?? "out.svg");

  if (!fs.existsSync(compFile)) {
    console.error("Component file not found:", compFile);
    process.exit(3);
  }

  // Read the component file
  let code = fs.readFileSync(compFile, "utf8");

  // Inject import for c if not already present
  if (/\bc\.[A-Z]/.test(code) && !/import\s+.*\bc\b|import\s*\*\s*as\s+c\b/.test(code)) {
    console.log("Injecting 'import * as c from \"@tscircuit/core\"'");
    code = 'import * as c from "@tscircuit/core";\n' + code;
  }

  // If the file only has a named export (e.g., `export const Circuit`), wrap it to have a default export
  if (code.includes("export const Circuit") && !code.includes("export default")) {
    console.log("Converting named export to default export");
    code = code.replace(/export const Circuit/, "const Circuit");
    code += "\nexport default Circuit;\n";
  }

  console.log("Executing TSCircuit code from", compFile);
  const circuitJson = await runTscircuitCode(code);
  const svg = convertCircuitJsonToSchematicSvg(circuitJson);

  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, svg, "utf8");
  console.log("Wrote", outFile);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
