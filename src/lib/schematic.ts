import { ComponentType } from './components'

/**
 * Represents an instance of a component on the board
 */
export interface SchematicComponent {
  id: string
  type: ComponentType
  name: string
  x: number
  y: number
  rotation: 0 | 90 | 180 | 270
  properties: Record<string, unknown>
  selected?: boolean
}

/**
 * Represents a connection between two pins
 */
export interface Connection {
  id: string
  net: string // Net name like "TX", "RX", "VCC", etc
  connections: string[] // Array of "componentId.pinId"
}

/**
 * Represents the complete schematic
 */
export interface Schematic {
  id: string
  name: string
  description: string
  components: SchematicComponent[]
  connections: Connection[]
  canvasWidth: number
  canvasHeight: number
  created: Date
  modified: Date
}

/**
 * Represents a reusable patch/subcircuit
 */
export interface Patch {
  id: string
  name: string
  description: string
  version: string
  components: SchematicComponent[]
  connections: Connection[]
  externalPins: string[] // Pins exposed for external connections
  tags: string[]
}

/**
 * Create a new empty schematic
 */
export function createSchematic(name: string, description: string = ''): Schematic {
  return {
    id: `sch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    description,
    components: [],
    connections: [],
    canvasWidth: 1200,
    canvasHeight: 800,
    created: new Date(),
    modified: new Date()
  }
}

/**
 * Create a new component instance
 */
export function createComponentInstance(
  type: ComponentType,
  name: string,
  x: number = 0,
  y: number = 0,
  properties: Record<string, unknown> = {}
): SchematicComponent {
  return {
    id: `comp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    name,
    x,
    y,
    rotation: 0,
    properties
  }
}

/**
 * Create a new connection/net
 */
export function createConnection(net: string, connections: string[] = []): Connection {
  return {
    id: `net-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    net,
    connections
  }
}

/**
 * Add a component to a schematic
 */
export function addComponentToSchematic(
  schematic: Schematic,
  component: SchematicComponent
): Schematic {
  return {
    ...schematic,
    components: [...schematic.components, component],
    modified: new Date()
  }
}

/**
 * Remove a component from a schematic
 */
export function removeComponentFromSchematic(
  schematic: Schematic,
  componentId: string
): Schematic {
  return {
    ...schematic,
    components: schematic.components.filter(c => c.id !== componentId),
    connections: schematic.connections.map(conn => ({
      ...conn,
      connections: conn.connections.filter(pin => !pin.startsWith(componentId))
    })).filter(conn => conn.connections.length > 0),
    modified: new Date()
  }
}

/**
 * Update a component in a schematic
 */
export function updateComponentInSchematic(
  schematic: Schematic,
  componentId: string,
  updates: Partial<SchematicComponent>
): Schematic {
  return {
    ...schematic,
    components: schematic.components.map(c =>
      c.id === componentId ? { ...c, ...updates } : c
    ),
    modified: new Date()
  }
}

/**
 * Add a connection to a schematic
 */
export function addConnectionToSchematic(
  schematic: Schematic,
  connection: Connection
): Schematic {
  return {
    ...schematic,
    connections: [...schematic.connections, connection],
    modified: new Date()
  }
}

/**
 * Remove a connection from a schematic
 */
export function removeConnectionFromSchematic(
  schematic: Schematic,
  connectionId: string
): Schematic {
  return {
    ...schematic,
    connections: schematic.connections.filter(c => c.id !== connectionId),
    modified: new Date()
  }
}

/**
 * Get all pins connected to a specific component pin
 */
export function getConnectedPins(
  schematic: Schematic,
  componentId: string,
  pinId: string
): string[] {
  const pinPath = `${componentId}.${pinId}`
  const connections = schematic.connections.filter(conn =>
    conn.connections.includes(pinPath)
  )
  return connections.flatMap(conn => conn.connections)
}

/**
 * Validate netlist for issues
 */
export interface ValidationIssue {
  type: 'warning' | 'error'
  message: string
  componentId?: string
  connectionId?: string
}

export function validateSchematic(schematic: Schematic): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  
  // Check for unconnected components (except boards)
  schematic.components.forEach(component => {
    if (component.type === 'board') return
    
    const hasConnections = schematic.connections.some(conn =>
      conn.connections.some(pin => pin.startsWith(component.id))
    )
    
    if (!hasConnections && component.type !== 'connector') {
      issues.push({
        type: 'warning',
        message: `Component "${component.name}" has no connections`,
        componentId: component.id
      })
    }
  })
  
  // Check for duplicate net names
  const netNames = schematic.connections.map(c => c.net)
  const duplicates = netNames.filter((n, i) => netNames.indexOf(n) !== i)
  if (duplicates.length > 0) {
    issues.push({
      type: 'warning',
      message: `Duplicate net names found: ${duplicates.join(', ')}`
    })
  }
  
  return issues
}

/**
 * Export schematic as JSON
 */
export function exportSchematicAsJSON(schematic: Schematic): string {
  return JSON.stringify(schematic, null, 2)
}

/**
 * Import schematic from JSON
 */
export function importSchematicFromJSON(json: string): Schematic | null {
  try {
    const data = JSON.parse(json)
    data.created = new Date(data.created)
    data.modified = new Date(data.modified)
    return data as Schematic
  } catch {
    return null
  }
}
