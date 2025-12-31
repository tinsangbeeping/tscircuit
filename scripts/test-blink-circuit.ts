#!/usr/bin/env bun
import React from "react"
import { Circuit } from "../dist/index.js"

// Create and render the circuit
const circuit = new Circuit()

// Add circuit using simple element creation
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

console.log("Circuit JSON:")
console.log(JSON.stringify(circuitJson, null, 2))
