<script setup lang="ts">
import type { InvItem } from '@/types'

defineProps<{
  items: InvItem[]
  total: string
}>()

const emit = defineEmits<{
  remove:  [index: number]
  clear:   []
  invoice: []
}>()
</script>

<template>
  <div class="order-list">
    <p class="order-list-title">&#x1F4CB; Order Items</p>
    <div>
      <div class="order-row" v-for="(item, i) in items" :key="i">
        <span class="order-name" :title="item.job">{{ item.job }}</span>
        <span class="order-price">£{{ item.sellingPrice.toFixed(2) }}</span>
        <button class="btn-remove" @click="emit('remove', i)" title="Remove">&times;</button>
      </div>
    </div>
    <div class="order-total">
      <span class="order-total-label">Order Total</span>
      <span class="order-total-value">{{ total }}</span>
    </div>
    <button class="btn-invoice" @click="emit('invoice')">&#x1F4C4; Generate Invoice PDF</button>
    <button class="btn-clear" @click="emit('clear')">&#x2715; Clear All Items</button>
  </div>
</template>

<style scoped>
.order-list {
  background: #0a1e38;
  border-radius: 10px;
  padding: 16px;
}

.order-list-title {
  color: #a0a0b0;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 12px;
}

.order-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #1a4a7a;
}

.order-name {
  color: #c0c0d0;
  font-size: 0.85rem;
  flex: 1;
  margin-right: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.order-price {
  color: #4caf50;
  font-size: 0.9rem;
  font-weight: 600;
  margin-right: 10px;
  white-space: nowrap;
}

.btn-remove {
  background: none;
  border: none;
  color: #e94560;
  cursor: pointer;
  font-size: 1rem;
  padding: 0 4px;
  width: auto;
  margin-top: 0;
  line-height: 1;
  font-weight: normal;
}
.btn-remove:hover { background: none; color: #ff6b6b; transform: none; }

.order-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 2px solid #e94560;
}

.order-total-label { color: #e94560; font-weight: 700; font-size: 0.9rem; }
.order-total-value { color: #e94560; font-weight: 700; font-size: 1.1rem; }

.btn-invoice {
  width: 100%;
  padding: 13px;
  background: transparent;
  border: 2px solid #4caf50;
  border-radius: 8px;
  color: #4caf50;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
  margin-top: 14px;
}
.btn-invoice:hover { background: #4caf50; color: #fff; }

.btn-clear {
  width: 100%;
  padding: 8px;
  background: transparent;
  border: 1px solid #555;
  border-radius: 6px;
  color: #888;
  font-size: 0.8rem;
  cursor: pointer;
  margin-top: 8px;
  transition: border-color 0.2s, color 0.2s;
}
.btn-clear:hover { border-color: #e94560; color: #e94560; background: transparent; transform: none; }
</style>
