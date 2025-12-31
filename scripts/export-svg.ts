#!/usr/bin/env bun
/**
 * Generic Circuit to SVG Export Script
 * 
 * Usage:
 *   bun scripts/export-svg.ts <circuit-file.tsx> [output.svg]
 * 
 * Example:
 *   bun scripts/export-svg.ts tests/blink.tscircuit.tsx out/blink.svg
 */

import { writeFileSync, mkdirSync, existsSync } from "fs"
import { join, dirname, resolve } from "path"
import { circuitToSvg } from "circuit-to-svg"

const args = process.argv.slice(2)

if (args.length === 0) {
  console.error(`
📖 Circuit to SVG Export Tool

Usage:
  bun scripts/export-svg.ts <circuit-file> [output.svg]

Example:
  bun scripts/export-svg.ts tests/blink.tscircuit.tsx out/blink.svg
  
Options:
  circuit-file    Path to .tscircuit.tsx file (required)
  output.svg      Output SVG file path (optional, defaults to out/[circuit-name].svg)
`)
  process.exit(1)
}

const circuitFile = args[0]
const outputFile = args[1] || join("out", `${circuitFile.split("/").pop()?.replace(".tscircuit.tsx", "") || "circuit"}.svg`)

if (!existsSync(circuitFile)) {
  console.error(`❌ Circuit file not found: ${circuitFile}`)
  process.exit(1)
}

try {
  console.log(`📦 Loading circuit from: ${circuitFile}`)
  
  // Dynamically import the circuit
  const circuitModule = await import(resolve(circuitFile))
  const CircuitComponent = circuitModule.Circuit
  
  if (!CircuitComponent) {
    throw new Error("Circuit component not found. Make sure your file exports a 'Circuit' component.")
  }
  
  // Import Circuit class
  const { Circuit } = await import("../dist/index.js")
  
  // Create and render the circuit
  const circuit = new Circuit()
  circuit.add(CircuitComponent)
  circuit.render()
  
  const circuitJson = circuit.getCircuitJson()
  
  console.log("✅ Circuit rendered successfully")
  
  // Convert to SVG
  const svgString = await circuitToSvg({
    circuitJson: circuitJson,
    mode: "schematic",
  })
  
  // Create output directory
  mkdirSync(dirname(outputFile), { recursive: true })
  
  // Write SVG file
  writeFileSync(outputFile, svgString)
  
  console.log(`✅ SVG exported successfully to: ${outputFile}`)
  console.log(`📊 File size: ${(Buffer.byteLength(svgString) / 1024).toFixed(2)} KB`)
  
} catch (error) {
  console.error("❌ Error:", error instanceof Error ? error.message : error)
  process.exit(1)
}
