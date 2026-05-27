<script setup lang="ts">
import type { CalcResult } from '@/types'

defineProps<{
  result: CalcResult
  margin: number
}>()

const emit = defineEmits<{ addToOrder: [] }>()

const fmt = (n: number) => '£' + n.toFixed(2)
</script>

<template>
  <div class="result">
    <div class="result-row">
      <span class="row-label">Filament cost</span>
      <span class="row-value">{{ fmt(result.filamentCost) }}</span>
    </div>
    <div class="result-row">
      <span class="row-label">Power cost</span>
      <span class="row-value">{{ fmt(result.powerCost) }}</span>
    </div>
    <div class="result-row">
      <span class="row-label">Labour cost</span>
      <span class="row-value">{{ fmt(result.labourCost) }}</span>
    </div>
    <div class="result-row result-total">
      <span class="row-label">Total cost</span>
      <span class="row-value">{{ fmt(result.total) }}</span>
    </div>
    <div class="result-row result-selling">
      <span class="row-label">&#x2714; Sell for</span>
      <span class="row-value">{{ fmt(result.sellingPrice) }}</span>
    </div>
    <div class="result-row result-profit">
      <span class="row-label">Your profit</span>
      <span class="row-value">{{ fmt(result.profit) }} ({{ margin }}%)</span>
    </div>
    <p class="breakdown">{{ result.breakdown }}</p>
    <button class="btn-add" @click="emit('addToOrder')">&#x2795; Add to Order</button>
  </div>
</template>

<style scoped>
.result {
  background: #0f2040;
  border-radius: 10px;
  padding: 20px;
}

.result-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.row-label { color: #a0a0b0; font-size: 0.85rem; }
.row-value { color: #ffffff; font-size: 0.95rem; font-weight: 600; }

.result-total {
  border-top: 1px solid #1a4a7a;
  margin-top: 12px;
  padding-top: 12px;
}
.result-total .row-label { color: #e94560; font-weight: 700; }
.result-total .row-value { color: #e94560; font-size: 1.3rem; }

.result-selling {
  border-top: 2px solid #e94560;
  margin-top: 12px;
  padding-top: 12px;
}
.result-selling .row-label { color: #4caf50; font-weight: 700; }
.result-selling .row-value { color: #4caf50; font-size: 1.5rem; font-weight: 700; }

.result-profit { margin-top: 6px; }
.result-profit .row-label { color: #a0a0b0; font-size: 0.85rem; }
.result-profit .row-value { color: #a0c8a0; font-size: 0.95rem; font-weight: 600; }

.breakdown {
  color: #808090;
  font-size: 0.8rem;
  margin-top: 8px;
  text-align: center;
}

.btn-add {
  width: 100%;
  padding: 13px;
  background: transparent;
  border: 2px solid #4a90d9;
  border-radius: 8px;
  color: #4a90d9;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
  margin-top: 10px;
}
.btn-add:hover { background: #4a90d9; color: #fff; }
</style>
