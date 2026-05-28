<script setup lang="ts">
import { ref } from 'vue'
import { useInventory } from '@/composables/useInventory'
import { FILAMENT_LABELS, FILAMENT_KEYS } from '@/composables/useFilaments'
import type { FilamentType } from '@/composables/useFilaments'

const { spools, parts, addSpool, updateSpoolGrams, deleteSpool, addPart, printBatch, deletePart } = useInventory()

type AddMode = 'none' | 'filament' | 'part'
const addMode = ref<AddMode>('none')

function openAdd(mode: AddMode) {
  addMode.value = addMode.value === mode ? 'none' : mode
  resetForms()
}

function resetForms() {
  fType.value = 'pla_plus'; fName.value = ''; fColour.value = ''; fRolls.value = null
  pName.value = ''; pType.value = 'pla_plus'; pGrams.value = null
  pHours.value = null; pMins.value = null; pLabour.value = null; pBatch.value = null
}

// Filament form
const fType   = ref<FilamentType>('pla_plus')
const fName   = ref('')
const fColour = ref('')
const fRolls  = ref<number | null>(null)

function submitFilament() {
  if (!fRolls.value || fRolls.value <= 0) return
  addSpool({ type: fType.value, customName: fName.value.trim(), colour: fColour.value.trim(), grams: fRolls.value * 1000 })
  addMode.value = 'none'; resetForms()
}

// Part form
const pName   = ref('')
const pType   = ref<FilamentType>('pla_plus')
const pGrams  = ref<number | null>(null)
const pHours  = ref<number | null>(0)
const pMins   = ref<number | null>(0)
const pLabour = ref<number | null>(15)
const pBatch  = ref<number | null>(1)

function submitPart() {
  const name = pName.value.trim()
  if (!name || !pGrams.value) return
  addPart({
    name, filamentType: pType.value, gramsPerUnit: pGrams.value,
    printHoursPerUnit: pHours.value ?? 0, printMinsPerUnit: pMins.value ?? 0,
    labourMinsPerUnit: pLabour.value ?? 0, batchSize: pBatch.value ?? 1,
  })
  addMode.value = 'none'; resetForms()
}

function typeLabel(t: FilamentType) { return FILAMENT_LABELS[t] }

function gramsDisplay(g: number) {
  return g >= 1000 ? `${(g / 1000).toFixed(2)} rolls (${Math.round(g)}g)` : `${Math.round(g)}g`
}

function doPrintBatch(partId: string) {
  const part = parts.value.find(p => p.id === partId)
  if (!part) return
  const gramsNeeded = part.gramsPerUnit * part.batchSize
  const avail = spools.value.filter(s => s.type === part.filamentType).reduce((sum, s) => sum + s.grams, 0)
  const warn = avail < gramsNeeded ? `\n⚠️ Only ${Math.round(avail)}g available — ${Math.round(gramsNeeded)}g needed.` : ''
  if (!confirm(`Log a batch of ${part.batchSize}× "${part.name}"?\nDeducts ~${Math.round(gramsNeeded)}g of ${typeLabel(part.filamentType)}.${warn}`)) return
  printBatch(partId)
}

function confirmDeleteSpool(id: string) {
  if (!confirm('Remove this spool?')) return
  deleteSpool(id)
}

function confirmDeletePart(id: string) {
  if (!confirm('Delete this part definition?')) return
  deletePart(id)
}

// Inline stock edit
const editingId  = ref<string | null>(null)
const editingVal = ref(0)

function startEdit(id: string, current: number) { editingId.value = id; editingVal.value = current }
function saveEdit(id: string) {
  const p = parts.value.find(p => p.id === id)
  if (p) p.inStock = Math.max(0, editingVal.value)
  editingId.value = null
}

function numInput(e: Event): number | null {
  const v = (e.target as HTMLInputElement).value
  return v === '' ? null : Number(v)
}
</script>

