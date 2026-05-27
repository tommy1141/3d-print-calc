<script setup lang="ts">
import InputField from '@/components/InputField.vue'
import { useFilaments, FILAMENT_LABELS, FILAMENT_KEYS } from '@/composables/useFilaments'

const { prices, costPrices } = useFilaments()
</script>

<template>
  <div>
    <p class="hint" style="margin-bottom: 20px;">
      Set the cost per kilogram for each filament type. The calculator will use the price for whichever type you select per job.
    </p>

    <p class="section-title">Retail / charge price</p>
    <div class="setup-grid">
      <InputField
        v-for="key in FILAMENT_KEYS"
        :key="key"
        :id="key"
        :label="FILAMENT_LABELS[key]"
        unit="£/kg"
        placeholder="e.g. 20.00"
        :min="0"
        step="0.01"
        v-model="prices[key]"
      />
    </div>

    <p class="section-title" style="margin-top: 1.5rem;">
      My cost price
      <span class="cost-badge">optional — leave blank if same as retail</span>
    </p>
    <p class="hint" style="margin-bottom: 12px;">
      If you buy filament cheaper than retail, enter your actual cost here. The invoice still charges the retail price, but the calculator will show your real profit.
    </p>
    <div class="setup-grid">
      <InputField
        v-for="key in FILAMENT_KEYS"
        :key="'cost-' + key"
        :id="'cost-' + key"
        :label="FILAMENT_LABELS[key]"
        unit="£/kg"
        placeholder="e.g. 12.00"
        :min="0"
        step="0.01"
        v-model="costPrices[key]"
      />
    </div>

    <p class="setup-note">
      These prices persist across all jobs while the app is open.
    </p>
  </div>
</template>

<style scoped>
.cost-badge {
  font-size: 0.72rem;
  font-weight: 400;
  color: #888;
  margin-left: 0.5rem;
}
.setup-note {
  margin-top: 24px;
  color: #607090;
  font-size: 0.78rem;
  text-align: center;
  line-height: 1.5;
}
</style>
