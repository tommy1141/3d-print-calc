<script setup lang="ts">
import { computed, ref } from 'vue'
import type { InvItem } from '@/types'
import { useCompany } from '@/composables/useCompany'
import { useInvoice } from '@/composables/useInvoice'

const props = defineProps<{
  items: InvItem[]
  business: string
  customer: string
  invoiceNo: string
  date: string
}>()

const emit = defineEmits<{
  back: []
}>()

const company = useCompany()
const { generateInvoice } = useInvoice()

const grandTotal = computed(() =>
  props.items.reduce((s, i) => s + i.sellingPrice, 0)
)

const hasBankDetails = computed(() => !!(company.bankName.value || company.accountNumber.value))
const showPaymentDetails = ref(true)

function printPdf() {
  generateInvoice(props.items, props.business, props.customer, props.invoiceNo, props.date, showPaymentDetails.value)
}
</script>

<template>
  <div class="invoice-stage">
    <!-- Invoice card -->
    <div class="invoice-card">
      <div class="inv-header">
        <div>
          <div class="biz-name">{{ business || 'My 3D Print Shop' }}</div>
          <div class="biz-sub">3D Printing Services</div>
        </div>
        <div class="inv-meta">
          <div class="inv-title">INVOICE</div>
          <div class="inv-no">{{ invoiceNo }}</div>
          <div class="inv-date">{{ date }}</div>
        </div>
      </div>

      <div class="parties">
        <div class="party">
          <div class="party-label">From</div>
          <div class="party-name">{{ business || 'My 3D Print Shop' }}</div>
          <div v-if="company.address" class="party-detail" style="white-space:pre-line">{{ company.address }}</div>
          <div v-if="company.email" class="party-detail">{{ company.email }}</div>
          <div v-if="company.phone" class="party-detail">{{ company.phone }}</div>
        </div>
        <div class="party">
          <div class="party-label">Bill To</div>
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
          <td class="lbl">Total Due</td>
          <td class="val">£{{ grandTotal.toFixed(2) }}</td>
        </tr>
      </table>

      <div v-if="hasBankDetails && showPaymentDetails" class="bank-section">
        <div class="bank-label">Payment Details</div>
        <div class="bank-row">
          <span v-if="company.bankName"><strong>Bank:</strong> {{ company.bankName }}</span>
          <span v-if="company.accountName"><strong>Account name:</strong> {{ company.accountName }}</span>
          <span v-if="company.sortCode"><strong>Sort code:</strong> {{ company.sortCode }}</span>
          <span v-if="company.accountNumber"><strong>Account no:</strong> {{ company.accountNumber }}</span>
        </div>
      </div>

      <div class="inv-footer">Thank you for your order!</div>
    </div>

    <!-- Actions -->
    <div class="actions">
      <button class="btn-back" @click="emit('back')">← Back to Calculator</button>
      <label v-if="hasBankDetails" class="payment-toggle">
        <input type="checkbox" v-model="showPaymentDetails" />
        Include payment details
      </label>
      <button class="btn-pdf" @click="printPdf()">🖨️ Save as PDF</button>
    </div>
  </div>
</template>

<style scoped>
.invoice-stage {
  max-width: 760px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.thank-you {
  text-align: center;
  padding: 32px 24px 24px;
  background: #16213e;
  border-radius: 14px;
  border: 1px solid #1a4a7a;
}

.thank-you-icon {
  font-size: 2.8rem;
  display: block;
  margin-bottom: 12px;
}

.thank-you h1 {
  font-size: 1.8rem;
  font-weight: 700;
  color: #4caf50;
  margin-bottom: 8px;
}

.thank-you p {
  color: #a0a0b0;
  font-size: 0.95rem;
}

/* Invoice card – light theme so it prints cleanly */
.invoice-card {
  background: #fff;
  border-radius: 12px;
  padding: 40px;
  color: #1a1a2e;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.35);
}

.inv-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
}

.biz-name {
  font-size: 22px;
  font-weight: 700;
  color: #e94560;
}

.biz-sub {
  color: #666;
  font-size: 12px;
  margin-top: 2px;
}

.inv-meta {
  text-align: right;
}

.inv-title {
  font-size: 20px;
  font-weight: 700;
  color: #1a1a2e;
}

.inv-no,
.inv-date {
  color: #666;
  font-size: 12px;
  margin-top: 2px;
}

.parties {
  display: flex;
  gap: 40px;
  margin-bottom: 28px;
}

.party-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #999;
  margin-bottom: 4px;
}

.party-name {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a2e;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
}

.items-table thead tr {
  background: #1a1a2e;
  color: #fff;
}

.items-table thead th {
  padding: 10px 14px;
  text-align: left;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.items-table tbody tr:nth-child(even) {
  background: #f5f7fb;
}

.items-table tbody td {
  padding: 10px 14px;
  border-bottom: 1px solid #e8ecf2;
  font-size: 14px;
  color: #1a1a2e;
}

.amount {
  text-align: right;
}

.totals-table {
  margin-left: auto;
  width: 240px;
  border-collapse: collapse;
}

.grand-row td {
  padding: 8px 4px;
  font-size: 17px;
  font-weight: 700;
  color: #e94560;
  border-top: 2px solid #e94560;
}

.lbl {
  color: #555;
  font-weight: 600;
}

.val {
  text-align: right;
}

.party-detail {
  font-size: 12px;
  color: #666;
  margin-top: 2px;
  line-height: 1.5;
}

.bank-section {
  margin-top: 24px;
  padding: 12px 14px;
  background: #f8f8fb;
  border-radius: 6px;
  border: 1px solid #e0e4f0;
}

.bank-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #999;
  font-weight: 600;
  margin-bottom: 6px;
}

.bank-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 24px;
  font-size: 12px;
  color: #333;
}

.inv-footer {
  margin-top: 36px;
  border-top: 1px solid #eee;
  padding-top: 14px;
  color: #aaa;
  font-size: 11px;
  text-align: center;
}

/* Actions bar */
.actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  align-items: center;
}

.payment-toggle {
  display: flex;
  align-items: center;
  gap: 7px;
  color: #a0a0b0;
  font-size: 0.88rem;
  cursor: pointer;
  user-select: none;
}

.btn-back,
.btn-pdf {
  padding: 12px 28px;
  border-radius: 8px;
  border: none;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
}

.btn-back {
  background: #1a4a7a;
  color: #e0e0f0;
}

.btn-pdf {
  background: #e94560;
  color: #fff;
}

.btn-back:hover,
.btn-pdf:hover {
  opacity: 0.85;
}
</style>
