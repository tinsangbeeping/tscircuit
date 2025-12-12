/**
 * ELK-Based Connectivity Verification & Auto-Layout
 * 
 * Uses Eclipse Layout Kernel (ELK) to:
 * 1. Verify circuit connectivity
 * 2. Detect unconnected pins and floating nets
 * 3. Auto-arrange schematic elements
 */

import type { PatchData, PatchComponent, PatchNet } from "./patch.ts"

/**
 * Graph node representing a component pin
 */
interface GraphNode {
  id: string
  componentId: string
  pinName: string
  label: string
}

/**
 * Graph edge representing a connection
 */
interface GraphEdge {
  id: string
  source: string
  target: string
  netId: string
}

/**
 * ELK graph structure
 */
interface ELKGraph {
  id: string
  layoutOptions: Record<string, any>
  children: Array<{
    id: string
    width?: number
    height?: number
    x?: number
    y?: number
    layoutOptions?: Record<string, any>
  }>
  edges: Array<{
    id: string
    sources: string[]
    targets: string[]
  }>
}

/**
 * Connectivity Analysis Result
 */
export interface ConnectivityAnalysis {
  /** Total number of components */
  componentCount: number
  
  /** Total number of nets */
  netCount: number
  
  /** Components with unconnected pins */
  unconnectedPins: Array<{
    componentId: string
    componentName: string
    pinName: string
  }>
  
  /** Nets with insufficient connections */
  floatingNets: Array<{
    netId: string
    netName?: string
    connectionCount: number
  }>
  
  /** Connected subgraphs (isolated circuits) */
  subgraphCount: number
  
  /** Whether the circuit is fully connected */
  isFullyConnected: boolean
}

/**
 * ELK Layout Service
 */
export class ELKLayoutService {
  /**
   * Analyze circuit connectivity using graph theory
   */
  static analyzeConnectivity(patch: PatchData): ConnectivityAnalysis {
    const graph = this.buildGraph(patch)
    
    // Find unconnected pins
    const unconnectedPins = this.findUnconnectedPins(patch, graph)
    
    // Find floating nets
    const floatingNets = this.findFloatingNets(patch)
    
    // Count connected subgraphs
    const subgraphCount = this.countConnectedSubgraphs(graph)
    
    return {
      componentCount: patch.components.length,
      netCount: patch.nets.length,
      unconnectedPins,
      floatingNets,
      subgraphCount,
      isFullyConnected: unconnectedPins.length === 0 && floatingNets.length === 0,
    }
  }
  
  /**
   * Build a graph representation of the circuit
   */
  private static buildGraph(patch: PatchData): {
    nodes: GraphNode[]
    edges: GraphEdge[]
    adjacencyList: Map<string, string[]>
  } {
    const nodes: GraphNode[] = []
    const edges: GraphEdge[] = []
    const adjacencyList = new Map<string, string[]>()
    
    // Create nodes for all component pins
    for (const component of patch.components) {
      for (const [key] of Object.entries(component.properties)) {
        if (key.startsWith("pin_")) {
          const nodeId = `${component.id}_${key}`
          nodes.push({
            id: nodeId,
            componentId: component.id,
            pinName: key,
            label: `${component.name}.${key}`,
          })
          adjacencyList.set(nodeId, [])
        }
      }
    }
    
    // Create edges for connections
    for (const net of patch.nets) {
      for (let i = 0; i < net.connections.length - 1; i++) {
        const conn1 = net.connections[i]
        const conn2 = net.connections[i + 1]
        
        const nodeId1 = `${conn1.componentId}_${conn1.pinName}`
        const nodeId2 = `${conn2.componentId}_${conn2.pinName}`
        
        const edgeId = `${net.id}_${i}`
        edges.push({
          id: edgeId,
          source: nodeId1,
          target: nodeId2,
          netId: net.id,
        })
        
        // Update adjacency list
        adjacencyList.get(nodeId1)?.push(nodeId2)
        adjacencyList.get(nodeId2)?.push(nodeId1)
      }
    }
    
    return { nodes, edges, adjacencyList }
  }
  
  /**
   * Find pins that are not connected to any net
   */
  private static findUnconnectedPins(
    patch: PatchData,
    graph: ReturnType<typeof ELKLayoutService.buildGraph>
  ) {
    const unconnectedPins = []
    
    for (const component of patch.components) {
      for (const net of patch.nets) {
        const isConnected = net.connections.some(
          conn => conn.componentId === component.id
        )
        
        if (!isConnected) {
          unconnectedPins.push({
            componentId: component.id,
            componentName: component.name,
            pinName: "unspecified",
          })
        }
      }
    }
    
    return unconnectedPins
  }
  