<template>
  <div class="inv-root">

    <!-- Add-stock bar -->
    <div class="add-bar">
      <button class="add-bar-btn" :class="{ active: addMode === 'filament' }" @click="openAdd('filament')">🧵 Add Filament</button>
      <button class="add-bar-btn" :class="{ active: addMode === 'part' }" @click="openAdd('part')">📦 Define New Part</button>
    </div>

    <!-- Filament add form -->
    <Transition name="slide">
      <div v-if="addMode === 'filament'" class="add-panel">
        <p class="add-panel-title">Add Filament Stock</p>
        <div class="add-grid">
          <div class="field-g">
            <label>Filament type</label>
            <select v-model="fType" class="inv-select">
              <option v-for="k in FILAMENT_KEYS" :key="k" :value="k">{{ typeLabel(k) }}</option>
            </select>
          </div>
          <div class="field-g field-wide">
            <label>Brand / name <span class="opt">(optional)</span></label>
            <input class="inv-input" type="text" placeholder="e.g. Bambu PLA+ Matte" v-model="fName" @keydown.enter="submitFilament" />
          </div>
          <div class="field-g">
            <label>Colour</label>
            <input class="inv-input" type="text" placeholder="e.g. Black" v-model="fColour" @keydown.enter="submitFilament" />
          </div>
          <div class="field-g field-sm">
            <label>Number of 1kg rolls</label>
            <div class="input-unit-row">
              <input class="inv-input" type="number" :min="0.1" step="0.5" placeholder="e.g. 2"
                :value="fRolls ?? ''" @input="fRolls = numInput($event)" @keydown.enter="submitFilament" />
              <span class="unit-lbl">rolls</span>
            </div>
          </div>
        </div>
        <div class="add-panel-actions">
          <button class="btn-submit" @click="submitFilament" :disabled="!fRolls || fRolls <= 0">+ Add to Stock</button>
          <button class="btn-cancel" @click="addMode = 'none'">Cancel</button>
        </div>
      </div>
    </Transition>

    <!-- Part add form -->
    <Transition name="slide">
      <div v-if="addMode === 'part'" class="add-panel">
        <p class="add-panel-title">Define New Part</p>
        <p class="add-panel-sub">All specs are per single unit. Batch size = how many you print in one run.</p>
        <div class="add-grid">
          <div class="field-g field-wide">
            <label>Part name</label>
            <input class="inv-input" type="text" placeholder="e.g. Cable clip v2" v-model="pName" @keydown.enter="submitPart" />
          </div>
          <div class="field-g">
            <label>Filament type</label>
            <select v-model="pType" class="inv-select">
              <option v-for="k in FILAMENT_KEYS" :key="k" :value="k">{{ typeLabel(k) }}</option>
            </select>
          </div>
          <div class="field-g field-sm">
            <label>Filament per unit</label>
            <div class="input-unit-row">
              <input class="inv-input num-sm" type="number" :min="0" step="1" placeholder="e.g. 45"
                :value="pGrams ?? ''" @input="pGrams = numInput($event)" @keydown.enter="submitPart" />
              <span class="unit-lbl">g</span>
            </div>
          </div>
          <div class="field-g field-sm">
            <label>Print time per unit</label>
            <div class="duration-row">
              <input class="inv-input num-sm" type="number" :min="0" step="1" placeholder="0"
                :value="pHours ?? ''" @input="pHours = numInput($event)" @keydown.enter="submitPart" />
              <span class="unit-lbl">h</span>
              <input class="inv-input num-sm" type="number" :min="0" :max="59" step="1" placeholder="0"
                :value="pMins ?? ''" @input="pMins = numInput($event)" @keydown.enter="submitPart" />
              <span class="unit-lbl">m</span>
            </div>
          </div>
          <div class="field-g field-sm">
            <label>Labour per unit</label>
            <div class="input-unit-row">
              <input class="inv-input num-sm" type="number" :min="0" step="1" placeholder="e.g. 5"
                :value="pLabour ?? ''" @input="pLabour = numInput($event)" @keydown.enter="submitPart" />
              <span class="unit-lbl">min</span>
            </div>
          </div>
          <div class="field-g field-sm">
            <label>Batch size</label>
            <div class="input-unit-row">
              <input class="inv-input num-sm" type="number" :min="1" step="1" placeholder="e.g. 8"
                :value="pBatch ?? ''" @input="pBatch = numInput($event)" @keydown.enter="submitPart" />
              <span class="unit-lbl">units</span>
            </div>
          </div>
        </div>
        <div class="add-panel-actions">
          <button class="btn-submit" @click="submitPart" :disabled="!pName.trim() || !pGrams">Save Part</button>
          <button class="btn-cancel" @click="addMode = 'none'">Cancel</button>
        </div>
      </div>
    </Transition>

    <!-- Filament Stock -->
    <section class="inv-section">
      <p class="panel-heading">🧵 Filament Stock</p>
      <p v-if="spools.length === 0" class="inv-empty">No filament added yet — click <strong>Add Filament</strong> above.</p>
      <div v-else class="table-wrap">
        <table class="inv-table">
          <thead>
            <tr><th>Type</th><th>Name / Brand</th><th>Colour</th><th class="col-rem">Remaining</th><th class="col-del-h"></th></tr>
          </thead>
          <tbody>
            <tr v-for="s in spools" :key="s.id" :class="{ 'row-low': s.grams < 100 }">
              <td><span class="type-chip">{{ typeLabel(s.type) }}</span></td>
              <td class="name-cell">{{ s.customName || '—' }}</td>
              <td>{{ s.colour || '—' }}</td>
              <td class="col-rem">
                <div class="rem-edit">
                  <input class="rem-input" type="number" :min="0" step="50"
                    :value="Math.round(s.grams)"
                    @change="updateSpoolGrams(s.id, Number(($event.target as HTMLInputElement).value))" />
                  <span class="unit-lbl">g</span>
                  <span class="rem-sub">({{ (s.grams / 1000).toFixed(2) }} rolls)</span>
                </div>
              </td>
              <td class="col-del-h"><button class="btn-del" @click="confirmDeleteSpool(s.id)">🗑️</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Printed Parts -->
    <section class="inv-section">
      <p class="panel-heading">📦 Printed Parts</p>
      <p v-if="parts.length === 0" class="inv-empty">No parts defined yet — click <strong>Define New Part</strong> above.</p>
      <div v-else class="table-wrap">
        <table class="inv-table parts-table">
          <thead>
            <tr><th>Part</th><th>Filament</th><th class="col-spec">Spec (per unit)</th><th>Batch</th><th class="col-stock">In Stock</th><th class="col-act2"></th></tr>
          </thead>
          <tbody>
            <tr v-for="p in parts" :key="p.id" :class="{ 'row-low': p.inStock === 0 }">
              <td class="name-cell">{{ p.name }}</td>
              <td><span class="type-chip">{{ typeLabel(p.filamentType) }}</span></td>
              <td class="col-spec spec-cell">
                {{ p.gramsPerUnit }}g ·
                <span v-if="p.printHoursPerUnit">{{ p.printHoursPerUnit }}h </span>{{ p.printMinsPerUnit }}m ·
                {{ p.labourMinsPerUnit }}min labour
              </td>
              <td>{{ p.batchSize }} units</td>
              <td class="col-stock">
                <div v-if="editingId === p.id" class="rem-edit">
                  <input class="rem-input" type="number" :min="0" step="1" v-model.number="editingVal"
                    @keydown.enter="saveEdit(p.id)" @blur="saveEdit(p.id)" />
                </div>
                <button v-else class="stock-badge" :class="{ 'stock-zero': p.inStock === 0 }" @click="startEdit(p.id, p.inStock)">
                  {{ p.inStock }}
                </button>
              </td>
              <td class="col-act2">
                <button class="btn-batch" @click="doPrintBatch(p.id)">🖨️ Print Batch</button>
                <button class="btn-del" @click="confirmDeletePart(p.id)">🗑️</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

  </div>
