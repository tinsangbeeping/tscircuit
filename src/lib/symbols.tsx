/**
 * TSCircuit SVG Symbol Definitions
 * Real schematic symbols for circuit components
 */

export interface SymbolProps {
  x: number
  y: number
  rotation: 0 | 90 | 180 | 270
  selected?: boolean
}

/**
 * Resistor symbol (zigzag)
 */
export function ResistorSymbol({ x, y, rotation }: SymbolProps) {
  const transform = `translate(${x},${y}) rotate(${rotation})`
  return (
    <g transform={transform} className="component-symbol">
      {/* Left lead */}
      <line x1="-25" y1="0" x2="-15" y2="0" stroke="#333" strokeWidth="2" />
      {/* Zigzag */}
      <path
        d="M -15,0 L -10,-3 L -5,3 L 0,-3 L 5,3 L 10,-3 L 15,0"
        fill="none"
        stroke="#333"
        strokeWidth="2"
      />
      {/* Right lead */}
      <line x1="15" y1="0" x2="25" y2="0" stroke="#333" strokeWidth="2" />
    </g>
  )
}

/**
 * Capacitor symbol (two parallel lines)
 */
export function CapacitorSymbol({ x, y, rotation }: SymbolProps) {
  const transform = `translate(${x},${y}) rotate(${rotation})`
  return (
    <g transform={transform} className="component-symbol">
      {/* Left lead */}
      <line x1="-25" y1="0" x2="-5" y2="0" stroke="#333" strokeWidth="2" />
      {/* Top plate */}
      <line x1="-5" y1="-8" x2="-5" y2="8" stroke="#333" strokeWidth="2" />
      {/* Bottom plate */}
      <line x1="5" y1="-8" x2="5" y2="8" stroke="#333" strokeWidth="2" />
      {/* Right lead */}
      <line x1="5" y1="0" x2="25" y2="0" stroke="#333" strokeWidth="2" />
    </g>
  )
}

/**
 * LED symbol (diode with arrows)
 */
export function LEDSymbol({ x, y, rotation }: SymbolProps) {
  const transform = `translate(${x},${y}) rotate(${rotation})`
  return (
    <g transform={transform} className="component-symbol">
      {/* Left lead */}
      <line x1="-25" y1="0" x2="-10" y2="0" stroke="#333" strokeWidth="2" />
      {/* Triangle (diode) */}
      <polygon points="-10,-8 -10,8 10,0" fill="none" stroke="#333" strokeWidth="2" />
      {/* Bar */}
      <line x1="10" y1="-8" x2="10" y2="8" stroke="#333" strokeWidth="2" />
      {/* Right lead */}
      <line x1="10" y1="0" x2="25" y2="0" stroke="#333" strokeWidth="2" />
      {/* Light arrows */}
      <line x1="15" y1="-10" x2="20" y2="-15" stroke="#ff6600" strokeWidth="1.5" />
      <line x1="20" y1="-15" x2="18" y2="-12" stroke="#ff6600" strokeWidth="1.5" />
      <line x1="20" y1="-5" x2="25" y2="-10" stroke="#ff6600" strokeWidth="1.5" />
      <line x1="25" y1="-10" x2="23" y2="-7" stroke="#ff6600" strokeWidth="1.5" />
    </g>
  )
}

/**
 * Battery symbol (long/short lines)
 */
export function BatterySymbol({ x, y, rotation }: SymbolProps) {
  const transform = `translate(${x},${y}) rotate(${rotation})`
  return (
    <g transform={transform} className="component-symbol">
      {/* Left lead */}
      <line x1="-25" y1="0" x2="-12" y2="0" stroke="#333" strokeWidth="2" />
      {/* Negative pole (short line) */}
      <line x1="-12" y1="-8" x2="-12" y2="8" stroke="#333" strokeWidth="3" />
      {/* Positive pole (long line) */}
      <line x1="2" y1="-10" x2="2" y2="10" stroke="#333" strokeWidth="5" />
      {/* Right lead */}
      <line x1="12" y1="0" x2="25" y2="0" stroke="#333" strokeWidth="2" />
      {/* + sign */}
      <text x="2" y="4" fontSize="12" fill="#333" textAnchor="middle">+</text>
    </g>
  )
}

/**
 * Transistor NPN symbol
 */
export function TransistorNPNSymbol({ x, y, rotation }: SymbolProps) {
  const transform = `translate(${x},${y}) rotate(${rotation})`
  return (
    <g transform={transform} className="component-symbol">
      {/* Base lead (left) */}
      <line x1="-25" y1="0" x2="-5" y2="0" stroke="#333" strokeWidth="2" />
      {/* Vertical line (base) */}
      <line x1="-5" y1="-10" x2="-5" y2="10" stroke="#333" strokeWidth="2" />
      {/* Collector lead (top-right) */}
      <line x1="-5" y1="-10" x2="10" y2="-20" stroke="#333" strokeWidth="2" />
      <line x1="10" y1="-20" x2="10" y2="-25" stroke="#333" strokeWidth="2" />
      {/* Emitter lead (bottom-right) */}
      <line x1="-5" y1="10" x2="10" y2="20" stroke="#333" strokeWidth="2" />
      <line x1="10" y1="20" x2="10" y2="25" stroke="#333" strokeWidth="2" />
      {/* Arrow on emitter */}
      <polygon points="10,20 15,18 12,13" fill="#333" />
    </g>
  )
}

/**
 * Diode symbol
 */
