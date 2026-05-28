import { ref, watch } from 'vue'
import type { FilamentType } from './useFilaments'

export interface FilamentSpool {
  id: string
  type: FilamentType
  customName: string   // brand / variant, e.g. "Bambu PLA+ Matte"
  colour: string
  grams: number        // remaining grams (1 roll = 1000 g)
}

export interface PartDefinition {
  id: string
  name: string
  filamentType: FilamentType
  gramsPerUnit: number
  printHoursPerUnit: number
  printMinsPerUnit: number
  labourMinsPerUnit: number
  batchSize: number
  inStock: number
}

function loadItems<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) ?? '[]') } catch { return [] }
}

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

// Module-level shared state
const spools = ref<FilamentSpool[]>(loadItems<FilamentSpool>('inv-spools'))
const parts  = ref<PartDefinition[]>(loadItems<PartDefinition>('inv-part-defs'))

watch(spools, v => localStorage.setItem('inv-spools',    JSON.stringify(v)), { deep: true })
watch(parts,  v => localStorage.setItem('inv-part-defs', JSON.stringify(v)), { deep: true })

export function useInventory() {
  // ── Filament spools ──────────────────────────────────────────────
  function addSpool(data: Omit<FilamentSpool, 'id'>) {
    spools.value.unshift({ id: uid(), ...data })
  }

  function updateSpoolGrams(id: string, grams: number) {
    const s = spools.value.find(s => s.id === id)
    if (s) s.grams = Math.max(0, grams)
  }

  function deleteSpool(id: string) {
    spools.value = spools.value.filter(s => s.id !== id)
  }

  /** Deduct grams from spools of a given type (oldest-first). Silent if stock runs out. */
  function deductFilament(type: FilamentType, grams: number) {
    let rem = grams
    for (const s of [...spools.value].filter(s => s.type === type && s.grams > 0)) {
      if (rem <= 0) break
      const take = Math.min(s.grams, rem)
      s.grams -= take
      rem -= take
    }
  }

  /** Total grams available for a filament type */
  function availableGrams(type: FilamentType): number {
    return spools.value.filter(s => s.type === type).reduce((sum, s) => sum + s.grams, 0)
  }

  // ── Part definitions ─────────────────────────────────────────────
  function addPart(data: Omit<PartDefinition, 'id' | 'inStock'>) {
    parts.value.unshift({ id: uid(), inStock: 0, ...data })
  }

  function updatePartStock(id: string, inStock: number) {
    const p = parts.value.find(p => p.id === id)
    if (p) p.inStock = Math.max(0, inStock)
  }

  function deletePart(id: string) {
    parts.value = parts.value.filter(p => p.id !== id)
  }

  /** Log a completed batch print: adds batchSize to stock and deducts filament. */
  function printBatch(partId: string) {
    const part = parts.value.find(p => p.id === partId)
    if (!part) return
    part.inStock += part.batchSize
    deductFilament(part.filamentType, part.gramsPerUnit * part.batchSize)
  }

  /** Deduct qty from a part's stock (called when invoiced). */
  function deductPartStock(partId: string, qty: number) {
    const part = parts.value.find(p => p.id === partId)
    if (part) part.inStock = Math.max(0, part.inStock - qty)
  }

  return {
    spools, parts,
    addSpool, updateSpoolGrams, deleteSpool, deductFilament, availableGrams,
    addPart, updatePartStock, deletePart, printBatch, deductPartStock,
  }
}
