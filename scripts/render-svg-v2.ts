#!/usr/bin/env bun
import React from "react"
import { Circuit } from "../dist/index.js"
import { writeFileSync, mkdirSync } from "fs"
import { join } from "path"
import { convertCircuitJsonToSchematicSvg } from "circuit-to-svg"
import { stringify } from "svgson"

// Create output directory
const outputDir = join(import.meta.dir, "../out")
mkdirSync(outputDir, { recursive: true })

// Create and render the circuit
const circuit = new Circuit()

// Add circuit
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
console.log(`📊 Circuit JSON has ${circuitJson.length} elements`)

// Try to convert to SVG
try {
  console.log("🔄 Converting to schematic SVG...")
  const svgObjects = await convertCircuitJsonToSchematicSvg(circuitJson as any)
  
  console.log(`📊 Generated ${svgObjects ? "SVG objects" : "empty SVG"}`)
  
  if (svgObjects) {
    const svgString = stringify(svgObjects as any)
    
    const outputPath = join(outputDir, "blink-schematic.svg")
    writeFileSync(outputPath, svgString)
    console.log(`✅ SVG exported to: ${outputPath}`)
    console.log(`📊 File size: ${(Buffer.byteLength(svgString) / 1024).toFixed(2)} KB`)
    console.log(`First 200 chars: ${svgString.substring(0, 200)}`)
  } else {
    console.log("⚠️  No SVG objects generated")
  }
} catch (error) {
  console.error("❌ Error during SVG conversion:", error)
}
