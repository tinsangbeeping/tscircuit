import { Patch } from './schematic'
import { createComponentInstance, createConnection } from './schematic'

/**
 * Predefined reusable circuit patches/blocks
 */

/**
 * UART Communication Patch
 * Includes MCU pins, level shifter, and connector
 */
export const UARTPatch: Patch = {
  id: 'patch-uart-001',
  name: 'UART Interface',
  description: 'Complete UART interface: MCU UART pins + level shifter + DB9/USB connector',
  version: '1.0.0',
  tags: ['communication', 'uart', 'serial', 'rs232'],
  externalPins: ['TX_MCU', 'RX_MCU', 'TX_HOST', 'RX_HOST', 'VCC', 'GND'],
  components: [
    createComponentInstance('chip', 'U1', 50, 50, {
      chipName: 'STM32F401',
      footprint: 'LQFP64'
    }),
    createComponentInstance('chip', 'U2', 250, 50, {
      chipName: 'MAX3232',
      footprint: 'SOIC16'
    }),
    createComponentInstance('capacitor', 'C1', 300, 100, {
      capacitance: '100nF',
      footprint: '0805'
    }),
    createComponentInstance('capacitor', 'C2', 320, 100, {
      capacitance: '100nF',
      footprint: '0805'
    }),
    createComponentInstance('connector', 'J1', 450, 50, {
      connectorType: 'DB9',
      pins: 9
    })
  ],
  connections: [
    createConnection('TX', ['U1.pa9', 'U2.t1in']),
    createConnection('RX', ['U1.pa10', 'U2.r1out']),
    createConnection('VCC', ['U1.vcc', 'U2.vcc']),
    createConnection('GND', ['U1.gnd', 'U2.gnd']),
    createConnection('TX_DB9', ['U2.t1out', 'J1.p2']),
    createConnection('RX_DB9', ['U2.r1in', 'J1.p3'])
  ]
}

/**
 * LED Blink Patch
 * Simple LED driven by resistor from VCC
 */
export const LedBlinkPatch: Patch = {
  id: 'patch-led-blink-001',
  name: 'LED Blink Circuit',
  description: 'Simple LED circuit with current limiting resistor',
  version: '1.0.0',
  tags: ['led', 'indicator', 'simple'],
  externalPins: ['VCC', 'GND', 'LED_PIN'],
  components: [
    createComponentInstance('battery', 'VCC1', 50, 50, {
      voltage: '5V'
    }),
    createComponentInstance('resistor', 'R1', 150, 50, {
      resistance: '220ohm',
      footprint: '0805'
    }),
    createComponentInstance('led', 'D1', 250, 50, {
      color: 'red',
      footprint: '0805'
    })
  ],
  connections: [
    createConnection('VCC', ['VCC1.pos', 'R1.left']),
    createConnection('LED_ANODE', ['R1.right', 'D1.anode']),
    createConnection('GND', ['D1.cathode', 'VCC1.neg'])
  ]
}

/**
 * Power Regulator Patch
 * Takes raw DC input and produces regulated 5V and 3.3V outputs
 */
export const PowerRegulatorPatch: Patch = {
  id: 'patch-power-reg-001',
  name: 'Power Supply Regulator',
  description: 'Dual voltage regulator: 5V and 3.3V from raw DC input',
  version: '1.0.0',
  tags: ['power', 'regulator', 'supply'],
  externalPins: ['VIN', 'GND', 'VOUT_5V', 'VOUT_3V3'],
  components: [
    createComponentInstance('chip', 'U1', 50, 50, {
      chipName: 'LM7805',
      footprint: 'TO220'
    }),
    createComponentInstance('chip', 'U2', 200, 50, {
      chipName: 'AMS1117-3.3',
      footprint: 'SOT223'
    }),
    createComponentInstance('capacitor', 'C1', 50, 150, {
      capacitance: '10uF',
      footprint: '1206'
    }),
    createComponentInstance('capacitor', 'C2', 100, 150, {
      capacitance: '100nF',
      footprint: '0805'
    }),
    createComponentInstance('capacitor', 'C3', 200, 150, {
      capacitance: '10uF',
      footprint: '1206'
    }),
    createComponentInstance('capacitor', 'C4', 250, 150, {
      capacitance: '100nF',
      footprint: '0805'
    })
  ],
  connections: [
    createConnection('VIN', ['U1.vin', 'U2.vin', 'C1.p1']),
    createConnection('GND', ['U1.gnd', 'U2.gnd', 'C1.p2', 'C2.p2', 'C3.p2', 'C4.p2']),
    createConnection('VOUT_5V', ['U1.vout', 'C2.p1']),
    createConnection('VOUT_3V3', ['U2.vout', 'C4.p1'])
  ]
}

/**
 * Sensor Interface Patch
 * Analog sensor with filtering and biasing
 */
export const SensorInterfacePatch: Patch = {
  id: 'patch-sensor-001',
  name: 'Analog Sensor Interface',
  description: 'Sensor circuit with RC low-pass filter',
  version: '1.0.0',
  tags: ['sensor', 'analog', 'filter'],
  externalPins: ['VCC', 'GND', 'SENSOR_IN', 'ADC_OUT'],
  components: [
    createComponentInstance('resistor', 'R1', 50, 50, {
      resistance: '10kohm',
      footprint: '0805'
    }),
    createComponentInstance('capacitor', 'C1', 150, 50, {
      capacitance: '100nF',
      footprint: '0805'
    })
  ],
  connections: [
    createConnection('SENSOR_IN', ['R1.left']),
    createConnection('ADC_NODE', ['R1.right', 'C1.p1']),
    createConnection('GND', ['C1.p2'])
  ]
}

/**
 * All available patches
 */
export const PATCH_LIBRARY: Patch[] = [
  UARTPatch,
  LedBlinkPatch,
  PowerRegulatorPatch,
  SensorInterfacePatch
]

/**
 * Get a patch by ID
 */
export function getPatchById(id: string): Patch | undefined {
  return PATCH_LIBRARY.find(p => p.id === id)
}

/**
 * Get patches by tag
 */
export function getPatchesByTag(tag: string): Patch[] {
  return PATCH_LIBRARY.filter(p => p.tags.includes(tag))
}

/**
 * Get all available tags
 */
export function getAllPatchTags(): string[] {
  const tags = new Set<string>()
  PATCH_LIBRARY.forEach(patch => {
    patch.tags.forEach(tag => tags.add(tag))
  })
  return Array.from(tags).sort()
}
