import React from "react";
import * as c from "@tscircuit/core";
export const Circuit = () => (
  <c.Schematic>
    <c.Resistor name="R1" netlist={{ a: "VCC", b: "N1" }} />
    <c.LED name="D1" netlist={{ a: "N1", b: "GND" }} />
  </c.Schematic>
)
