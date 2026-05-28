<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useInventory } from '@/composables/useInventory'
import { FILAMENT_LABELS } from '@/composables/useFilaments'
import type { PartDefinition } from '@/composables/useInventory'

const emit = defineEmits<{
  /** Fill the calculator with a part's specs and trigger calculate */
  fillPart: [part: PartDefinition]
  /** Clear any part selection */
  clear: []
}>()

const { parts } = useInventory()

const selectedId = ref<string>('')
const selectedPart = computed<PartDefinition | null>(
  () => parts.value.find(p => p.id === selectedId.value) ?? null
)

watch(selectedId, () => {
  if (selectedPart.value) {
    emit('fillPart', selectedPart.value)
  } else {
    emit('clear')
  }
})

function typeLabel(p: PartDefinition) {
  return FILAMENT_LABELS[p.filamentType]
}
</script>

<template>
  <div class="sfj-root">

    <div class="sfj-field">
      <label for="stockPart">Select part</label>
      <select id="stockPart" v-model="selectedId" class="sfj-select">
        <option value="">— choose a part —</option>
        <option v-for="p in parts" :key="p.id" :value="p.id">
          {{ p.name }} ({{ typeLabel(p) }} · {{ p.gramsPerUnit }}g · {{ p.inStock }} in stock)
        </option>
      </select>
    </div>

    <div v-if="selectedPart" class="sfj-spec">
      <div class="spec-row"><span class="spec-lbl">Filament</span><span class="spec-val">{{ typeLabel(selectedPart) }} · {{ selectedPart.gramsPerUnit }}g per unit</span></div>
      <div class="spec-row"><span class="spec-lbl">Print time</span><span class="spec-val">{{ selectedPart.printHoursPerUnit }}h {{ selectedPart.printMinsPerUnit }}m per unit</span></div>
      <div class="spec-row"><span class="spec-lbl">Labour</span><span class="spec-val">{{ selectedPart.labourMinsPerUnit }} min per unit</span></div>
      <div class="spec-row"><span class="spec-lbl">In stock</span>
        <span class="spec-val" :class="selectedPart.inStock === 0 ? 'val-warn' : 'val-ok'">{{ selectedPart.inStock }} units</span>
      </div>
    </div>

    <p v-else class="sfj-hint">Choose a part from the dropdown — specs will auto-fill the calculator below.</p>

  </div>
</template>

<style scoped>
.sfj-root {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.sfj-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.sfj-field label {
  font-size: 0.78rem;
  color: #5a7a9a;
  font-weight: 500;
}

.sfj-select {
  width: 100%;
  background: #0f2040;
  border: 1px solid #1a3a5c;
  border-radius: 8px;
  color: #e0e8f0;
  font-size: 0.95rem;
  padding: 10px 12px;
  outline: none;
  cursor: pointer;
  transition: border-color 0.2s;
}
.sfj-select:focus { border-color: #4a90d9; }

.sfj-spec {
  background: #0a1628;
  border: 1px solid #1a3a5c;
  border-radius: 8px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.spec-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
}

.spec-lbl { color: #5a7a9a; }
.spec-val { color: #c0d0e0; font-weight: 600; }
.val-ok   { color: #4caf50; }
.val-warn { color: #e94560; }

.sfj-hint {
  font-size: 0.82rem;
  color: #3a5a7a;
  text-align: center;
  padding: 8px 0;
}
</style>
