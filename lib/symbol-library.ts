/**
 * Symbol Library Service
 * 
 * Manages the expanded schematic symbol library
 * Integrates tscircuit symbols and provides validation
 */

export interface Symbol {
  /** Unique identifier */
  id: string
  
  /** Display name */
  name: string
  
  /** Component type */
  type: string
  
  /** Category for organization */
  category: "Passive" | "Active" | "Power" | "Connector" | "Logic" | "Analog" | "Patch"
  
  /** SVG representation */
  svg: string
  
  /** Pin definitions */
  pins: SymbolPin[]
  
  /** Default properties */
  defaultProperties?: Record<string, any>
  
  /** Is this a custom patch symbol? */
  isPatch?: boolean
  
  /** Fallback for unsupported symbols */
  fallbackSymbol?: string
}

export interface SymbolPin {
  /** Pin identifier */
  id: string
  
  /** Pin name/label */
  name: string
  
  /** Pin position (top, bottom, left, right) */
  position: "top" | "bottom" | "left" | "right"
  
  /** Pin type */
  type: "power" | "ground" | "signal" | "clock" | "reset" | "data"
}

export interface SymbolLibraryConfig {
  /** Whether to use tscircuit registry symbols */
  useTscircuitRegistry?: boolean
  
  /** Custom symbol paths */
  customSymbolPaths?: string[]
  
  /** Enable fallback for unsupported symbols */
  enableFallback?: boolean
  
  /** Fallback symbol SVG */
  fallbackSvg?: string
}

/**
 * Symbol Library Service
 */
export class SymbolLibraryService {
  private symbols: Map<string, Symbol> = new Map()
  private categories: Map<string, Symbol[]> = new Map()
  private config: SymbolLibraryConfig
  
  constructor(config: SymbolLibraryConfig = {}) {
    this.config = {
      useTscircuitRegistry: true,
      enableFallback: true,
      ...config,
    }
    
    // Initialize default categories
    this.initializeCategories()
    
    // Load default symbols
    this.loadDefaultSymbols()
  }
  
  /**
   * Initialize category buckets
   */
  private initializeCategories(): void {
    const categories = ["Passive", "Active", "Power", "Connector", "Logic", "Analog", "Patch"]
    for (const cat of categories) {
      this.categories.set(cat, [])
    }
  }
  
