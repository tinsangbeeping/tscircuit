import React, { useState, useRef, useCallback } from 'react'
import { SchematicComponent, Schematic, createComponentInstance, updateComponentInSchematic, removeComponentFromSchematic, addComponentToSchematic } from '../lib/schematic'
import { getComponentSpec } from '../lib/components'
import { getSymbolComponent } from '../lib/symbols'
import { Trash2, RotateCw } from 'lucide-react'

interface SchematicCanvasProps {
  schematic: Schematic
  onUpdate: (schematic: Schematic) => void
  onSelectComponent: (component: SchematicComponent | null) => void
  selectedComponentId?: string
}

interface DragState {
  isDragging: boolean
  startX: number
  startY: number
  componentId: string
  offsetX: number
  offsetY: number
}

/**
 * Renders a single component with TSCircuit-style SVG symbol
 */
function ComponentSymbol({
  component,
  isSelected,
  onSelect,
  onDragStart
}: {
  component: SchematicComponent
  isSelected: boolean
  onSelect: (comp: SchematicComponent) => void
  onDragStart: (e: React.MouseEvent<SVGGElement>, componentId: string) => void
}) {
  const spec = getComponentSpec(component.type)
  if (!spec) return null

  const x = component.x
  const y = component.y

  return (
    <g
      key={component.id}
      className={`component-symbol ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(component)}
        onMouseDown={(e: React.MouseEvent<SVGGElement>) => {
        onDragStart(e, component.id)
        e.stopPropagation()
      }}
      style={{ cursor: 'move' }}
    >
      {/* Selection highlight box */}
      {isSelected && (
        <rect
          x={x - 50}
          y={y - 50}
          width={100}
          height={100}
          fill="none"
          stroke="#0066ff"
          strokeWidth="2"
          strokeDasharray="5,5"
          pointerEvents="none"
        />
      )}

      {/* Actual TSCircuit-style symbol */}
      {getSymbolComponent(component.type, x, y, component.rotation, isSelected)}

      {/* Component label */}
      <text
        x={x}
        y={y + 35}
        textAnchor="middle"
        fontSize="12"
        fontWeight="bold"
        fill="#333"
        pointerEvents="none"
      >
        {component.name}
      </text>
    </g>
  )
}

/**
 * Interactive SVG canvas for the schematic
 */
export const SchematicCanvas: React.FC<SchematicCanvasProps> = ({
  schematic,
  onUpdate,
  onSelectComponent,
  selectedComponentId
}) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const [dragState, setDragState] = useState<DragState | null>(null)

  const handleComponentDragStart = useCallback(
    (e: React.MouseEvent<SVGGElement>, componentId: string) => {
      const component = schematic.components.find(c => c.id === componentId)
      if (!component) return

      setDragState({
        isDragging: true,
        startX: e.clientX,
        startY: e.clientY,
        componentId,
        offsetX: component.x,
        offsetY: component.y
      })
    },
    [schematic.components]
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!dragState || !svgRef.current) return

      const svg = svgRef.current
      const rect = svg.getBoundingClientRect()
      const scale = svg.viewBox.baseVal.width / rect.width

      const deltaX = (e.clientX - dragState.startX) * scale
      const deltaY = (e.clientY - dragState.startY) * scale

      const newX = dragState.offsetX + deltaX
      const newY = dragState.offsetY + deltaY

      const updatedSchematic = updateComponentInSchematic(schematic, dragState.componentId, {
        x: newX,
        y: newY
      })

      onUpdate(updatedSchematic)
    },
    [dragState, schematic, onUpdate]
  )

  const handleMouseUp = useCallback(() => {
    setDragState(null)
  }, [])

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (e.target === svgRef.current) {
        onSelectComponent(null)
      }
    },
    [onSelectComponent]
  )

  const handleDragOver = useCallback((e: React.DragEvent<SVGSVGElement>) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent<SVGSVGElement>) => {
      e.preventDefault()
      
      const componentType = e.dataTransfer.getData('componentType')
      const componentName = e.dataTransfer.getData('componentName')
      
      if (!componentType) return

      // Get SVG coordinates from mouse position
      if (!svgRef.current) return
      
      const svg = svgRef.current
      const rect = svg.getBoundingClientRect()
      const scale = svg.viewBox.baseVal.width / rect.width
      
      const x = (e.clientX - rect.left) * scale
      const y = (e.clientY - rect.top) * scale

      // Create new component at drop location
      const newComponent = createComponentInstance(
        componentType as any,
        `${componentName}${schematic.components.filter(c => c.type === componentType).length + 1}`,
        x,
        y
      )

      const updatedSchematic = addComponentToSchematic(schematic, newComponent)
      onUpdate(updatedSchematic)
    },
    [schematic, onUpdate]
  )

  const handleDeleteComponent = useCallback(
    (componentId: string) => {
      const updatedSchematic = removeComponentFromSchematic(schematic, componentId)
      onUpdate(updatedSchematic)
      onSelectComponent(null)
    },
    [schematic, onUpdate, onSelectComponent]
  )

  const handleRotateComponent = useCallback(
    (componentId: string) => {
      const component = schematic.components.find(c => c.id === componentId)
      if (!component) return

      const rotations: (0 | 90 | 180 | 270)[] = [0, 90, 180, 270]
      const currentIndex = rotations.indexOf(component.rotation)
      const nextRotation = rotations[(currentIndex + 1) % rotations.length]

      const updatedSchematic = updateComponentInSchematic(schematic, componentId, {
        rotation: nextRotation
      })

      onUpdate(updatedSchematic)
    },
    [schematic, onUpdate]
  )

  const selectedComponent = selectedComponentId
    ? schematic.components.find(c => c.id === selectedComponentId)
    : null

  return (
    <div className="flex flex-col h-full">
      {/* Canvas */}
      <div className="flex-1 bg-white border rounded-lg overflow-hidden">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${schematic.canvasWidth} ${schematic.canvasHeight}`}
          className="w-full h-full cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={handleCanvasClick}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {/* Grid background */}
          <defs>
            <pattern
              id="grid"
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f0f0f0" strokeWidth="0.5" />
              <circle cx="20" cy="20" r="1" fill="#e0e0e0" />
            </pattern>
          </defs>
          <rect 
            width={schematic.canvasWidth} 
            height={schematic.canvasHeight} 
            fill="url(#grid)" 
            pointerEvents="none"
          />

          {/* Canvas border */}
          <rect
            width={schematic.canvasWidth}
            height={schematic.canvasHeight}
            fill="none"
            stroke="#ddd"
            strokeWidth="1"
            pointerEvents="none"
          />

          {/* Draw connections */}
          {schematic.connections.map(connection => {
            const pins = connection.connections
            if (pins.length < 2) return null

            return pins.map((pin, idx) => {
              if (idx === 0) return null
              const [compId] = pin.split('.')
              const comp = schematic.components.find(c => c.id === compId)
              if (!comp) return null

              const prevPin = pins[idx - 1].split('.')
              const prevComp = schematic.components.find(c => c.id === prevPin[0])
              if (!prevComp) return null

              return (
                <line
                  key={`${connection.id}-${idx}`}
                  x1={prevComp.x}
                  y1={prevComp.y}
                  x2={comp.x}
                  y2={comp.y}
                  className="connection-line"
                  strokeWidth="2"
                  stroke="#666"
                  strokeLinecap="round"
                />
              )
            })
          })}

          {/* Draw components */}
          {schematic.components.map(component => (
            <ComponentSymbol
              key={component.id}
              component={component}
              isSelected={component.id === selectedComponentId}
              onSelect={onSelectComponent}
              onDragStart={handleComponentDragStart}
            />
          ))}

          {/* Empty state message */}
          {schematic.components.length === 0 && (
            <text
              x={schematic.canvasWidth / 2}
              y={schematic.canvasHeight / 2}
              textAnchor="middle"
              fontSize="18"
              fill="#ccc"
              pointerEvents="none"
            >
              Drag components from the sidebar here to begin
            </text>
          )}
        </svg>
      </div>

      {/* Component properties panel */}
      {selectedComponent && (
        <div className="bg-gray-100 border-t p-4 space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-sm">{selectedComponent.name}</h3>
              <p className="text-xs text-gray-600">
                Position: ({selectedComponent.x.toFixed(0)}, {selectedComponent.y.toFixed(0)})
                | Rotation: {selectedComponent.rotation}°
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleRotateComponent(selectedComponent.id)}
                className="p-1 hover:bg-gray-300 rounded transition-colors"
                title="Rotate 90°"
              >
                <RotateCw size={16} />
              </button>
              <button
                onClick={() => handleDeleteComponent(selectedComponent.id)}
                className="p-1 hover:bg-red-200 rounded transition-colors"
                title="Delete component"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          {/* Component details */}
          <div className="text-xs space-y-1">
            <div><strong>Type:</strong> {selectedComponent.type}</div>
            <div>
              <strong>Properties:</strong>
              <pre className="bg-white p-2 rounded mt-1 overflow-auto text-xs">
                {JSON.stringify(selectedComponent.properties, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
