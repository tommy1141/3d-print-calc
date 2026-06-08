<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useInvoiceStore } from '@/composables/useInvoiceStore'
import { useInventory } from '@/composables/useInventory'

const { invoices, loading, apiError, fetchInvoices } = useInvoiceStore()
const { spools } = useInventory()

onMounted(() => fetchInvoices(true))

const invoiceCount    = computed(() => invoices.value.length)
const invoicesPaid    = computed(() => invoices.value.filter(i => i.paid === true).length)
const totalRevenue  = computed(() => invoices.value.reduce((s, inv) => s + inv.grandTotal, 0))
const totalMarkupProfit = computed(() => invoices.value.reduce((s, inv) => s + inv.items.reduce((a, i) => a + (i.profit ?? 0), 0), 0))
const totalFilament = computed(() => invoices.value.reduce((s, inv) => s + inv.items.reduce((a, i) => a + (i.filamentCost ?? 0), 0), 0))
const totalPower    = computed(() => invoices.value.reduce((s, inv) => s + inv.items.reduce((a, i) => a + (i.powerCost ?? 0), 0), 0))
const totalLabour   = computed(() => invoices.value.reduce((s, inv) => s + inv.items.reduce((a, i) => a + (i.labourCost ?? 0), 0), 0))
// Labour is your own time = income, not an out-of-pocket cost
// Filament purchased is a real out-of-pocket expense, deducted from take-home
const totalTakeHome = computed(() => totalMarkupProfit.value + totalLabour.value - totalStockInvested.value)
const totalCost     = computed(() => totalFilament.value + totalPower.value)
const avgMargin     = computed(() => totalRevenue.value > 0 ? (totalTakeHome.value / totalRevenue.value) * 100 : 0)
// Total money spent purchasing filament spools (from inventory)
const totalStockInvested = computed(() => spools.value.reduce((s, sp) => s + (sp.pricePaid ?? 0), 0))

const fmt = (n: number) => n < 0 ? `-£${Math.abs(n).toFixed(2)}` : `£${n.toFixed(2)}`
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
        <div class="stat-card profit" :class="{ negative: totalTakeHome < 0 }">
          <span class="stat-icon">📈</span>
          <span class="stat-label">Take-Home</span>
          <span class="stat-value">{{ fmt(totalTakeHome) }}</span>
          <span class="stat-sub">{{ avgMargin.toFixed(1) }}% of revenue</span>
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
        <div class="stat-card paid" :class="{ 'all-paid': invoicesPaid === invoiceCount && invoiceCount > 0 }">
          <span class="stat-icon">✅</span>
          <span class="stat-label">Invoices Paid</span>
          <span class="stat-value">{{ invoicesPaid }}</span>
          <span class="stat-sub">{{ invoiceCount - invoicesPaid }} unpaid</span>
        </div>
      </div>

      <!-- Cost breakdown -->
      <p class="section-title" style="margin-top: 1.5rem;">Breakdown</p>
      <div class="breakdown-list">
        <div class="breakdown-row">
          <span>🧵 Filament</span>
          <span>{{ fmt(totalFilament) }}</span>
        </div>
        <div class="breakdown-row">
          <span>⚡ Power</span>
          <span>{{ fmt(totalPower) }}</span>
        </div>
        <div class="breakdown-row take-home-row">
          <span>👷 Your Labour Pay</span>
          <span>{{ fmt(totalLabour) }}</span>
        </div>
        <div class="breakdown-row take-home-row">
          <span>📈 Markup Profit</span>
          <span>{{ fmt(totalMarkupProfit) }}</span>
        </div>
        <div v-if="totalStockInvested > 0" class="breakdown-row stock-row">
          <span>📦 Filament Purchased</span>
          <span>{{ fmt(totalStockInvested) }}</span>
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
.stat-card.profit.negative { border-color: #e94560; }
.stat-card.profit.negative .stat-value { color: #e94560; }
.stat-card.cost    { border-color: #ff9800; }
.stat-card.invoices { border-color: #9c27b0; }
.stat-card.paid     { border-color: #607d8b; }
.stat-card.paid.all-paid { border-color: #4caf50; }

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
  background: #0d2137;
  border: 1px solid #1a3a5c;
  font-size: 0.95rem;
  color: #c8d8e8;
}

.breakdown-row span:last-child {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: #e0e8f0;
}

.take-home-row {
  background: #0d2137;
  border: 1px solid #1a4a7a;
}

.take-home-row span:last-child {
  color: #4fc3f7;
}

.stock-row {
  background: #0d2137;
  border: 1px solid #5a3a1a;
}

.stock-row span:last-child {
  color: #ffb74d;
}

.status-msg {
  color: var(--color-text-muted, #888);
  font-size: 0.9rem;
  padding: 1rem 0;
}

.status-msg.warn { color: #c0392b; }
</style>