  /**
   * Load built-in default symbols
   */
  private loadDefaultSymbols(): void {
    // Basic passive components
    this.registerSymbol({
      id: "resistor",
      name: "Resistor",
      type: "resistor",
      category: "Passive",
      svg: `<svg viewBox="0 0 100 40" xmlns="http://www.w3.org/2000/svg">
        <line x1="10" y1="20" x2="25" y2="20" stroke="black" stroke-width="2"/>
        <rect x="25" y="15" width="50" height="10" fill="none" stroke="black" stroke-width="2"/>
        <line x1="75" y1="20" x2="90" y2="20" stroke="black" stroke-width="2"/>
      </svg>`,
      pins: [
        { id: "pin1", name: "1", position: "left", type: "signal" },
        { id: "pin2", name: "2", position: "right", type: "signal" },
      ],
      defaultProperties: { resistance: "10k" },
    })
    
    // LED
    this.registerSymbol({
      id: "led",
      name: "LED",
      type: "led",
      category: "Passive",
      svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="30" fill="none" stroke="black" stroke-width="2"/>
        <polygon points="50,50 40,70 60,70" fill="red" stroke="red" stroke-width="1"/>
        <line x1="50" y1="20" x2="50" y2="10" stroke="black" stroke-width="2"/>
        <line x1="50" y1="80" x2="50" y2="90" stroke="black" stroke-width="2"/>
      </svg>`,
      pins: [
        { id: "anode", name: "Anode (+)", position: "top", type: "signal" },
        { id: "cathode", name: "Cathode (-)", position: "bottom", type: "signal" },
      ],
    })
    
    // Battery/Power Source
    this.registerSymbol({
      id: "battery",
      name: "Battery",
      type: "battery",
      category: "Power",
      svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <line x1="20" y1="30" x2="20" y2="70" stroke="black" stroke-width="3"/>
        <line x1="40" y1="25" x2="40" y2="75" stroke="black" stroke-width="2"/>
        <line x1="60" y1="25" x2="60" y2="75" stroke="black" stroke-width="2"/>
        <line x1="80" y1="30" x2="80" y2="70" stroke="black" stroke-width="3"/>
      </svg>`,
      pins: [
        { id: "pos", name: "Positive (+)", position: "top", type: "power" },
        { id: "neg", name: "Negative (-)", position: "bottom", type: "ground" },
      ],
      defaultProperties: { voltage: "5V" },
    })
    
    // Ground symbol
    this.registerSymbol({
      id: "ground",
      name: "Ground",
      type: "ground",
      category: "Power",
      svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <line x1="50" y1="10" x2="50" y2="40" stroke="black" stroke-width="2"/>
        <line x1="30" y1="40" x2="70" y2="40" stroke="black" stroke-width="3"/>
        <line x1="40" y1="50" x2="60" y2="50" stroke="black" stroke-width="3"/>
        <line x1="45" y1="60" x2="55" y2="60" stroke="black" stroke-width="3"/>
      </svg>`,
      pins: [
        { id: "gnd", name: "GND", position: "top", type: "ground" },
      ],
    })
    
    // Logic gate (AND)
    this.registerSymbol({
      id: "and_gate",
      name: "AND Gate",
      type: "logic_gate",
      category: "Logic",
      svg: `<svg viewBox="0 0 100 80" xmlns="http://www.w3.org/2000/svg">
        <path d="M 20 10 L 50 10 Q 80 10 80 40 Q 80 70 50 70 L 20 70 Z" fill="none" stroke="black" stroke-width="2"/>
        <text x="40" y="50" font-size="20" font-weight="bold" text-anchor="middle">&amp;</text>
      </svg>`,
      pins: [
        { id: "in1", name: "Input 1", position: "left", type: "signal" },
        { id: "in2", name: "Input 2", position: "left", type: "signal" },
        { id: "out", name: "Output", position: "right", type: "signal" },
      ],
    })
    
    // Capacitor
    this.registerSymbol({
      id: "capacitor",
      name: "Capacitor",
      type: "capacitor",
      category: "Passive",
      svg: `<svg viewBox="0 0 100 40" xmlns="http://www.w3.org/2000/svg">
        <line x1="10" y1="20" x2="35" y2="20" stroke="black" stroke-width="2"/>
        <line x1="35" y1="10" x2="35" y2="30" stroke="black" stroke-width="3"/>
        <line x1="65" y1="10" x2="65" y2="30" stroke="black" stroke-width="3"/>
        <line x1="65" y1="20" x2="90" y2="20" stroke="black" stroke-width="2"/>
      </svg>`,
      pins: [
        { id: "pin1", name: "1", position: "left", type: "signal" },
        { id: "pin2", name: "2", position: "right", type: "signal" },
      ],
      defaultProperties: { capacitance: "10u" },
    })
    
    // Microcontroller (generic)
    this.registerSymbol({
      id: "microcontroller",
      name: "Microcontroller",
      type: "microcontroller",
      category: "Active",
      svg: `<svg viewBox="0 0 120 140" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="20" width="80" height="100" fill="none" stroke="black" stroke-width="2"/>
        <circle cx="60" cy="10" r="3" fill="black"/>
        <text x="60" y="70" font-size="12" text-anchor="middle" font-weight="bold">MCU</text>
      </svg>`,
      pins: [
        { id: "vcc", name: "VCC", position: "top", type: "power" },
        { id: "gnd", name: "GND", position: "bottom", type: "ground" },
        { id: "pin1", name: "Pin 1", position: "left", type: "signal" },
        { id: "pin2", name: "Pin 2", position: "left", type: "signal" },
        { id: "pin3", name: "Pin 3", position: "right", type: "signal" },
      ],
    })
    
    // Transistor (NPN)
    this.registerSymbol({
      id: "transistor_npn",
      name: "NPN Transistor",
      type: "transistor",
      category: "Active",
      svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="40" fill="none" stroke="black" stroke-width="2"/>
        <line x1="30" y1="50" x2="50" y2="50" stroke="black" stroke-width="2"/>
        <polygon points="50,50 45,35 55,35" fill="black"/>
        <line x1="50" y1="20" x2="50" y2="10" stroke="black" stroke-width="2"/>
        <line x1="50" y1="80" x2="50" y2="90" stroke="black" stroke-width="2"/>
        <line x1="20" y1="50" x2="10" y2="50" stroke="black" stroke-width="2"/>
      </svg>`,
      pins: [
        { id: "c", name: "Collector", position: "top", type: "signal" },
        { id: "b", name: "Base", position: "left", type: "signal" },
        { id: "e", name: "Emitter", position: "bottom", type: "signal" },
      ],
    })
  }
  
