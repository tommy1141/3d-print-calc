<script setup lang="ts">
import InputField from '@/components/InputField.vue'
import { useFilaments, FILAMENT_LABELS, FILAMENT_KEYS } from '@/composables/useFilaments'

defineProps<{ showError: boolean }>()

const emit = defineEmits<{ calculate: [] }>()

const { selectedType, selectedPrice } = useFilaments()

const printGrams = defineModel<number | null>('printGrams')
const printHours = defineModel<number | null>('printHours')
const printMins  = defineModel<number | null>('printMins')
const labourMins = defineModel<number | null>('labourMins')
const jobDesc    = defineModel<string>('jobDesc')
</script>

<template>
  <div @keydown.enter="emit('calculate')">
    <!-- Filament type -->
    <label for="filamentType">Filament type</label>
    <div class="filament-row">
      <select id="filamentType" v-model="selectedType" class="filament-select">
        <option v-for="key in FILAMENT_KEYS" :key="key" :value="key">
          {{ FILAMENT_LABELS[key] }}
        </option>
      </select>
      <span class="filament-price" v-if="selectedPrice !== null">
        £{{ selectedPrice?.toFixed(2) }}/kg
      </span>
      <span class="filament-price no-price" v-else>
        No price set — go to Materials
      </span>
    </div>

    <!-- Filament used -->
    <InputField
      id="printGrams"
      label="Filament used for this print"
      unit="g"
      placeholder="e.g. 150"
      :min="0"
      step="0.1"
      v-model="printGrams"
    />

    <!-- Print duration -->
    <hr class="divider" />
    <p class="section-title">Print Duration</p>

    <label>Hours &amp; minutes</label>
    <div class="duration-row">
      <InputField id="printHours" unit="hrs" placeholder="e.g. 4"  :min="0"      step="1"  v-model="printHours" />
      <InputField id="printMins"  unit="min" placeholder="e.g. 30" :min="0" :max="59" step="1" v-model="printMins" />
    </div>

    <!-- Labour time -->
    <hr class="divider" />
    <p class="section-title">Labour</p>

    <InputField
      id="labourMins"
      label="Your hands-on time"
      unit="min"
      placeholder="e.g. 15"
      :min="0"
      step="1"
      hint="Setup, removing supports, post-processing etc."
      v-model="labourMins"
    />

    <!-- Job description -->
    <hr class="divider" />
    <p class="section-title">Job Details</p>

    <InputField
      id="jobDesc"
      label="Job description"
      type="text"
      placeholder="e.g. Custom bracket — 150g PLA"
      v-model="jobDesc"
    />

    <button class="btn-calculate" @click="emit('calculate')">Calculate Total Cost</button>

    <p class="error" v-show="showError">
      Please enter valid positive numbers in all required fields.
    </p>
  </div>
</template>

<style scoped>
.btn-calculate {
  width: 100%;
  padding: 14px;
  background: #e94560;
  border: none;
  border-radius: 8px;
  color: #ffffff;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;
  margin-top: 4px;
}
.btn-calculate:hover  { background: #c73652; }
.btn-calculate:active { transform: scale(0.98); }

.filament-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.filament-select {
  flex: 1;
  padding: 10px 12px;
  background: #0f2040;
  border: 1px solid #1a3a5c;
  border-radius: 8px;
  color: #e0e8f0;
  font-size: 0.95rem;
  cursor: pointer;
  outline: none;
  transition: border-color 0.2s;
}
.filament-select:focus { border-color: #e94560; }

.filament-price {
  white-space: nowrap;
  font-size: 0.85rem;
  font-weight: 600;
  color: #4ecdc4;
  background: #0a1e38;
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid #1a3a5c;
}
.filament-price.no-price {
  color: #e94560;
  font-weight: 400;
  font-size: 0.78rem;
}

.error {
  color: #e94560;
  font-size: 0.82rem;
  margin-top: 10px;
  text-align: center;
}
</style>