export function DiodeSymbol({ x, y, rotation }: SymbolProps) {
  const transform = `translate(${x},${y}) rotate(${rotation})`
  return (
    <g transform={transform} className="component-symbol">
      {/* Left lead */}
      <line x1="-25" y1="0" x2="-10" y2="0" stroke="#333" strokeWidth="2" />
      {/* Triangle */}
      <polygon points="-10,-8 -10,8 10,0" fill="none" stroke="#333" strokeWidth="2" />
      {/* Bar */}
      <line x1="10" y1="-8" x2="10" y2="8" stroke="#333" strokeWidth="2" />
      {/* Right lead */}
      <line x1="10" y1="0" x2="25" y2="0" stroke="#333" strokeWidth="2" />
    </g>
  )
}

/**
 * Inductor symbol (coil)
 */
export function InductorSymbol({ x, y, rotation }: SymbolProps) {
  const transform = `translate(${x},${y}) rotate(${rotation})`
  return (
    <g transform={transform} className="component-symbol">
      {/* Left lead */}
      <line x1="-25" y1="0" x2="-12" y2="0" stroke="#333" strokeWidth="2" />
      {/* Coils */}
      <path
        d="M -12,0 Q -8,-5 -4,0 Q 0,-5 4,0 Q 8,-5 12,0"
        fill="none"
        stroke="#333"
        strokeWidth="2"
      />
      {/* Right lead */}
      <line x1="12" y1="0" x2="25" y2="0" stroke="#333" strokeWidth="2" />
    </g>
  )
}

/**
 * Switch symbol
 */
export function SwitchSymbol({ x, y, rotation }: SymbolProps) {
  const transform = `translate(${x},${y}) rotate(${rotation})`
  return (
    <g transform={transform} className="component-symbol">
      {/* Left lead */}
      <line x1="-25" y1="0" x2="-10" y2="0" stroke="#333" strokeWidth="2" />
      {/* Circle (contact 1) */}
      <circle cx="-10" cy="0" r="3" fill="#333" />
      {/* Moving contact line */}
      <line x1="-10" y1="0" x2="5" y2="-8" stroke="#333" strokeWidth="2" />
      {/* Circle (contact 2) */}
      <circle cx="10" cy="-6" r="3" fill="#333" />
      {/* Right lead */}
      <line x1="10" y1="-6" x2="25" y2="-6" stroke="#333" strokeWidth="2" />
    </g>
  )
}

/**
 * Connector symbol (headers)
 */
export function ConnectorSymbol({ x, y, rotation }: SymbolProps) {
  const transform = `translate(${x},${y}) rotate(${rotation})`
  return (
    <g transform={transform} className="component-symbol">
      {/* Two circles */}
      <circle cx="-5" cy="0" r="3" fill="#333" />
      <circle cx="5" cy="0" r="3" fill="#333" />
      {/* Connecting box */}
      <rect x="-8" y="-6" width="16" height="12" fill="none" stroke="#333" strokeWidth="1.5" rx="2" />
    </g>
  )
}

/**
 * IC Chip symbol
 */
export function ChipSymbol({ x, y, rotation }: SymbolProps) {
  const transform = `translate(${x},${y}) rotate(${rotation})`
  return (
    <g transform={transform} className="component-symbol">
      {/* Main rectangle */}
      <rect x="-15" y="-15" width="30" height="30" fill="none" stroke="#333" strokeWidth="2" rx="2" />
      {/* Orientation dot */}
      <circle cx="-12" cy="-12" r="2" fill="#333" />
      {/* Pin indicators (left side) */}
      <line x1="-15" y1="-8" x2="-20" y2="-8" stroke="#333" strokeWidth="1" />
      <line x1="-15" y1="0" x2="-20" y2="0" stroke="#333" strokeWidth="1" />
      <line x1="-15" y1="8" x2="-20" y2="8" stroke="#333" strokeWidth="1" />
      {/* Pin indicators (right side) */}
      <line x1="15" y1="-8" x2="20" y2="-8" stroke="#333" strokeWidth="1" />
      <line x1="15" y1="0" x2="20" y2="0" stroke="#333" strokeWidth="1" />
      <line x1="15" y1="8" x2="20" y2="8" stroke="#333" strokeWidth="1" />
    </g>
  )
}

/**
 * Get symbol component by type
 */
export function getSymbolComponent(
  type: string,
  x: number,
  y: number,
  rotation: 0 | 90 | 180 | 270 = 0,
  selected?: boolean
) {
  const props = { x, y, rotation, selected }

  switch (type) {
    case 'resistor':
      return <ResistorSymbol {...props} />
    case 'capacitor':
      return <CapacitorSymbol {...props} />
    case 'led':
      return <LEDSymbol {...props} />
    case 'battery':
      return <BatterySymbol {...props} />
    case 'transistor':
      return <TransistorNPNSymbol {...props} />
    case 'diode':
      return <DiodeSymbol {...props} />
    case 'inductor':
      return <InductorSymbol {...props} />
    case 'switch':
      return <SwitchSymbol {...props} />
    case 'connector':
      return <ConnectorSymbol {...props} />
    case 'chip':
      return <ChipSymbol {...props} />
    default:
      return <ChipSymbol {...props} />
  }
}

/**
 * Export all symbols as a record for easy access
 */
export const SYMBOLS = {
  resistor: ResistorSymbol,
  capacitor: CapacitorSymbol,
  led: LEDSymbol,
  battery: BatterySymbol,
  transistor: TransistorNPNSymbol,
  diode: DiodeSymbol,
  inductor: InductorSymbol,
  switch: SwitchSymbol,
  connector: ConnectorSymbol,
  chip: ChipSymbol
}
