<script setup lang="ts">
import InputField from '@/components/InputField.vue'
import { useFilaments, FILAMENT_LABELS, FILAMENT_KEYS } from '@/composables/useFilaments'

const { prices } = useFilaments()
</script>

<template>
  <div>
    <p class="hint" style="margin-bottom: 20px;">
      Set the cost per kilogram for each filament type. The calculator will use the price for whichever type you select per job.
    </p>
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
    <p class="setup-note">
      These prices persist across all jobs while the app is open.
    </p>
  </div>
</template>

<style scoped>
.setup-note {
  margin-top: 24px;
  color: #607090;
  font-size: 0.78rem;
  text-align: center;
  line-height: 1.5;
}
</style>
