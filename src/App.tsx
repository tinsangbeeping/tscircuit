import React, { useState, useCallback } from 'react'
import { SchematicCanvas } from './components/SchematicCanvas'
import { ComponentSidebar } from './components/ComponentSidebar'
import { Schematic, SchematicComponent, createSchematic, addComponentToSchematic, exportSchematicAsJSON } from './lib/schematic'
import { PATCH_LIBRARY } from './lib/patches'
import { Download, FileUp, Plus } from 'lucide-react'

export function App() {
  const [schematic, setSchematic] = useState<Schematic>(() =>
    createSchematic('My Circuit', 'Drag components from the sidebar to get started')
  )
  const [selectedComponentId, setSelectedComponentId] = useState<string | undefined>()

  const handleAddComponent = useCallback((updatedSchematic: Schematic) => {
    setSchematic(updatedSchematic)
  }, [])

  const handleSelectComponent = useCallback((component: SchematicComponent | null) => {
    setSelectedComponentId(component?.id)
  }, [])

  const handlePatchClick = (patchName: string) => {
    const patches = {
      uart: PATCH_LIBRARY[0],
      'led-blink': PATCH_LIBRARY[1],
      'power-reg': PATCH_LIBRARY[2]
    }

    const patch = patches[patchName as keyof typeof patches]
    if (!patch) return

    // Add all components from the patch
    let updatedSchematic = schematic
    patch.components.forEach(component => {
      updatedSchematic = addComponentToSchematic(updatedSchematic, {
        ...component,
        x: component.x + 50 + Math.random() * 100,
        y: component.y + 50 + Math.random() * 100
      })
    })

    // Add connections from the patch
    updatedSchematic.connections.push(...patch.connections)

    setSchematic(updatedSchematic)
  }

  const handleExport = () => {
    const json = exportSchematicAsJSON(schematic)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${schematic.name}-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const json = event.target?.result as string
        const imported = JSON.parse(json)
        setSchematic({
          ...imported,
          created: new Date(imported.created),
          modified: new Date(imported.modified)
        })
      } catch (err) {
        alert('Error importing file: ' + (err instanceof Error ? err.message : 'Unknown error'))
      }
    }
    reader.readAsText(file)
  }

  const handleNewSchematic = () => {
    if (window.confirm('Create a new schematic? Any unsaved changes will be lost.')) {
      setSchematic(createSchematic('New Circuit'))
      setSelectedComponentId(undefined)
    }
  }

  return (
    <div className="w-full h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm px-6 py-4 flex justify-between items-center flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">🧩 Schematic Editor</h1>
          <p className="text-sm text-gray-500">Interactive circuit design with TSCircuit components</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Component count */}
          <div className="text-sm">
            <span className="font-semibold">{schematic.components.length}</span>
            <span className="text-gray-500"> components • </span>
            <span className="font-semibold">{schematic.connections.length}</span>
            <span className="text-gray-500"> nets</span>
          </div>

          {/* Control buttons */}
          <div className="flex gap-2 border-l pl-4">
            <button
              onClick={handleNewSchematic}
              className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
            >
              <Plus size={16} />
              New
            </button>

            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-sm"
            >
              <Download size={16} />
              Export
            </button>

            <label className="flex items-center gap-2 px-3 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors text-sm cursor-pointer">
              <FileUp size={16} />
              Import
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0 overflow-hidden">
          <ComponentSidebar
            schematic={schematic}
            onAddComponent={handleAddComponent}
            onPatchClick={handlePatchClick}
          />
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-hidden">
          <SchematicCanvas
            schematic={schematic}
            onUpdate={setSchematic}
            onSelectComponent={handleSelectComponent}
            selectedComponentId={selectedComponentId}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-100 border-t px-6 py-2 text-xs text-gray-600 flex-shrink-0">
        <span>💡 Drag components from the sidebar • Select and rotate with buttons • Right-click for context menu</span>
      </div>
    </div>
  )
}
