# 🧩 Schematic Editor - TSCircuit Interactive Design Tool

An interactive SVG-based schematic editor for designing circuits with TSCircuit components. Built with React, TypeScript, and Tailwind CSS.

## 🎯 Features

### ✅ Step 1: Component Library
- **Complete TSCircuit Component Database** extracted from `@tscircuit/core`
- Components organized by category:
  - ⚡ Power (Battery, Regulators)
  - 🔌 Passive (Resistor, Capacitor, Inductor)
  - 🖲️ Active (LED, Transistor, Diode, ICs)
  - 🔗 Connectors
  - 🔧 Miscellaneous

### ✅ Step 2: Interactive SVG Canvas
- **Drag-and-drop** components from sidebar to canvas
- **Real-time rendering** of component symbols
- **Interactive features:**
  - ✏️ **Drag to move** - Click and drag any component
  - 🔄 **Rotate 90°** - Rotate components in place
  - 🗑️ **Delete** - Remove components
  - 📍 **Snap grid** - 20px grid for alignment
  - 🎯 **Component selection** with highlighted state
  - 📊 **Position tracking** and properties display

### 📦 Predefined Patches (Layer 3)
Ready-to-use circuit blocks:
- **UART Interface** - MCU UART + MAX3232 level shifter + connector
- **LED Blink** - Simple LED with current limiting resistor
- **Power Regulator** - Dual voltage output (5V + 3.3V)
- **Sensor Interface** - RC filter for analog sensors

### 💾 Import/Export
- Export schematics as JSON
- Import previously saved circuits
- Full netlist preservation

## 🚀 Quick Start

### Installation

```bash
cd /workspaces/schematic-editor
npm install
# or
yarn install
# or
bun install
```

### Development Server

```bash
npm run dev
```

The app will open at `http://localhost:5173`

### Build for Production

```bash
npm run build
npm run preview
```

## 📐 Architecture

### Layer 1: Core Component + Patch Setup
```
COMPONENT_LIBRARY (components.ts)
├── Specs for all available components
├── Pin definitions
└── Default properties
```

### Layer 2: SVG-Based Interactive Canvas
```
SchematicCanvas (SchematicCanvas.tsx)
├── Grid background pattern
├── Draggable component symbols
├── Rotation and deletion UI
└── Real-time position tracking
```

### Layer 3: Interactive Netlist & Patch Builder
```
Schematic Model (schematic.ts)
├── Components state
├── Connections/nets
├── Validation logic
└── Import/Export
```

### Layer 4: Predefined Patches
```
Patch Library (patches.ts)
├── UART, LED Blink, Power Regulator
├── Sensor Interface
└── Reusable subcircuits
```

## 📁 Project Structure

```
schematic-editor/
├── src/
│   ├── lib/
│   │   ├── components.ts      # Component library extraction (Step 1)
│   │   ├── schematic.ts       # Netlist & circuit model
│   │   └── patches.ts         # Predefined circuit patches
│   ├── components/
│   │   ├── SchematicCanvas.tsx  # SVG canvas (Step 2)
│   │   └── ComponentSidebar.tsx # Component library UI
│   ├── App.tsx                # Main application
│   ├── main.tsx               # Entry point
│   └── index.css              # Tailwind CSS
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 🎮 How to Use

### Adding Components
1. Browse the **Component Library** sidebar
2. **Drag** a component onto the canvas
3. Component appears at a random position
4. **Click** to select
5. **Drag** to move, **rotate** button to rotate, **delete** to remove

### Using Patches
1. Click one of the **Predefined Patches** buttons at bottom of sidebar
2. All components and connections are added to your circuit
3. Customize by adding/removing components

### Managing Your Circuit
- **Export**: Click "Export" to save as JSON
- **Import**: Click "Import" to load a saved circuit
- **New**: Create a blank schematic
- Status bar shows component count and net count

## 🔧 Technologies Used

- **React 18** - UI framework with hooks
- **TypeScript** - Type safety
- **Vite** - Fast build tool
- **Tailwind CSS** - Styling
- **SVG** - Schematic rendering
- **Lucide React** - Icons

## 🎨 Component Rendering

Each component renders as:
- **SVG Rectangle** - Main component body
- **Circle** - Center indicator
- **Text** - Component name (e.g., "R1", "U1")
- **Pin Markers** - Blue circles around component edges (positioned by pin count)

### Color Scheme
- **Default**: #333 (dark gray border)
- **Selected**: #0066ff (blue highlight with glow)
- **Pins**: #0066ff (blue)
- **Grid**: #eee (light gray)

## 📊 Data Model

### SchematicComponent
```typescript
{
  id: string
  type: ComponentType
  name: string
  x: number
  y: number
  rotation: 0 | 90 | 180 | 270
  properties: Record<string, unknown>
}
```

### Connection
```typescript
{
  id: string
  net: string
  connections: string[] // ["componentId.pinId", ...]
}
```

## 🔄 State Management

- **schematic**: Main circuit state (components + connections)
- **selectedComponentId**: Currently selected component
- **dragState**: Active drag operation tracking

Uses React hooks (`useState`, `useCallback`) for simple, efficient state management.

## 🚧 Future Enhancements

- [ ] **Layer 4**: AI suggestions for missing components
- [ ] Netlist validation & DRC checks
- [ ] Voltage/current compatibility checking
- [ ] Export to KiCad format
- [ ] Undo/Redo stack
- [ ] Multi-select and group operations
- [ ] Custom patch creation UI
- [ ] Real-time 3D PCB preview
- [ ] Schematic trace routing assistant

## 📝 Component Library Reference

### Available Components
- **battery** - DC voltage source
- **resistor** - Current limiting (0805, 1206 footprints)
- **capacitor** - Charge storage
- **inductor** - Magnetic storage
- **led** - Light-emitting diode
- **diode** - Signal/power diode
- **transistor** - BJT (NPN/PNP)
- **chip** - Generic IC (STM32F401, MAX3232, LM7805, etc.)
- **connector** - Headers, USB, DB9
- **switch** - Momentary/toggle switches

## 📖 Usage Examples

### Create and Export a Simple LED Circuit

```typescript
// Open app → Drag battery, resistor, LED
// Connections auto-track in netlist
// Export as JSON for KiCad/EasyEDA
```

### Add a UART Patch

```typescript
// Click "UART Interface" patch
// Get: STM32F401 + MAX3232 + Connector
// Pre-connected TX/RX nets
// Ready to customize
```

## 🤝 Contributing

This is a prototype for TSCircuit interactive design. Enhancements welcome!

## 📄 License

Part of TSCircuit ecosystem - check main project for license details.

---

**Made with ❤️ for the TSCircuit community**
