#!/usr/bin/env bun
import React from "react"
import { Circuit } from "./dist/index.js"
import { convertCircuitJsonToSchematicSvg } from "circuit-to-svg"

const circuit = new Circuit()

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

const circuitJson = circuit.getCircuitJson()

console.log("Circuit JSON keys:", Object.keys(circuitJson))
console.log("Components count:", circuitJson.components?.length)
console.log("Nets count:", circuitJson.nets?.length)

try {
  const svgString = convertCircuitJsonToSchematicSvg(circuitJson)
  console.log("SVG type:", typeof svgString)
  if (svgString) {
    console.log("SVG length:", svgString.length)
    console.log("SVG starts with:", svgString.substring(0, 100))
  } else {
    console.log("SVG is undefined or null")
  }
} catch (e) {
  console.error("Error converting:", e.message)
}