</template>

<style scoped>
.inv-root { display: flex; flex-direction: column; gap: 1.5rem; width: 100%; }

.add-bar { display: flex; gap: 10px; flex-wrap: wrap; }
.add-bar-btn { padding: 9px 18px; background: #0f2040; border: 1px solid #1a3a5c; border-radius: 8px; color: #7090b0; font-size: 0.88rem; font-weight: 600; cursor: pointer; transition: background 0.15s, color 0.15s, border-color 0.15s; }
.add-bar-btn:hover  { background: #1a3a5c; color: #c0c8d8; }
.add-bar-btn.active { background: rgba(74,144,217,0.12); border-color: #4a90d9; color: #4a90d9; }

.add-panel { background: #0a1628; border: 1px solid #1a3a5c; border-radius: 10px; padding: 18px 20px; }
.add-panel-title { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.08em; color: #4a90d9; font-weight: 700; margin-bottom: 4px; }
.add-panel-sub { font-size: 0.8rem; color: #5a7a9a; margin-bottom: 14px; }
.add-grid { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 14px; }
.field-g { display: flex; flex-direction: column; gap: 5px; flex: 1; min-width: 150px; }
.field-sm { min-width: 110px; flex: 0 1 auto; }
.field-wide { min-width: 210px; flex: 2; }
.field-g label { font-size: 0.78rem; color: #5a7a9a; font-weight: 500; }
.opt { font-weight: 400; opacity: 0.7; }
.inv-input { background: #0f2040; border: 1px solid #1a3a5c; border-radius: 7px; color: #e0e8f0; font-size: 0.9rem; padding: 8px 10px; outline: none; transition: border-color 0.2s; width: 100%; box-sizing: border-box; }
.inv-input:focus { border-color: #4a90d9; }
.inv-input::placeholder { color: #2a4a6a; }
.inv-select { background: #0f2040; border: 1px solid #1a3a5c; border-radius: 7px; color: #e0e8f0; font-size: 0.9rem; padding: 8px 10px; outline: none; cursor: pointer; width: 100%; }
.inv-select:focus { border-color: #4a90d9; }
.input-unit-row { display: flex; align-items: center; gap: 6px; }
.duration-row { display: flex; align-items: center; gap: 4px; }
.num-sm { width: 60px !important; text-align: center; padding: 8px 6px; }
.unit-lbl { color: #5a7a9a; font-size: 0.8rem; white-space: nowrap; flex-shrink: 0; }
.add-panel-actions { display: flex; gap: 10px; }
.btn-submit { padding: 9px 20px; background: #1a4a7a; border: none; border-radius: 7px; color: #e0e8f0; font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: background 0.15s; }
.btn-submit:hover { background: #2a6aaa; }
.btn-submit:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-cancel { padding: 9px 16px; background: transparent; border: 1px solid #2a4a6a; border-radius: 7px; color: #5a7a9a; font-size: 0.9rem; cursor: pointer; }
.btn-cancel:hover { border-color: #4a90d9; color: #c0c8d8; }

.inv-section { width: 100%; }
.inv-empty { color: #406080; font-size: 0.88rem; padding: 10px 0; }
.table-wrap { overflow-x: auto; }
.inv-table { width: 100%; border-collapse: collapse; font-size: 0.87rem; }
.inv-table thead tr { background: #08111e; }
.inv-table thead th { padding: 8px 12px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.07em; color: #3a6080; white-space: nowrap; }
.inv-table tbody tr { border-bottom: 1px solid #0f2035; transition: background 0.1s; }
.inv-table tbody tr:hover { background: #0c1e35; }
.inv-table tbody tr.row-low .name-cell { color: #e94560; }
.inv-table tbody td { padding: 10px 12px; color: #b0bcd0; }
.name-cell { font-weight: 500; color: #c8d8e8; }
.type-chip { display: inline-block; padding: 2px 8px; border-radius: 4px; background: #1a3050; color: #6090b8; font-size: 0.76rem; font-weight: 600; }
.col-rem  { width: 200px; }
.col-del-h { width: 44px; text-align: center; }
.col-spec { width: 220px; }
.col-stock { width: 80px; text-align: center; }
.col-act2 { width: 155px; text-align: right; white-space: nowrap; }
.spec-cell { color: #5a7a9a; font-size: 0.82rem; }
.rem-edit { display: flex; align-items: center; gap: 5px; }
.rem-input { width: 72px; background: #0f2040; border: 1px solid #1a3a5c; border-radius: 6px; color: #e0e8f0; font-size: 0.88rem; font-weight: 600; padding: 4px 6px; text-align: right; outline: none; }
.rem-input:focus { border-color: #4a90d9; }
.rem-sub { color: #3a6080; font-size: 0.75rem; white-space: nowrap; }
.stock-badge { display: inline-block; min-width: 36px; padding: 3px 8px; border-radius: 12px; background: #1a3a5c; color: #4a90d9; font-size: 0.95rem; font-weight: 700; border: none; cursor: pointer; transition: background 0.15s; }
.stock-badge:hover { background: #2a5a8c; }
.stock-badge.stock-zero { background: rgba(233,69,96,0.15); color: #e94560; }
.btn-batch { padding: 4px 10px; background: #1a3a5c; border: none; border-radius: 6px; color: #a0c0e0; font-size: 0.8rem; cursor: pointer; transition: background 0.15s; margin-right: 6px; }
.btn-batch:hover { background: #2a5a8c; }
.btn-del { background: transparent; border: none; font-size: 0.9rem; cursor: pointer; opacity: 0.45; transition: opacity 0.15s; padding: 4px; }
.btn-del:hover { opacity: 1; }

.slide-enter-active, .slide-leave-active { transition: opacity 0.2s, transform 0.2s; }
.slide-enter-from, .slide-leave-to { opacity: 0; transform: translateY(-8px); }
</style>
