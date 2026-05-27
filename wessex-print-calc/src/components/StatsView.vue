<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { SavedInvoice } from '@/types'

const invoices = ref<SavedInvoice[]>([])
const loading  = ref(true)
const apiError = ref(false)

onMounted(async () => {
  try {
    const res = await fetch('/api/invoices')
    if (!res.ok) throw new Error()
    invoices.value = await res.json()
  } catch {
    apiError.value = true
  } finally {
    loading.value = false
  }
})

const invoiceCount  = computed(() => invoices.value.length)
const totalRevenue  = computed(() => invoices.value.reduce((s, inv) => s + inv.grandTotal, 0))
const totalProfit   = computed(() => invoices.value.reduce((s, inv) => s + inv.items.reduce((a, i) => a + (i.profit ?? 0), 0), 0))
const totalFilament = computed(() => invoices.value.reduce((s, inv) => s + inv.items.reduce((a, i) => a + (i.filamentCost ?? 0), 0), 0))
const totalPower    = computed(() => invoices.value.reduce((s, inv) => s + inv.items.reduce((a, i) => a + (i.powerCost ?? 0), 0), 0))
const totalLabour   = computed(() => invoices.value.reduce((s, inv) => s + inv.items.reduce((a, i) => a + (i.labourCost ?? 0), 0), 0))
const totalCost     = computed(() => totalFilament.value + totalPower.value + totalLabour.value)
const avgMargin     = computed(() => totalRevenue.value > 0 ? (totalProfit.value / totalRevenue.value) * 100 : 0)

const fmt = (n: number) => `£${n.toFixed(2)}`
</script>

<template>
  <div>
    <p class="panel-heading">📈 Stats</p>

    <div v-if="loading" class="status-msg">Loading…</div>

    <div v-else-if="apiError" class="status-msg warn">
      Could not connect to the API. Stats are only available when running via Docker.
    </div>

    <template v-else>
      <!-- Top-line summary cards -->
      <div class="stats-grid">
        <div class="stat-card revenue">
          <span class="stat-icon">💰</span>
          <span class="stat-label">Total Revenue</span>
          <span class="stat-value">{{ fmt(totalRevenue) }}</span>
        </div>
        <div class="stat-card profit">
          <span class="stat-icon">📈</span>
          <span class="stat-label">Total Profit</span>
          <span class="stat-value">{{ fmt(totalProfit) }}</span>
          <span class="stat-sub">{{ avgMargin.toFixed(1) }}% avg margin</span>
        </div>
        <div class="stat-card cost">
          <span class="stat-icon">🧾</span>
          <span class="stat-label">Total Cost</span>
          <span class="stat-value">{{ fmt(totalCost) }}</span>
        </div>
        <div class="stat-card invoices">
          <span class="stat-icon">📋</span>
          <span class="stat-label">Invoices Raised</span>
          <span class="stat-value">{{ invoiceCount }}</span>
        </div>
      </div>

      <!-- Cost breakdown -->
      <p class="section-title" style="margin-top: 1.5rem;">Cost Breakdown</p>
      <div class="breakdown-list">
        <div class="breakdown-row">
          <span>🧵 Filament</span>
          <span>{{ fmt(totalFilament) }}</span>
        </div>
        <div class="breakdown-row">
          <span>⚡ Power</span>
          <span>{{ fmt(totalPower) }}</span>
        </div>
        <div class="breakdown-row">
          <span>👷 Labour</span>
          <span>{{ fmt(totalLabour) }}</span>
        </div>
      </div>

      <p v-if="invoiceCount > 0 && totalCost === 0" class="status-msg" style="margin-top:1rem;">
        Existing invoices don't include cost breakdowns — new invoices will show full data here.
      </p>
    </template>
  </div>
</template>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 1rem;
  margin-top: 0.5rem;
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 1.25rem 1rem;
  border-radius: 10px;
  text-align: center;
  background: var(--color-background-soft, #f8f8f8);
  border: 1px solid var(--color-border, #e0e0e0);
}

.stat-icon  { font-size: 1.6rem; }
.stat-label { font-size: 0.78rem; color: var(--color-text-muted, #888); font-weight: 500; }
.stat-value { font-size: 1.5rem; font-weight: 700; color: var(--color-heading, #222); }
.stat-sub   { font-size: 0.75rem; color: var(--color-text-muted, #888); }

.stat-card.revenue { border-color: #4caf50; }
.stat-card.profit  { border-color: #2196f3; }
.stat-card.cost    { border-color: #ff9800; }
.stat-card.invoices{ border-color: #9c27b0; }

.breakdown-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.breakdown-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.6rem 0.75rem;
  border-radius: 6px;
  background: var(--color-background-soft, #f8f8f8);
  font-size: 0.95rem;
}

.breakdown-row span:last-child {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.status-msg {
  color: var(--color-text-muted, #888);
  font-size: 0.9rem;
  padding: 1rem 0;
}

.status-msg.warn { color: #c0392b; }
</style>
