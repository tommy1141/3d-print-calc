<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useQuoteStore } from '@/composables/useQuoteStore'
import { useDeliveryNoteStore } from '@/composables/useDeliveryNoteStore'
import { useInvoice } from '@/composables/useInvoice'
import { useInventory } from '@/composables/useInventory'
import type { SavedQuote } from '@/types'
import type { FilamentType } from '@/composables/useFilaments'

const { quotes, loading, apiError, fetchQuotes, setStatus, deleteQuote } = useQuoteStore()
const { addDeliveryNote } = useDeliveryNoteStore()
const { generateQuote, generateDeliveryNote } = useInvoice()
const { deductPartStock, deductFilament } = useInventory()

onMounted(() => fetchQuotes())

const awaitingDecision = ref<string | null>(null)
const poNumberInput    = ref('')
const poDueDateInput   = ref('')

function reprint(q: SavedQuote) {
  generateQuote(q.items, q.business, q.customer, q.quoteNo, q.date)
}

function onStatusClick(q: SavedQuote) {
  if (q.status === 'pending') {
    setStatus(q, 'sent')
  } else if (q.status === 'sent') {
    awaitingDecision.value = q.quoteNo
    poNumberInput.value  = ''
    poDueDateInput.value = ''
  }
}

function cancelDecision() {
  awaitingDecision.value = null
  poNumberInput.value  = ''
  poDueDateInput.value = ''
}

async function handleAccept(q: SavedQuote) {
  const poNumber  = poNumberInput.value.trim() || undefined
  const poDueDate = poDueDateInput.value || undefined
  cancelDecision()
  await setStatus(q, 'accepted', { poNumber, poDueDate })
}

async function handleDecline(q: SavedQuote) {
  cancelDecision()
  await setStatus(q, 'declined')
}

async function handleDelete(q: SavedQuote) {
  if (!confirm(`Delete ${q.quoteNo}? This cannot be undone.`)) return
  await deleteQuote(q.quoteNo)
}

async function handleGenerateDeliveryNote(q: SavedQuote) {
  if (!confirm(`Generate delivery note for ${q.quoteNo}? This will deduct stock.`)) return

  // Deduct stock for each line item
  for (const item of q.items) {
    if (item.partId && item.qty) deductPartStock(item.partId, item.qty)
    if (item.filamentType && item.printGrams) deductFilament(item.filamentType as FilamentType, item.printGrams)
  }

  const res = await fetch('/api/delivery-notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      quoteNo:    q.quoteNo,
      business:   q.business,
      customer:   q.customer,
      items:      q.items,
      grandTotal: q.grandTotal,
      poNumber:   q.poNumber,
      poDueDate:  q.poDueDate,
    }),
  })
  const data = await res.json()

  // Update local quote to show DN tag (server already updated quotes.json atomically)
  const idx = quotes.value.findIndex(x => x.quoteNo === q.quoteNo)
  if (idx !== -1) {
    quotes.value.splice(idx, 1, { ...quotes.value[idx], convertedToDelivery: data.deliveryNo })
  }

  addDeliveryNote({
    deliveryNo:  data.deliveryNo,
    quoteNo:     q.quoteNo,
    date:        data.date,
    business:    q.business,
    customer:    q.customer,
    items:       q.items,
    grandTotal:  q.grandTotal,
    savedAt:     new Date().toISOString(),
    poNumber:    q.poNumber,
    poDueDate:   q.poDueDate,
  })

  generateDeliveryNote(q.items, q.business, q.customer, data.deliveryNo, data.date, q.quoteNo, q.poNumber, q.poDueDate)
}

const STATUS_LABELS: Record<string, string> = {
  pending:  '⏳ Pending',
  sent:     '📤 Sent',
  accepted: '✅ Accepted',
  declined: '❌ Declined',
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
              <!-- Pending / Sent: clickable button -->
              <template v-if="q.status === 'pending' || q.status === 'sent'">
                <template v-if="awaitingDecision === q.quoteNo">
                  <div class="decision-btns">
                    <input type="text" v-model="poNumberInput" placeholder="PO # (optional)" class="po-input" />
                    <input type="date" v-model="poDueDateInput" class="po-input po-date" title="PO due date (optional)" />
                    <button class="btn-accept" @click="handleAccept(q)">✅ Accept</button>
                    <button class="btn-decline" @click="handleDecline(q)">❌ Decline</button>
                    <button class="btn-cancel-decision" @click="cancelDecision">✕</button>
                  </div>
                </template>
                <template v-else>
                  <button class="btn-status" :class="`status-${q.status}`" @click="onStatusClick(q)">
                    {{ STATUS_LABELS[q.status] }}
                  </button>
                </template>
              </template>
              <!-- Accepted / Declined: static label -->
              <template v-else>
                <span class="btn-status" :class="`status-${q.status}`" style="cursor:default">
                  {{ STATUS_LABELS[q.status] }}
                </span>
                <div v-if="q.status === 'accepted' && q.poNumber" class="po-tag">
                  PO: {{ q.poNumber }}<span v-if="q.poDueDate"> · due {{ q.poDueDate }}</span>
                </div>
              </template>
            </td>
            <td class="actions-cell">
              <button class="btn-reprint" @click="reprint(q)" title="Reprint quote PDF">🖨️</button>
              <!-- Legacy: quotes converted directly to invoice before this workflow existed -->
              <span v-if="q.convertedToInvoice" class="converted-tag" :title="`Invoice: ${q.convertedToInvoice}`">
                {{ q.convertedToInvoice }}
              </span>
              <!-- New workflow: delivery note generated from accepted quote -->
              <span v-else-if="q.convertedToDelivery" class="converted-tag" :title="`Delivery Note: ${q.convertedToDelivery}`">
                {{ q.convertedToDelivery }}
              </span>
              <button v-else-if="q.status === 'accepted'" class="btn-convert" @click="handleGenerateDeliveryNote(q)" title="Generate delivery note">
                📦 Generate Delivery Note
              </button>
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

.po-tag {
  font-size: 0.7rem;
  color: #7090b0;
  margin-top: 4px;
}

.actions-cell { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }

.decision-btns { display: flex; gap: 5px; align-items: center; flex-wrap: wrap; }

.po-input {
  padding: 4px 8px;
  font-size: 0.75rem;
  border-radius: 6px;
  border: 1px solid #2a3a4a;
  background: #1a2a3a;
  color: #c8d0e0;
  outline: none;
  width: 110px;
}
.po-input:focus { border-color: #4a90d9; }
.po-date { width: 132px; }

.btn-accept, .btn-decline, .btn-cancel-decision {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: opacity 0.15s;
  white-space: nowrap;
}
.btn-accept { background: #1a3a1a; color: #4caf50; }
.btn-accept:hover { background: #2a5a2a; }
.btn-decline { background: #3a1a1a; color: #e94560; }
.btn-decline:hover { background: #5a2a2a; }
.btn-cancel-decision { background: #1a2a3a; color: #7090b0; padding: 4px 7px; }
.btn-cancel-decision:hover { background: #2a3a4a; }

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
.btn-convert { background: #1a3a2a; color: #4caf50; font-size: 0.75rem; }
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
