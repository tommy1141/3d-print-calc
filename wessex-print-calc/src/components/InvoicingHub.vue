<script setup lang="ts">
import type { NavView } from '@/types'

const emit = defineEmits<{ navigate: [view: NavView] }>()
</script>

<template>
  <div class="hub-root">
    <h2 class="hub-title">🧾 Invoicing</h2>
    <p class="hub-sub">What would you like to do?</p>

    <div class="hub-grid">
      <button class="hub-card hub-card--quote" @click="emit('navigate', 'calculator')">
        <span class="hub-card-icon">📝</span>
        <span class="hub-card-label">Create a Quote</span>
        <span class="hub-card-desc">Build a quote for a customer without committing stock</span>
      </button>

      <button class="hub-card hub-card--quotes" @click="emit('navigate', 'quotes')">
        <span class="hub-card-icon">📂</span>
        <span class="hub-card-label">View Quotes</span>
        <span class="hub-card-desc">Review, send, accept or convert existing quotes</span>
      </button>

      <button class="hub-card hub-card--invoice" @click="emit('navigate', 'calculator')">
        <span class="hub-card-icon">🧾</span>
        <span class="hub-card-label">Create an Invoice</span>
        <span class="hub-card-desc">Generate a new invoice and deduct stock</span>
      </button>

      <button class="hub-card hub-card--invoices" @click="emit('navigate', 'invoices')">
        <span class="hub-card-icon">📊</span>
        <span class="hub-card-label">View Invoices</span>
        <span class="hub-card-desc">Browse history, mark as paid, or reprint</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.hub-root {
  padding: 32px 24px;
  max-width: 720px;
  margin: 0 auto;
}

.hub-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #c0c8d8;
  margin: 0 0 6px;
}

.hub-sub {
  color: #7090b0;
  font-size: 0.92rem;
  margin: 0 0 28px;
}

.hub-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.hub-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  padding: 22px 20px;
  background: #0f2040;
  border: 1px solid #1a3a5c;
  border-radius: 12px;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s, border-color 0.15s, transform 0.1s;
}

.hub-card:hover {
  background: #142850;
  transform: translateY(-2px);
}

.hub-card--quote:hover  { border-color: #4a90d9; }
.hub-card--quotes:hover { border-color: #7c5cbf; }
.hub-card--invoice:hover  { border-color: #e94560; }
.hub-card--invoices:hover { border-color: #4caf50; }

.hub-card-icon {
  font-size: 1.8rem;
  line-height: 1;
}

.hub-card-label {
  font-size: 1rem;
  font-weight: 700;
  color: #c0c8d8;
}

.hub-card-desc {
  font-size: 0.82rem;
  color: #7090b0;
  line-height: 1.4;
}

@media (max-width: 540px) {
  .hub-grid { grid-template-columns: 1fr; }
}
</style>
