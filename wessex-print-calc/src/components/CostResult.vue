<script setup lang="ts">
import { ref, watch } from 'vue'
import type { CalcResult } from '@/types'

const props = defineProps<{
  result: CalcResult
  margin: number
}>()

const emit = defineEmits<{ addToOrder: [qty: number] }>()

const qty = ref(1)
watch(() => props.result, () => { qty.value = 1 })

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
      <span class="row-label">Markup profit</span>
      <span class="row-value">{{ fmt(result.profit) }} ({{ margin }}%)</span>
    </div>
    <div class="result-row result-takehome">
      <span class="row-label">Take-home (incl. your labour)</span>
      <span class="row-value">{{ fmt(result.profit + result.labourCost) }}</span>
    </div>
    <div v-if="result.actualProfit !== undefined" class="result-row result-actual-profit">
      <span class="row-label">✨ Take-home at your cost price</span>
      <span class="row-value">{{ fmt(result.actualProfit + result.labourCost) }}</span>
    </div>
    <p class="breakdown">{{ result.breakdown }}</p>
    <div class="qty-row">
      <span class="qty-label">Quantity</span>
      <div class="qty-controls">
        <button class="qty-btn" @click="qty = Math.max(1, qty - 1)">−</button>
        <input
          id="qty"
          type="number"
          class="qty-input"
          :min="1"
          :step="1"
          v-model.number="qty"
          @input="qty = Math.max(1, Math.round(qty || 1))"
        />
        <button class="qty-btn" @click="qty++">+</button>
      </div>
    </div>
    <button class="btn-add" @click="emit('addToOrder', qty)">
      &#x2795; Add{{ qty > 1 ? ` ${qty}×` : '' }} to Order
      <span v-if="qty > 1" class="btn-total">&nbsp;({{ fmt(result.sellingPrice * qty) }})</span>
    </button>
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

.result-takehome { margin-top: 2px; }
.result-takehome .row-label { color: #4caf50; font-weight: 600; font-size: 0.88rem; }
.result-takehome .row-value { color: #4caf50; font-size: 1.1rem; font-weight: 700; }

.result-actual-profit { margin-top: 4px; }
.result-actual-profit .row-label { color: #ffd700; font-size: 0.85rem; }
.result-actual-profit .row-value { color: #ffd700; font-size: 1.05rem; font-weight: 700; }

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

.qty-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 14px;
}

.qty-label {
  color: #a0a0b0;
  font-size: 0.85rem;
}

.qty-controls {
  display: flex;
  align-items: center;
  gap: 6px;
}

.qty-btn {
  width: 32px;
  height: 32px;
  background: #1a3a5c;
  border: 1px solid #2a5080;
  border-radius: 6px;
  color: #e0e8f0;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
  padding: 0;
  line-height: 1;
}
.qty-btn:hover { background: #2a5a8c; }

.qty-input {
  width: 52px;
  text-align: center;
  background: #0f2040;
  border: 1px solid #1a3a5c;
  border-radius: 6px;
  color: #e0e8f0;
  font-size: 0.95rem;
  font-weight: 600;
  padding: 5px 4px;
  outline: none;
}
.qty-input:focus { border-color: #4a90d9; }
.qty-input::-webkit-inner-spin-button,
.qty-input::-webkit-outer-spin-button { opacity: 0.5; }

.btn-total {
  font-size: 0.85rem;
  font-weight: 500;
  opacity: 0.85;
}
</style>
