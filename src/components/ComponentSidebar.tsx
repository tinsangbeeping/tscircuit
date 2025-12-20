import React, { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { getGroupedComponents, ComponentType } from '../lib/components'
import { Schematic, createComponentInstance, addComponentToSchematic } from '../lib/schematic'

interface ComponentSidebarProps {
  schematic: Schematic
  onAddComponent: (schematic: Schematic) => void
  onPatchClick?: (patchName: string) => void
}

export const ComponentSidebar: React.FC<ComponentSidebarProps> = ({
  schematic,
  onAddComponent,
  onPatchClick
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['passive', 'power'])
  )
  const grouped = getGroupedComponents()

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(category)) {
      newExpanded.delete(category)
    } else {
      newExpanded.add(category)
    }
    setExpandedCategories(newExpanded)
  }

  const handleDragStart = (e: React.DragEvent, componentType: ComponentType, componentName: string) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('componentType', componentType)
    e.dataTransfer.setData('componentName', componentName)
  }

  const handleComponentDrop = (e: React.DragEvent) => {
    e.preventDefault()
    
    const componentType = e.dataTransfer.getData('componentType') as ComponentType
    const componentName = e.dataTransfer.getData('componentName')
    
    if (!componentType) return

    // Create new component instance
    const newComponent = createComponentInstance(
      componentType,
      `${componentName}${schematic.components.filter(c => c.type === componentType).length + 1}`,
      100 + Math.random() * 200,
      100 + Math.random() * 200
    )

    const updatedSchematic = addComponentToSchematic(schematic, newComponent)
    onAddComponent(updatedSchematic)
  }

  const categoryIcons: Record<string, string> = {
    power: '⚡',
    passive: '🔌',
    active: '🖲️',
    connector: '🔗',
    misc: '🔧'
  }

  return (
    <div className="h-full flex flex-col bg-white border-r overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 flex-shrink-0">
        <h2 className="font-bold text-lg">Component Library</h2>
        <p className="text-xs text-blue-100">Drag components to canvas</p>
      </div>

      {/* Component categories */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {Object.entries(grouped).map(([category, components]) => (
          <div key={category}>
            {/* Category header */}
            <button
              onClick={() => toggleCategory(category)}
              className="w-full flex items-center gap-2 p-2 hover:bg-gray-100 rounded transition-colors text-sm font-semibold"
            >
              {expandedCategories.has(category) ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
              <span>{categoryIcons[category] || '📦'}</span>
              <span className="capitalize">{category}</span>
              <span className="ml-auto text-xs text-gray-500">({components.length})</span>
            </button>

            {/* Components in category */}
            {expandedCategories.has(category) && (
              <div className="ml-4 space-y-1">
                {components.map(component => (
                  <div
                    key={component.name}
                    draggable
                    onDragStart={(e) => handleDragStart(e, component.type, component.name)}
                    className="p-2 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-blue-100 rounded cursor-move transition-colors border border-gray-200 hover:border-blue-300"
                  >
                    <div className="text-xs font-semibold text-gray-700">
                      {component.displayName}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {component.pins.length} pins
                    </div>
                    {component.defaultProperties && (
                      <div className="text-xs text-gray-400 mt-1">
                        {Object.entries(component.defaultProperties)
                          .slice(0, 2)
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(' • ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Drop zone indicator */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleComponentDrop}
        className="flex-shrink-0 bg-blue-50 border-t-2 border-dashed border-blue-300 p-3 text-center text-xs text-blue-600"
      >
        ⬆️ Drop components here to add to canvas
      </div>

      {/* Patches section */}
      <div className="flex-shrink-0 bg-green-50 border-t p-3 space-y-2">
        <div className="text-xs font-semibold text-green-700">
          📦 Predefined Patches
        </div>
        <div className="space-y-1">
          <button
            onClick={() => onPatchClick?.('uart')}
            className="w-full text-left p-2 text-xs bg-green-100 hover:bg-green-200 rounded transition-colors"
          >
            UART Interface
          </button>
          <button
            onClick={() => onPatchClick?.('led-blink')}
            className="w-full text-left p-2 text-xs bg-green-100 hover:bg-green-200 rounded transition-colors"
          >
            LED Blink
          </button>
          <button
            onClick={() => onPatchClick?.('power-reg')}
            className="w-full text-left p-2 text-xs bg-green-100 hover:bg-green-200 rounded transition-colors"
          >
            Power Regulator
          </button>
        </div>
      </div>
    </div>
  )
}
