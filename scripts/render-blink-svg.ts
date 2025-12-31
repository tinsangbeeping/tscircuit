#!/usr/bin/env bun
/** @jsx React.createElement */
import React from "react"
import { Circuit } from "../dist/index.js"
import { convertCircuitJsonToSchematicSvg } from "circuit-to-svg"
import { writeFileSync, mkdirSync } from "fs"
import { join } from "path"

// Create output directory
const outputDir = join(import.meta.dir, "../out")
mkdirSync(outputDir, { recursive: true })

// Create and render the circuit
const circuit = new Circuit()

// Add circuit using JSX syntax
circuit.add(
  React.createElement("board", { width: "10mm", height: "10mm" },
    React.createElement("battery", {
      name: "VCC1",
      voltage: "5V",
      pcbX: "1mm",
      pcbY: "1mm",
    }),
    React.createElement("resistor", {
      name: "R1",
      resistance: "220ohm",
      pcbX: "4mm",
      pcbY: "1mm",
      footprint: "0805",
    }),
    React.createElement("led", {
      name: "D1",
      pcbX: "6mm",
      pcbY: "1mm",
      footprint: "0805",
    }),
    React.createElement("trace", { path: [".VCC1 > .pos", ".R1 > .left"] }),
    React.createElement("trace", { path: [".R1 > .right", ".D1 > .anode"] }),
    React.createElement("trace", { path: [".D1 > .cathode"] })
  )
)

circuit.render()

// Get circuit JSON
const circuitJson = circuit.getCircuitJson()

console.log("✅ Circuit created successfully")

// Convert to schematic SVG using circuit-to-svg library
let svgContent = ""

try {
  const schematicSvg = convertCircuitJsonToSchematicSvg(circuitJson)
  
  if (schematicSvg) {
    svgContent = schematicSvg
    console.log("✨ Using circuit-to-svg schematic converter")
  } else {
    throw new Error("Schematic converter returned undefined")
  }
} catch (err) {
  console.warn("⚠️  Schematic converter failed:", err instanceof Error ? err.message : String(err))
  
  // Fallback to manual SVG if converter fails
  svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg viewBox="0 0 1000 500" xmlns="http://www.w3.org/2000/svg">
  <rect width="1000" height="500" fill="#f8f9fa"/>
  <text x="500" y="40" font-size="28px" font-weight="bold" fill="#2c3e50" text-anchor="middle">Blink LED Circuit</text>
</svg>`
}

// Write SVG file
const outputPath = join(outputDir, "blink-schematic.svg")
writeFileSync(outputPath, svgContent)

const sizeKB = (Buffer.byteLength(svgContent) / 1024).toFixed(2)
console.log(`✅ SVG created: ${outputPath}`)
console.log(`📊 File size: ${sizeKB} KB`)
console.log(`✨ Ready to view in browser!`)
