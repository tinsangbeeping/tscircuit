/**
 * Patch Management Service
 * 
 * Handles saving, loading, and managing patches
 * Uses Circuit JSON format for compatibility with tscircuit ecosystem
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs"
import { join } from "path"
import type {
  PatchData,
  PatchLibraryEntry,
  PatchValidationError,
} from "./patch.ts"
import { validatePatch, circuitJsonToPatch } from "./patch.ts"

/**
 * Patch Storage Configuration
 */
interface PatchStorageConfig {
  /** Directory where patches are stored */
  patchDir: string
  
  /** Directory for patch library index */
  libraryDir: string
  
  /** Directory for patch backups */
  backupDir: string
}

/**
 * Patch Manager Service
 */
export class PatchManager {
  private config: PatchStorageConfig
  private libraryIndex: Map<string, PatchLibraryEntry> = new Map()
  
  constructor(config: Partial<PatchStorageConfig> = {}) {
    this.config = {
      patchDir: config.patchDir || "./patches",
      libraryDir: config.libraryDir || "./patches/library",
      backupDir: config.backupDir || "./patches/.backup",
    }
    
    // Create directories if they don't exist
    this.ensureDirectories()
    
    // Load library index
    this.loadLibraryIndex()
  }
  
  /**
   * Ensure all required directories exist
   */
  private ensureDirectories(): void {
    for (const dir of [this.config.patchDir, this.config.libraryDir, this.config.backupDir]) {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true })
      }
    }
  }
  
  /**
   * Save a patch to disk
   * 
   * @param patch The patch to save
   * @param filename Optional filename (defaults to patch name)
   * @returns Path where patch was saved
   */
  savePatch(patch: PatchData, filename?: string): string {
    // Validate patch before saving
    const errors = validatePatch(patch)
    const hasErrors = errors.some(e => e.severity === "error")
    
    if (hasErrors) {
      const errorMessages = errors
        .filter(e => e.severity === "error")
        .map(e => e.message)
        .join(", ")
      throw new Error(`Cannot save patch with errors: ${errorMessages}`)
    }
    
    // Update modification time
    patch.metadata.modifiedAt = new Date().toISOString()
    
    // Generate filename
    const name = filename || `${patch.metadata.name.replace(/\s+/g, "_")}_v${patch.metadata.version}.tscircuit`
    const filepath = join(this.config.patchDir, name)
    
    // Create backup of existing file
    if (existsSync(filepath)) {
      const backupName = `${name}.${Date.now()}.backup`
      const backupPath = join(this.config.backupDir, backupName)
      const content = readFileSync(filepath)
      writeFileSync(backupPath, content)
    }
    
    // Save patch as JSON
    writeFileSync(filepath, JSON.stringify(patch, null, 2))
    
    // Update library index
    this.updateLibraryIndex(patch, filepath)
    
    console.log(`✅ Patch saved: ${filepath}`)
    return filepath
  }
  
  /**
   * Load a patch from disk
   * 
   * @param filepath Path to the patch file
   * @returns The loaded patch
   */
  loadPatch(filepath: string): PatchData {
    if (!existsSync(filepath)) {
      throw new Error(`Patch file not found: ${filepath}`)
    }
    
    const content = readFileSync(filepath, "utf-8")
    const json = JSON.parse(content)
    
    const patch = circuitJsonToPatch(json)
    console.log(`✅ Patch loaded: ${filepath}`)
    
    return patch
  }
  
  /**
   * Get all patches in the library
   */
  getLibrary(): PatchLibraryEntry[] {
    return Array.from(this.libraryIndex.values())
  }
  
  /**
   * Get a specific patch from library
   */
  getLibraryEntry(patchId: string): PatchLibraryEntry | undefined {
    return this.libraryIndex.get(patchId)
  }
  
  /**
   * Delete a patch from library
   */
  deletePatch(patchId: string): boolean {
    const entry = this.libraryIndex.get(patchId)
    if (!entry) return false
    
    try {
      if (existsSync(entry.filePath)) {
        // Move to backup instead of deleting
        const backupName = `deleted_${Date.now()}_${entry.name}.tscircuit`
        const backupPath = join(this.config.backupDir, backupName)
        const content = readFileSync(entry.filePath)
        writeFileSync(backupPath, content)
      }
      
      this.libraryIndex.delete(patchId)
      this.saveLibraryIndex()
      
      console.log(`✅ Patch deleted (moved to backup): ${patchId}`)
      return true
    } catch (error) {
      console.error(`Error deleting patch: ${error}`)
      return false
    }
  }
  
  /**
   * Search patches by name or tag
   */
  searchPatches(query: string): PatchLibraryEntry[] {
    const lowerQuery = query.toLowerCase()
    
    return Array.from(this.libraryIndex.values()).filter(entry =>
      entry.name.toLowerCase().includes(lowerQuery) ||
      entry.metadata.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    )
  }
  
  /**
   * Export patch as .tscircuit file
   */
  exportPatch(patchId: string, outputPath: string): boolean {
    const entry = this.libraryIndex.get(patchId)
    if (!entry) return false
    
    try {
      const content = readFileSync(entry.filePath)
      writeFileSync(outputPath, content)
      console.log(`✅ Patch exported: ${outputPath}`)
      return true
    } catch (error) {
      console.error(`Error exporting patch: ${error}`)
      return false
    }
  }
  
  /**
   * Import a .tscircuit file into the library
   */
  importPatch(filepath: string): PatchLibraryEntry {
    const patch = this.loadPatch(filepath)
    
    // Save to patch directory
    const savedPath = this.savePatch(patch)
    
    // Create library entry
    const entry: PatchLibraryEntry = {
      id: `patch_${Date.now()}`,
      name: patch.metadata.name,
      filePath: savedPath,
      metadata: patch.metadata,
      lastUsed: new Date().toISOString(),
    }
    
    this.libraryIndex.set(entry.id, entry)
    this.saveLibraryIndex()
    
    console.log(`✅ Patch imported: ${entry.name}`)
    return entry
  }
  
  /**
   * Get patch validation errors
   */
  validatePatchId(patchId: string): PatchValidationError[] {
    const entry = this.libraryIndex.get(patchId)
    if (!entry) return []
    
    const patch = this.loadPatch(entry.filePath)
    return validatePatch(patch)
  }
  
  /**
   * Update library index entry
   */
  private updateLibraryIndex(patch: PatchData, filepath: string): void {
    const id = `patch_${patch.metadata.name.replace(/\s+/g, "_")}`
    
    const entry: PatchLibraryEntry = {
      id,
      name: patch.metadata.name,
      filePath: filepath,
      metadata: patch.metadata,
      lastUsed: new Date().toISOString(),
    }
    
    this.libraryIndex.set(id, entry)
    this.saveLibraryIndex()
  }
  
  /**
   * Load library index from disk
   */
  private loadLibraryIndex(): void {
    const indexPath = join(this.config.libraryDir, "index.json")
    
    if (existsSync(indexPath)) {
      try {
        const content = readFileSync(indexPath, "utf-8")
        const data = JSON.parse(content)
        
        for (const entry of data) {
          this.libraryIndex.set(entry.id, entry)
        }
        
        console.log(`✅ Library index loaded: ${this.libraryIndex.size} patches`)
      } catch (error) {
        console.warn(`Could not load library index: ${error}`)
      }
    }
  }
  
  /**
   * Save library index to disk
   */
  private saveLibraryIndex(): void {
    const indexPath = join(this.config.libraryDir, "index.json")
    const data = Array.from(this.libraryIndex.values())
    
    writeFileSync(indexPath, JSON.stringify(data, null, 2))
  }
}

/**
 * Global patch manager instance
 */
export const patchManager = new PatchManager()