  /**
   * Register a new symbol
   */
  registerSymbol(symbol: Symbol): void {
    this.symbols.set(symbol.id, symbol)
    
    const categorySymbols = this.categories.get(symbol.category) || []
    categorySymbols.push(symbol)
    this.categories.set(symbol.category, categorySymbols)
    
    console.log(`✅ Symbol registered: ${symbol.name}`)
  }
  
  /**
   * Get a symbol by ID
   */
  getSymbol(id: string): Symbol | undefined {
    return this.symbols.get(id)
  }
  
  /**
   * Get all symbols in a category
   */
  getSymbolsByCategory(category: string): Symbol[] {
    return this.categories.get(category) || []
  }
  
  /**
   * Search symbols by name
   */
  searchSymbols(query: string): Symbol[] {
    const lowerQuery = query.toLowerCase()
    return Array.from(this.symbols.values()).filter(symbol =>
      symbol.name.toLowerCase().includes(lowerQuery) ||
      symbol.type.toLowerCase().includes(lowerQuery)
    )
  }
  
  /**
   * Get all symbols
   */
  getAllSymbols(): Symbol[] {
    return Array.from(this.symbols.values())
  }
  
  /**
   * Get all categories
   */
  getCategories(): string[] {
    return Array.from(this.categories.keys())
  }
  
  /**
   * Validate symbol rendering
   */
  validateSymbolRendering(symbolId: string): { valid: boolean; errors: string[] } {
    const symbol = this.getSymbol(symbolId)
    if (!symbol) return { valid: false, errors: ["Symbol not found"] }
    
    const errors: string[] = []
    
    // Check SVG validity
    try {
      const parser = new DOMParser?.()
      if (parser) {
        const doc = parser.parseFromString(symbol.svg, "image/svg+xml")
        if (doc.getElementsByTagName("parsererror").length > 0) {
          errors.push("Invalid SVG syntax")
        }
      }
    } catch {
      errors.push("SVG parsing error")
    }
    
    // Check pins definition
    if (!symbol.pins || symbol.pins.length === 0) {
      errors.push("No pins defined")
    }
    
    return {
      valid: errors.length === 0,
      errors,
    }
  }
  
  /**
   * Get statistics
   */
  getStatistics(): {
    totalSymbols: number
    symbolsByCategory: Record<string, number>
  } {
    const byCategory: Record<string, number> = {}
    
    for (const [category, symbols] of this.categories) {
      byCategory[category] = symbols.length
    }
    
    return {
      totalSymbols: this.symbols.size,
      symbolsByCategory: byCategory,
    }
  }
}

/**
 * Global symbol library instance
 */
export const symbolLibrary = new SymbolLibraryService()
