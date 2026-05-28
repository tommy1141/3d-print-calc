<script setup lang="ts">
import { ref } from 'vue'
import InputField from '@/components/InputField.vue'
import { useFilaments, FILAMENT_LABELS, FILAMENT_KEYS } from '@/composables/useFilaments'

const { prices, costPrices, brands, brandCostPrices, addBrand, removeBrand } = useFilaments()

const newBrandName = ref('')
function submitNewBrand() {
  addBrand(newBrandName.value)
  newBrandName.value = ''
}
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
      Cost price by type
      <span class="cost-badge">optional — fallback if no brand price set</span>
    </p>
    <p class="hint" style="margin-bottom: 12px;">
      Per-type cost used when no brand-specific price is set. The invoice still charges the retail price.
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

    <p class="section-title" style="margin-top: 1.5rem;">
      Cost price by brand
      <span class="cost-badge">used first when adding filament to inventory</span>
    </p>
    <p class="hint" style="margin-bottom: 12px;">
      If set, this overrides the per-type cost price when auto-filling the cost in the Inventory tab.
    </p>
    <div class="brands-list">
      <div v-for="brand in brands" :key="brand" class="brand-row">
        <span class="brand-name">{{ brand }}</span>
        <div class="brand-price-wrap">
          <span class="unit-prefix">£</span>
          <input
            class="brand-price-input"
            type="number"
            :min="0"
            step="0.01"
            placeholder="e.g. 15.99"
            :value="brandCostPrices[brand] ?? ''"
            @input="brandCostPrices[brand] = ($event.target as HTMLInputElement).value === '' ? null : Number(($event.target as HTMLInputElement).value)"
          />
          <span class="unit-suffix">/kg</span>
        </div>
        <button class="btn-remove-brand" @click="removeBrand(brand)" title="Remove brand">✕</button>
      </div>
    </div>

    <div class="add-brand-row">
      <input
        class="brand-add-input"
        type="text"
        placeholder="New brand name…"
        v-model="newBrandName"
        @keydown.enter="submitNewBrand"
      />
      <button class="btn-add-brand" :disabled="!newBrandName.trim()" @click="submitNewBrand">+ Add Brand</button>
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

.brands-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 10px;
}

.brand-row {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #0a1628;
  border: 1px solid #1a3a5c;
  border-radius: 8px;
  padding: 8px 12px;
}

.brand-name {
  flex: 1;
  font-size: 0.9rem;
  color: #c0d0e0;
  font-weight: 500;
}

.brand-price-wrap {
  display: flex;
  align-items: center;
  gap: 4px;
}

.unit-prefix, .unit-suffix {
  font-size: 0.8rem;
  color: #5a7a9a;
}

.brand-price-input {
  width: 80px;
  background: #0f2040;
  border: 1px solid #1a3a5c;
  border-radius: 6px;
  color: #e0e8f0;
  font-size: 0.9rem;
  padding: 5px 8px;
  outline: none;
  text-align: right;
  transition: border-color 0.2s;
}
.brand-price-input:focus { border-color: #4a90d9; }

.btn-remove-brand {
  background: transparent;
  border: none;
  color: #e94560;
  cursor: pointer;
  font-size: 0.85rem;
  opacity: 0.5;
  padding: 4px 6px;
  transition: opacity 0.15s;
}
.btn-remove-brand:hover { opacity: 1; }

.add-brand-row {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

.brand-add-input {
  flex: 1;
  background: #0f2040;
  border: 1px solid #1a3a5c;
  border-radius: 8px;
  color: #e0e8f0;
  font-size: 0.9rem;
  padding: 8px 12px;
  outline: none;
  transition: border-color 0.2s;
}
.brand-add-input:focus { border-color: #4a90d9; }
.brand-add-input::placeholder { color: #2a4a6a; }

.btn-add-brand {
  padding: 8px 16px;
  background: #1a4a7a;
  border: none;
  border-radius: 8px;
  color: #e0e8f0;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
  white-space: nowrap;
}
.btn-add-brand:hover { background: #2a6aaa; }
.btn-add-brand:disabled { opacity: 0.4; cursor: not-allowed; }
</style>