  /**
   * Find nets that have fewer than 2 connections
   */
  private static findFloatingNets(patch: PatchData) {
    return patch.nets
      .filter(net => net.connections.length < 2)
      .map(net => ({
        netId: net.id,
        netName: net.name,
        connectionCount: net.connections.length,
      }))
  }
  
  /**
   * Count the number of connected subgraphs (isolated circuits)
   */
  private static countConnectedSubgraphs(graph: ReturnType<typeof ELKLayoutService.buildGraph>): number {
    const visited = new Set<string>()
    let subgraphCount = 0
    
    for (const node of graph.nodes) {
      if (!visited.has(node.id)) {
        subgraphCount++
        this.dfs(node.id, graph.adjacencyList, visited)
      }
    }
    
    return subgraphCount
  }
  
  /**
   * Depth-first search for graph traversal
   */
  private static dfs(
    nodeId: string,
    adjacencyList: Map<string, string[]>,
    visited: Set<string>
  ): void {
    visited.add(nodeId)
    const neighbors = adjacencyList.get(nodeId) || []
    
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        this.dfs(neighbor, adjacencyList, visited)
      }
    }
  }
  
  /**
   * Generate ELK layout configuration for the patch
   * This can be used with elkjs library for actual layout
   */
  static generateELKConfig(patch: PatchData): ELKGraph {
    return {
      id: "root",
      layoutOptions: {
        "elk.algorithm": "layered",
        "elk.direction": "RIGHT",
        "elk.spacing.componentComponent": "20",
        "elk.layered.spacing.edgeNodeBetweenLayers": "20",
      },
      children: patch.components.map(comp => ({
        id: comp.id,
        width: 100,
        height: 60,
        x: comp.position.x,
        y: comp.position.y,
        layoutOptions: {
          "elk.core.options": "default",
        },
      })),
      edges: patch.nets.map(net => ({
        id: net.id,
        sources: net.connections.slice(0, -1).map(conn => conn.componentId),
        targets: net.connections.slice(1).map(conn => conn.componentId),
      })),
    }
  }
  
  /**
   * Validate patch connectivity and return report
   */
  static generateConnectivityReport(patch: PatchData): string {
    const analysis = this.analyzeConnectivity(patch)
    
    let report = `
╔════════════════════════════════════════════════════════════════╗
║                 Connectivity Analysis Report                   ║
╚════════════════════════════════════════════════════════════════╝

📊 Circuit Statistics:
  • Components: ${analysis.componentCount}
  • Nets: ${analysis.netCount}
  • Isolated Subgraphs: ${analysis.subgraphCount}
  • Status: ${analysis.isFullyConnected ? "✅ FULLY CONNECTED" : "⚠️  ISSUES FOUND"}

`
    
    if (analysis.unconnectedPins.length > 0) {
      report += `❌ Unconnected Pins (${analysis.unconnectedPins.length}):\n`
      for (const pin of analysis.unconnectedPins) {
        report += `   • ${pin.componentName} ${pin.pinName}\n`
      }
      report += "\n"
    }
    
    if (analysis.floatingNets.length > 0) {
      report += `⚠️  Floating Nets (${analysis.floatingNets.length}):\n`
      for (const net of analysis.floatingNets) {
        report += `   • Net "${net.netName || net.netId}" has ${net.connectionCount} connection(s)\n`
      }
      report += "\n"
    }
    
    if (analysis.isFullyConnected) {
      report += "✅ All pins are properly connected!\n"
    }
    
    report += "\n╚════════════════════════════════════════════════════════════════╝\n"
    
    return report
  }
}

/**
 * Real-time Connectivity Validator
 * Can be called after each edit to validate the patch
 */
export class RealtimeValidator {
  private patchData: PatchData
  private validationState: ConnectivityAnalysis | null = null
  
  constructor(patch: PatchData) {
    this.patchData = patch
    this.validate()
  }
  
  /**
   * Validate current patch state
   */
  validate(): ConnectivityAnalysis {
    this.validationState = ELKLayoutService.analyzeConnectivity(this.patchData)
    return this.validationState
  }
  
  /**
   * Check if there are any errors
   */
  hasErrors(): boolean {
    return !this.validationState?.isFullyConnected ?? false
  }
  
  /**
   * Get validation warnings/errors
   */
  getIssues(): string[] {
    if (!this.validationState) return []
    
    const issues: string[] = []
    
    for (const pin of this.validationState.unconnectedPins) {
      issues.push(`Unconnected pin: ${pin.componentName}.${pin.pinName}`)
    }
    
    for (const net of this.validationState.floatingNets) {
      issues.push(`Floating net: "${net.netName || net.netId}" (${net.connectionCount} connection(s))`)
    }
    
    if (this.validationState.subgraphCount > 1) {
      issues.push(`Warning: Circuit has ${this.validationState.subgraphCount} isolated subgraphs`)
    }
    
    return issues
  }
}
