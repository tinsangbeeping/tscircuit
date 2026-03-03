/**
 * TSCircuit Component Library - Extracted from @tscircuit/core
 * These are the available components that can be used in the schematic editor
 */

export type ComponentType = 
  | 'battery'
  | 'resistor'
  | 'capacitor'
  | 'inductor'
  | 'led'
  | 'transistor'
  | 'diode'
  | 'chip'
  | 'connector'
  | 'switch'
  | 'trace'
  | 'board'

export interface ComponentPin {
  id: string
  name: string
  type: 'power' | 'ground' | 'signal' | 'data'
  voltage?: string
}

export interface ComponentSpec {
  type: ComponentType
  name: string
  displayName: string
  description: string
  pins: ComponentPin[]
  defaultProperties?: Record<string, unknown>
  category: 'passive' | 'active' | 'connector' | 'power' | 'misc'
  icon?: string
}

/**
 * Complete TSCircuit Component Library
 * Based on @tscircuit/core and schematic-symbols packages
 */
export const COMPONENT_LIBRARY: ComponentSpec[] = [
  // Power Components
  {
    type: 'battery',
    name: 'battery',
    displayName: 'Battery / Voltage Source',
    description: 'DC voltage source',
    category: 'power',
    pins: [
      { id: 'pos', name: 'POS', type: 'power', voltage: '+' },
      { id: 'neg', name: 'NEG', type: 'ground', voltage: '-' }
    ],
    defaultProperties: {
      voltage: '5V',
      pcbX: '0mm',
      pcbY: '0mm'
    }
  },
  // Passive Components
  {
    type: 'resistor',
    name: 'resistor',
    displayName: 'Resistor',
    description: 'Current limiting element',
    category: 'passive',
    pins: [
      { id: 'left', name: 'L', type: 'signal' },
      { id: 'right', name: 'R', type: 'signal' }
    ],
    defaultProperties: {
      resistance: '1kohm',
      footprint: '0805',
      pcbX: '0mm',
      pcbY: '0mm'
    }
  },
  {
    type: 'capacitor',
    name: 'capacitor',
    displayName: 'Capacitor',
    description: 'Charge storage element',
    category: 'passive',
    pins: [
      { id: 'p1', name: 'P1', type: 'signal' },
      { id: 'p2', name: 'P2', type: 'signal' }
    ],
    defaultProperties: {
      capacitance: '100nF',
      footprint: '0805',
      pcbX: '0mm',
      pcbY: '0mm'
    }
  },
  {
    type: 'inductor',
    name: 'inductor',
    displayName: 'Inductor',
    description: 'Magnetic energy storage',
    category: 'passive',
    pins: [
      { id: 'p1', name: 'P1', type: 'signal' },
      { id: 'p2', name: 'P2', type: 'signal' }
    ],
    defaultProperties: {
      inductance: '10uH',
      footprint: '0805',
      pcbX: '0mm',
      pcbY: '0mm'
    }
  },
  // Diode & LED
  {
    type: 'led',
    name: 'led',
    displayName: 'LED',
    description: 'Light Emitting Diode',
    category: 'active',
    pins: [
      { id: 'anode', name: 'ANODE', type: 'signal' },
      { id: 'cathode', name: 'CATHODE', type: 'signal' }
    ],
    defaultProperties: {
      color: 'red',
      footprint: '0805',
      pcbX: '0mm',
      pcbY: '0mm'
    }
  },
  {
    type: 'diode',
    name: 'diode',
    displayName: 'Diode',
    description: 'Signal/power diode',
    category: 'active',
    pins: [
      { id: 'anode', name: 'ANODE', type: 'signal' },
      { id: 'cathode', name: 'CATHODE', type: 'signal' }
    ],
    defaultProperties: {
      footprint: '0805',
      pcbX: '0mm',
      pcbY: '0mm'
    }
  },
  // Transistors
  {
    type: 'transistor',
    name: 'transistor',
    displayName: 'BJT Transistor',
    description: 'Bipolar Junction Transistor (NPN/PNP)',
    category: 'active',
    pins: [
      { id: 'base', name: 'BASE', type: 'signal' },
      { id: 'collector', name: 'COLLECTOR', type: 'signal' },
      { id: 'emitter', name: 'EMITTER', type: 'signal' }
    ],
    defaultProperties: {
      type: 'NPN',
      footprint: 'SOT23',
      pcbX: '0mm',
      pcbY: '0mm'
    }
  },
  // Integrated Circuits
  {
    type: 'chip',
    name: 'chip',
    displayName: 'Integrated Circuit (IC)',
    description: 'Microcontroller, UART, Op-Amp, etc',
    category: 'active',
    pins: [
      { id: 'p1', name: 'Pin 1', type: 'signal' },
      { id: 'p2', name: 'Pin 2', type: 'signal' },
      { id: 'p3', name: 'Pin 3', type: 'signal' },
      { id: 'p4', name: 'Pin 4', type: 'signal' }
    ],
    defaultProperties: {
      chipName: 'TBD',
      footprint: 'DIP8',
      pcbX: '0mm',
      pcbY: '0mm'
    }
  },
  // Common ICs (examples)
  {
    type: 'chip',
    name: 'STM32F401',
    displayName: 'STM32F401 Microcontroller',
    description: 'ARM Cortex-M4 Microcontroller',
    category: 'active',
    pins: [
      { id: 'vcc', name: 'VCC', type: 'power', voltage: '+' },
      { id: 'gnd', name: 'GND', type: 'ground', voltage: '-' },
      { id: 'pa9', name: 'PA9 (TX)', type: 'signal' },
      { id: 'pa10', name: 'PA10 (RX)', type: 'signal' }
    ],
    defaultProperties: {
      chipName: 'STM32F401',
      footprint: 'LQFP64',
      pcbX: '0mm',
      pcbY: '0mm'
    }
  },
  {
    type: 'chip',
    name: 'MAX3232',
    displayName: 'MAX3232 UART Level Shifter',
    description: '3.3V to RS-232 level converter',
    category: 'active',
    pins: [
      { id: 'vcc', name: 'VCC', type: 'power', voltage: '+' },
      { id: 'gnd', name: 'GND', type: 'ground', voltage: '-' },
      { id: 't1in', name: 'T1IN', type: 'signal' },
      { id: 'r1out', name: 'R1OUT', type: 'signal' }
    ],
    defaultProperties: {
      chipName: 'MAX3232',
      footprint: 'SOIC16',
      pcbX: '0mm',
      pcbY: '0mm'
    }
  },
  {
    type: 'chip',
    name: 'LM7805',
    displayName: 'LM7805 Voltage Regulator',
    description: '5V Linear Voltage Regulator',
    category: 'power',
    pins: [
      { id: 'vin', name: 'VIN', type: 'power', voltage: 'in' },
      { id: 'gnd', name: 'GND', type: 'ground', voltage: '-' },
      { id: 'vout', name: 'VOUT', type: 'power', voltage: '+5V' }
    ],
    defaultProperties: {
      chipName: 'LM7805',
      footprint: 'TO220',
      pcbX: '0mm',
      pcbY: '0mm'
    }
  },
  // Connectors
  {
    type: 'connector',
    name: 'connector',
    displayName: 'Connector',
    description: 'Header, USB, or other connector',
    category: 'connector',
    pins: [
      { id: 'p1', name: 'P1', type: 'signal' },
      { id: 'p2', name: 'P2', type: 'signal' }
    ],
    defaultProperties: {
      connectorType: 'Header',
      pins: 2,
      pcbX: '0mm',
      pcbY: '0mm'
    }
  },
  // Switch
  {
    type: 'switch',
    name: 'switch',
    displayName: 'Switch',
    description: 'Mechanical or electronic switch',
    category: 'misc',
    pins: [
      { id: 'p1', name: 'P1', type: 'signal' },
      { id: 'p2', name: 'P2', type: 'signal' }
    ],
    defaultProperties: {
      switchType: 'Momentary',
      pcbX: '0mm',
      pcbY: '0mm'
    }
  }
]

/**
 * Get component spec by type or name
 */
export function getComponentSpec(typeOrName: string): ComponentSpec | undefined {
  return COMPONENT_LIBRARY.find(c => c.type === typeOrName || c.name === typeOrName)
}

/**
 * Get all components by category
 */
export function getComponentsByCategory(category: ComponentSpec['category']): ComponentSpec[] {
  return COMPONENT_LIBRARY.filter(c => c.category === category)
}

/**
 * Group components by category for UI organization
 */
export function getGroupedComponents(): Record<string, ComponentSpec[]> {
  const grouped: Record<string, ComponentSpec[]> = {}
  
  COMPONENT_LIBRARY.forEach(component => {
    if (!grouped[component.category]) {
      grouped[component.category] = []
    }
    grouped[component.category].push(component)
  })
  
  return grouped
}
