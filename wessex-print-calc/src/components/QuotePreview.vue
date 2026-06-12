<script setup lang="ts">
import { computed } from 'vue'
import type { InvItem } from '@/types'
import { useCompany } from '@/composables/useCompany'

const props = defineProps<{
  items: InvItem[]
  business: string
  customer: string
  quoteNo: string
  date: string
}>()

const emit = defineEmits<{
  back: []
  print: []
}>()

const company = useCompany()
const grandTotal = computed(() => props.items.reduce((s, i) => s + i.sellingPrice, 0))
</script>

<template>
  <div class="quote-stage">
    <div class="quote-card">
      <div class="inv-header">
        <div>
          <div class="biz-name">{{ business || 'My 3D Print Shop' }}</div>
          <div class="biz-sub">3D Printing Services</div>
        </div>
        <div class="inv-meta">
          <div class="inv-title">QUOTE</div>
          <div class="inv-no">{{ quoteNo }}</div>
          <div class="inv-date">{{ date }}</div>
        </div>
      </div>

      <div class="parties">
        <div class="party">
          <div class="party-label">From</div>
          <div class="party-name">{{ business || 'My 3D Print Shop' }}</div>
          <div v-if="company.address.value" class="party-detail" style="white-space:pre-line">{{ company.address.value }}</div>
          <div v-if="company.email.value" class="party-detail">{{ company.email.value }}</div>
          <div v-if="company.phone.value" class="party-detail">{{ company.phone.value }}</div>
        </div>
        <div class="party">
          <div class="party-label">Quoted For</div>
          <div class="party-name">{{ customer || 'Customer' }}</div>
        </div>
      </div>

      <table class="items-table">
        <thead>
          <tr>
            <th>Description</th>
            <th class="amount">£ Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, i) in items" :key="i">
            <td>{{ item.job }}</td>
            <td class="amount">£{{ item.sellingPrice.toFixed(2) }}</td>
          </tr>
        </tbody>
      </table>

      <table class="totals-table">
        <tr class="grand-row">
          <td class="lbl">Quote Total</td>
          <td class="val">£{{ grandTotal.toFixed(2) }}</td>
        </tr>
      </table>

      <div class="inv-footer">This is a quote only — no payment is due until the work is confirmed.</div>
    </div>

    <div class="actions">
      <button class="btn-back" @click="emit('back')">← Back</button>
      <button class="btn-pdf" @click="emit('print')">🖨️ Save as PDF</button>
    </div>
  </div>
</template>

<style scoped>
.quote-stage {
  max-width: 760px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.quote-card {
  background: #fff;
  border-radius: 12px;
  padding: 40px;
  color: #1a1a2e;
  box-shadow: 0 4px 24px rgba(0,0,0,0.35);
}

.inv-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
.biz-name   { font-size: 22px; font-weight: 700; color: #4a90d9; }
.biz-sub    { color: #666; font-size: 12px; margin-top: 2px; }
.inv-meta   { text-align: right; }
.inv-title  { font-size: 20px; font-weight: 700; color: #4a90d9; }
.inv-no,
.inv-date   { color: #666; font-size: 12px; margin-top: 2px; }

.parties     { display: flex; gap: 40px; margin-bottom: 28px; }
.party-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #999; margin-bottom: 4px; }
.party-name  { font-size: 14px; font-weight: 600; color: #1a1a2e; }
.party-detail{ font-size: 12px; color: #666; margin-top: 2px; line-height: 1.5; }

.items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
.items-table thead tr { background: #1a2a4a; color: #fff; }
.items-table thead th { padding: 10px 14px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; }
.items-table tbody tr:nth-child(even) { background: #f5f7fb; }
.items-table tbody td { padding: 10px 14px; border-bottom: 1px solid #e8ecf2; font-size: 14px; color: #1a1a2e; }
.amount { text-align: right; }

.totals-table { margin-left: auto; width: 240px; border-collapse: collapse; }
.grand-row td { padding: 8px 4px; font-size: 17px; font-weight: 700; color: #4a90d9; border-top: 2px solid #4a90d9; }
.lbl { color: #555; font-weight: 600; }
.val { text-align: right; }

.inv-footer { margin-top: 36px; border-top: 1px solid #eee; padding-top: 14px; color: #aaa; font-size: 11px; text-align: center; }

.actions { display: flex; gap: 16px; justify-content: center; align-items: center; }
.btn-back,
.btn-pdf  { padding: 12px 28px; border-radius: 8px; border: none; font-size: 0.95rem; font-weight: 600; cursor: pointer; transition: opacity 0.15s; }
.btn-back { background: #1a4a7a; color: #e0e0f0; }
.btn-pdf  { background: #4a90d9; color: #fff; }
.btn-back:hover, .btn-pdf:hover { opacity: 0.85; }
</style>
