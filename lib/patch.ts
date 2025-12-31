/**
 * Patch-Based Design System
 * 
 * A patch is a reusable subcircuit that can be:
 * 1. Created from selected components in the schematic
 * 2. Saved to a .tscircuit file using Circuit JSON format
 * 3. Loaded and inserted into other schematics as a single unit
 * 4. Edited in a dedicated Patch Editor interface
 */

import type { Circuit } from "@tscircuit/core"

/**
 * Patch Interface Pin Definition
 * Represents an external connection point of a patch
 */
export interface PatchInterfacePin {
  /** Unique identifier for the pin */
  id: string
  
  /** Display name (e.g., "VCC", "GND", "DATA") */
  name: string
  
  /** Position on patch symbol (top, bottom, left, right) */
  position: "top" | "bottom" | "left" | "right"
  
  /** Internal net name this pin is connected to */
  internalNetName: string
  
  /** Pin type (power, ground, signal, etc.) */
  type: "power" | "ground" | "signal" | "clock" | "reset" | "data"
}

/**
 * Patch Component Definition
 * Represents a single component within a patch
 */
export interface PatchComponent {
  /** Unique identifier within the patch */
  id: string
  
  /** Component name/reference (e.g., "R1", "U1") */
  name: string
  
  /** Component type (resistor, led, battery, etc.) */
  type: string
  
  /** Component properties (resistance, voltage, etc.) */
  properties: Record<string, string | number>
  
  /** Position on the patch schematic */
  position: {
    x: number
    y: number
  }
}

/**
 * Patch Net Definition
 * Represents a connection (wire) between components
 */
export interface PatchNet {
  /** Unique identifier */
  id: string
  
  /** Net name (optional, e.g., "VCC", "DATA") */
  name?: string
  
  /** List of pins/nodes connected to this net */
  connections: Array<{
    componentId: string
    pinName: string
  }>
}

/**
 * Patch Metadata
 * Additional information about the patch
 */
export interface PatchMetadata {
  /** Patch name */
  name: string
  
  /** Description of what the patch does */
  description?: string
  
  /** Version number */
  version: string
  
  /** Creation timestamp */
  createdAt: string
  
  /** Last modified timestamp */
  modifiedAt: string
  
  /** Author */
  author?: string
  
  /** Tags for categorization */
  tags?: string[]
}

/**
 * Complete Patch Data Structure
 * Saved as a .tscircuit JSON file
 */
export interface PatchData {
  /** Schema version for compatibility */
  schemaVersion: "1.0"
  
  /** Patch metadata */
  metadata: PatchMetadata
  
  /** All components in the patch */
  components: PatchComponent[]
  
  /** All nets/connections in the patch */
  nets: PatchNet[]
  
  /** External pins that connect patch to outside world */
  interfacePins: PatchInterfacePin[]
  
  /** Custom symbol representation (optional) */
  symbolSvg?: string
}

/**
 * Patch Editor State
 * Tracks the state of a patch being edited
 */
export interface PatchEditorState {
  /** The patch being edited */
  patch: PatchData
  
  /** Current selection in the editor */
  selectedComponentIds: string[]
  
  /** Current zoom level */
  zoomLevel: number
  
  /** Pan offset */
  panX: number
  panY: number
  
  /** Whether patch has unsaved changes */
  isDirty: boolean
  
  /** Validation errors */
  errors: PatchValidationError[]
}

/**
 * Patch Validation Error
 * Represents an error found during validation
 */
export interface PatchValidationError {
  type: "unconnected-pin" | "floating-net" | "missing-interface-pin" | "invalid-connection"
  
  severity: "error" | "warning"
  
  message: string
  
  componentId?: string
  
  netId?: string
  
  pinId?: string
}

/**
 * Patch Library Entry
 * References a saved patch in the library
 */
export interface PatchLibraryEntry {
  /** Unique identifier */
  id: string
  
  /** Patch name */
  name: string
  
  /** File path or reference */
  filePath: string
  
  /** Patch metadata snapshot */
  metadata: PatchMetadata
  
  /** Thumbnail/preview SVG */
  previewSvg?: string
  
  /** Last loaded timestamp */
  lastUsed?: string
}

/**
 * Validates a patch for electrical correctness
 * 
 * @param patch The patch to validate
 * @returns Array of validation errors (empty if valid)
 */
export function validatePatch(patch: PatchData): PatchValidationError[] {
  const errors: PatchValidationError[] = []
  
  // Check for unconnected component pins
  for (const component of patch.components) {
    for (const [pinName] of Object.entries(component.properties)) {
      if (pinName.startsWith("pin_")) {
        const isConnected = patch.nets.some(net =>
          net.connections.some(conn =>
            conn.componentId === component.id && conn.pinName === pinName
          )
        )
        
        if (!isConnected) {
          errors.push({
            type: "unconnected-pin",
            severity: "error",
            message: `${component.name} pin ${pinName} is unconnected`,
            componentId: component.id,
            pinId: pinName,
          })
        }
      }
    }
  }
  
  // Check for floating nets (nets with only one connection)
  for (const net of patch.nets) {
    if (net.connections.length < 2) {
      errors.push({
        type: "floating-net",
        severity: "warning",
        message: `Net "${net.name || net.id}" has only ${net.connections.length} connection(s)`,
        netId: net.id,
      })
    }
  }
  
  return errors
}

/**
 * Creates a new empty patch
 */
export function createEmptyPatch(name: string): PatchData {
  const now = new Date().toISOString()
  
  return {
    schemaVersion: "1.0",
    metadata: {
      name,
      version: "1.0.0",
      createdAt: now,
      modifiedAt: now,
    },
    components: [],
    nets: [],
    interfacePins: [],
  }
}

/**
 * Converts a patch to Circuit JSON format for saving
 */
export function patchToCircuitJson(patch: PatchData): Record<string, any> {
  return {
    schemaVersion: "1.0",
    metadata: patch.metadata,
    components: patch.components.map(comp => ({
      name: comp.name,
      type: comp.type,
      ...comp.properties,
    })),
    nets: patch.nets.map(net => ({
      name: net.name,
      connections: net.connections,
    })),
    interfacePins: patch.interfacePins,
    symbolSvg: patch.symbolSvg,
  }
}

/**
 * Converts Circuit JSON to a patch
 */
export function circuitJsonToPatch(json: Record<string, any>): PatchData {
  return {
    schemaVersion: json.schemaVersion || "1.0",
    metadata: json.metadata || {
      name: "Unnamed Patch",
      version: "1.0.0",
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
    },
    components: json.components || [],
    nets: json.nets || [],
    interfacePins: json.interfacePins || [],
    symbolSvg: json.symbolSvg,
  }
}
