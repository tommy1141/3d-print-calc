<script setup lang="ts">
import { onMounted } from 'vue'
import { useDeliveryNoteStore } from '@/composables/useDeliveryNoteStore'
import { useInvoiceStore } from '@/composables/useInvoiceStore'
import { useInventory } from '@/composables/useInventory'
import type { SavedDeliveryNote } from '@/types'
import type { FilamentType } from '@/composables/useFilaments'

const emit = defineEmits<{ reprint: [dn: SavedDeliveryNote] }>()

const { deliveryNotes, loading, apiError, fetchDeliveryNotes, deleteDeliveryNote, convertToInvoice } = useDeliveryNoteStore()
const { addInvoice } = useInvoiceStore()
const { restorePartStock, restoreFilament } = useInventory()

onMounted(() => fetchDeliveryNotes())

async function handleConvert(dn: SavedDeliveryNote) {
  const result = await convertToInvoice(dn)
  if (result) {
    addInvoice({
      invoiceNo:  result.invoiceNo,
      date:       result.date,
      business:   dn.business,
      customer:   dn.customer,
      items:      dn.items,
      grandTotal: dn.grandTotal,
      savedAt:    new Date().toISOString(),
      paid:       false,
      poNumber:   dn.poNumber,
      deliveryNo: dn.deliveryNo,
      quoteNo:    dn.quoteNo,
    })
    alert(`Converted to ${result.invoiceNo}`)
  }
}

async function handleDelete(dn: SavedDeliveryNote) {
  if (!confirm(`Delete ${dn.deliveryNo}? This cannot be undone.`)) return
  if (!dn.convertedToInvoice) {
    // Restore stock — DN was the deduction point and was never converted to an invoice
    for (const item of dn.items) {
      if (item.partId && item.qty) restorePartStock(item.partId, item.qty)
      if (item.filamentType && item.printGrams) restoreFilament(item.filamentType as FilamentType, item.printGrams)
    }
  }
  await deleteDeliveryNote(dn.deliveryNo)
}
</script>

<template>
  <div class="history">
    <p class="panel-heading">📦 Delivery Notes</p>

    <div v-if="loading" class="status-msg">Loading…</div>

    <div v-else-if="apiError" class="status-msg warn">
      Could not connect to the API. Delivery notes are only available when running via Docker.
    </div>

    <div v-else-if="deliveryNotes.length === 0" class="status-msg">
      No delivery notes yet. Accept a quote and generate one from Quote History.
    </div>

    <div v-else class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>DN #</th>
            <th>Date</th>
            <th>Quote #</th>
            <th>Customer</th>
            <th>PO #</th>
            <th class="amount">Total</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="dn in deliveryNotes" :key="dn.deliveryNo">
            <td class="dn-no">{{ dn.deliveryNo }}</td>
            <td>{{ dn.date }}</td>
            <td class="ref-no">{{ dn.quoteNo }}</td>
            <td>{{ dn.customer }}</td>
            <td class="po-cell">{{ dn.poNumber || '—' }}</td>
            <td class="amount">£{{ Number(dn.grandTotal).toFixed(2) }}</td>
            <td class="actions-cell">
              <button class="btn-reprint" @click="emit('reprint', dn)" title="Reprint delivery note PDF">🖨️</button>
              <span v-if="dn.convertedToInvoice" class="converted-tag" :title="`Invoice: ${dn.convertedToInvoice}`">
                {{ dn.convertedToInvoice }}
              </span>
              <button v-else class="btn-convert" @click="handleConvert(dn)">🧾 Convert to Invoice</button>
              <button class="btn-delete" @click="handleDelete(dn)" title="Delete">🗑️</button>
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
tbody td { padding: 10px 14px; color: #c8d0e0; }

.dn-no  { font-family: monospace; color: #4caf50; font-weight: 600; }
.ref-no { font-family: monospace; color: #4a90d9; font-size: 0.85rem; }
.po-cell { font-size: 0.85rem; color: #a0b0c8; }
.amount { text-align: right; font-weight: 600; color: #4caf50; }

.actions-cell { display: flex; gap: 6px; align-items: center; }

.btn-reprint {
  padding: 5px 8px;
  background: #1a4a7a;
  color: #e0e8f0;
  border: none;
  border-radius: 6px;
  font-size: 0.82rem;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-reprint:hover { background: #2a6aaa; }

.btn-convert {
  padding: 5px 10px;
  background: #1a3a2a;
  color: #4caf50;
  border: none;
  border-radius: 6px;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s;
}
.btn-convert:hover { background: #2a5a3a; }

.btn-delete {
  padding: 5px 10px;
  background: none;
  border: 1px solid #3a2a3a;
  border-radius: 6px;
  color: #e94560;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background 0.15s;
}
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
