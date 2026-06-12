<script setup lang="ts">
import { onMounted } from 'vue'
import { useQuoteStore } from '@/composables/useQuoteStore'
import { useInvoiceStore } from '@/composables/useInvoiceStore'
import { useInvoice } from '@/composables/useInvoice'
import type { SavedQuote, QuoteStatus } from '@/types'

const emit = defineEmits<{ reprint: [quote: SavedQuote] }>()

const { quotes, loading, apiError, fetchQuotes, setStatus, deleteQuote, convertToInvoice } = useQuoteStore()
const { addInvoice } = useInvoiceStore()
const { generateQuote } = useInvoice()

onMounted(() => fetchQuotes())

function reprint(q: SavedQuote) {
  generateQuote(q.items, q.business, q.customer, q.quoteNo, q.date)
}

async function handleConvert(q: SavedQuote) {
  if (!confirm(`Convert ${q.quoteNo} to an invoice? This will deduct stock.`)) return
  const result = await convertToInvoice(q)
  if (result) {
    // Add to invoice store so Invoices tab shows it immediately
    addInvoice({
      invoiceNo: result.invoiceNo,
      date:      result.date,
      business:  q.business,
      customer:  q.customer,
      items:     q.items,
      grandTotal: q.grandTotal,
      savedAt:   new Date().toISOString(),
      paid:      false,
    })
    alert(`Converted to ${result.invoiceNo}`)
  }
}

async function handleDelete(q: SavedQuote) {
  if (!confirm(`Delete ${q.quoteNo}? This cannot be undone.`)) return
  await deleteQuote(q.quoteNo)
}

const STATUS_CYCLE: QuoteStatus[] = ['pending', 'sent', 'accepted', 'declined']
const STATUS_LABELS: Record<QuoteStatus, string> = {
  pending:  '⏳ Pending',
  sent:     '📤 Sent',
  accepted: '✅ Accepted',
  declined: '❌ Declined',
}

function nextStatus(q: SavedQuote) {
  const idx = STATUS_CYCLE.indexOf(q.status)
  return STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length]
}
</script>

<template>
  <div class="history">
    <p class="panel-heading">📝 Quote History</p>

    <div v-if="loading" class="status-msg">Loading…</div>

    <div v-else-if="apiError" class="status-msg warn">
      Could not connect to the API. Quote history is only available when running via Docker.
    </div>

    <div v-else-if="quotes.length === 0" class="status-msg">
      No quotes saved yet.
    </div>

    <div v-else class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Quote #</th>
            <th>Date</th>
            <th>Customer</th>
            <th class="amount">Total</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="q in quotes" :key="q.quoteNo" :class="{ 'row-declined': q.status === 'declined', 'row-accepted': q.status === 'accepted' }">
            <td class="quo-no">{{ q.quoteNo }}</td>
            <td>{{ q.date }}</td>
            <td>{{ q.customer }}</td>
            <td class="amount">£{{ Number(q.grandTotal).toFixed(2) }}</td>
            <td>
              <button class="btn-status" :class="`status-${q.status}`" @click="setStatus(q, nextStatus(q))">
                {{ STATUS_LABELS[q.status] }}
              </button>
            </td>
            <td class="actions-cell">
              <button class="btn-reprint" @click="reprint(q)" title="Reprint quote PDF">🖨️</button>
              <button
                v-if="!q.convertedToInvoice && q.status !== 'declined'"
                class="btn-convert"
                @click="handleConvert(q)"
                title="Convert to Invoice"
              >📄→🧾</button>
              <span v-if="q.convertedToInvoice" class="converted-tag" :title="`Invoice: ${q.convertedToInvoice}`">
                {{ q.convertedToInvoice }}
              </span>
              <button class="btn-delete" @click="handleDelete(q)" title="Delete">🗑️</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.history { width: 100%; }

.status-msg {
  color: #a0a0b0;
  font-size: 0.9rem;
  padding: 24px 0;
  text-align: center;
}
.status-msg.warn { color: #e9a020; }

.table-wrap { overflow-x: auto; }

table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
thead tr { background: #1a1a2e; }
thead th {
  padding: 10px 14px;
  text-align: left;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #a0b0c8;
  white-space: nowrap;
}
tbody tr { border-bottom: 1px solid #1a3a5a; transition: background 0.1s; }
tbody tr:hover { background: #0f2a45; }
tbody tr.row-declined { opacity: 0.5; }
tbody tr.row-accepted td.quo-no { color: #4caf50; }
tbody td { padding: 10px 14px; color: #c8d0e0; }

.quo-no { font-family: monospace; color: #4a90d9; font-weight: 600; }
.amount { text-align: right; font-weight: 600; color: #4caf50; }

.btn-status {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  white-space: nowrap;
  transition: opacity 0.15s;
}
.btn-status:hover { opacity: 0.75; }
.status-pending  { background: #2a2a1a; color: #e9a020; }
.status-sent     { background: #1a2a3a; color: #4a90d9; }
.status-accepted { background: #1a3a1a; color: #4caf50; }
.status-declined { background: #3a1a1a; color: #e94560; }

.actions-cell { display: flex; gap: 6px; align-items: center; }

.btn-reprint, .btn-delete, .btn-convert {
  padding: 5px 8px;
  border-radius: 6px;
  font-size: 0.82rem;
  cursor: pointer;
  border: none;
  transition: background 0.15s;
}
.btn-reprint { background: #1a4a7a; color: #e0e8f0; }
.btn-reprint:hover { background: #2a6aaa; }
.btn-convert { background: #1a3a2a; color: #4caf50; }
.btn-convert:hover { background: #2a5a3a; }
.btn-delete { background: none; border: 1px solid #3a2a3a; color: #e94560; }
.btn-delete:hover { background: #e94560; color: #fff; border-color: #e94560; }

.converted-tag {
  font-size: 0.75rem;
  font-family: monospace;
  color: #4caf50;
  background: #1a3a1a;
  padding: 3px 8px;
  border-radius: 4px;
  white-space: nowrap;
}
</style>
