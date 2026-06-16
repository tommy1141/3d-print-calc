import { ref, watch } from 'vue'
import type { FilamentType } from './useFilaments'

// 'any' = part can be printed in whatever filament is on hand;
// the filament type is chosen per-job/per-batch instead of being fixed on the part.
export type PartFilamentType = FilamentType | 'any'

export interface FilamentSpool {
  id: string
  type: FilamentType
  customName: string   // brand / variant, e.g. "Bambu PLA+ Matte"
  colour: string
  grams: number        // remaining grams (1 roll = 1000 g)
  pricePaid: number    // total purchase cost for this spool entry
}

export interface PartDefinition {
  id: string
  name: string
  filamentType: PartFilamentType
  gramsPerUnit: number
  printHoursPerUnit: number
  printMinsPerUnit: number
  labourMinsPerUnit: number
  batchSize: number
  batchFilamentGrams?: number  // total grams for one full batch run (overrides gramsPerUnit × batchSize for deduction)
  batchPrintHours?: number    // print time for a full batch (stored only, not yet used)
  batchPrintMins?: number
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
    // If same type + brand + colour already exists, merge grams and cost into it
    const existing = spools.value.find(s =>
      s.type === data.type &&
      s.customName === data.customName &&
      s.colour.toLowerCase() === data.colour.toLowerCase()
    )
    if (existing) {
      existing.grams     += data.grams
      existing.pricePaid += data.pricePaid
    } else {
      spools.value.unshift({ id: uid(), ...data })
    }
  }

  function updateSpoolGrams(id: string, grams: number) {
    const s = spools.value.find(s => s.id === id)
    if (s) s.grams = Math.max(0, grams)
  }

  function updateSpool(id: string, data: Omit<FilamentSpool, 'id'>) {
    const s = spools.value.find(s => s.id === id)
    if (!s) return
    Object.assign(s, { ...data, grams: Math.max(0, data.grams) })
  }

  /** Set a spool's remaining rolls, scaling pricePaid proportionally. */
  function setSpoolRolls(id: string, rolls: number) {
    const s = spools.value.find(s => s.id === id)
    if (!s) return
    const newGrams = Math.max(0, rolls * 1000)
    const ratio = s.grams > 0 ? newGrams / s.grams : 0
    s.pricePaid = Math.round(s.pricePaid * ratio * 100) / 100
    s.grams = newGrams
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

  /** Log a completed batch print: adds batchSize to stock and deducts filament.
   *  For 'any'-filament parts, `filamentType` selects which spool type to deduct from. */
  function printBatch(partId: string, filamentType?: FilamentType) {
    const part = parts.value.find(p => p.id === partId)
    if (!part) return
    part.inStock += part.batchSize
    const type = part.filamentType === 'any' ? filamentType : part.filamentType
    if (!type) return
    // Use explicit batch filament total if set, otherwise estimate from per-unit grams
    deductFilament(type, part.batchFilamentGrams ?? part.gramsPerUnit * part.batchSize)
  }

  /** Update an existing part definition (preserves id and inStock). */
  function updatePart(id: string, data: Omit<PartDefinition, 'id' | 'inStock'>) {
    const p = parts.value.find(p => p.id === id)
    if (!p) return
    Object.assign(p, data)
  }

  /** Deduct qty from a part's stock (called when invoiced). */
  function deductPartStock(partId: string, qty: number) {
    const part = parts.value.find(p => p.id === partId)
    if (part) part.inStock = Math.max(0, part.inStock - qty)
  }

  /** Restore qty back to a part's stock (called when order item removed/reduced). */
  function restorePartStock(partId: string, qty: number) {
    const part = parts.value.find(p => p.id === partId)
    if (part) part.inStock += qty
  }

  /** Add grams back to the first spool of a given type. */
  function restoreFilament(type: FilamentType, grams: number) {
    const spool = spools.value.find(s => s.type === type)
    if (spool) spool.grams += grams
  }

  return {
    spools, parts, updatePart,
    addSpool, updateSpoolGrams, updateSpool, setSpoolRolls, deleteSpool,
    deductFilament, restoreFilament, availableGrams,
    addPart, updatePartStock, deletePart, printBatch, deductPartStock, restorePartStock,
  }
}
