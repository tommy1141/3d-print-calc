<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useInvoice } from '@/composables/useInvoice'
import { useInvoiceStore } from '@/composables/useInvoiceStore'
import { useInventory } from '@/composables/useInventory'
import type { SavedInvoice } from '@/types'
import type { FilamentType } from '@/composables/useFilaments'

const emit = defineEmits<{ reprint: [inv: SavedInvoice] }>()

const { invoices, loading, apiError, fetchInvoices, togglePaid, deleteInvoice: storeDelete, renameInvoice, updatePoNumber } = useInvoiceStore()
const { generateInvoice } = useInvoice()
const { restorePartStock, restoreFilament } = useInventory()

onMounted(() => fetchInvoices())

function reprint(inv: SavedInvoice) {
  generateInvoice(inv.items, inv.business, inv.customer, inv.invoiceNo, inv.date, true, inv.poNumber)
}

async function deleteInvoice(inv: SavedInvoice) {
  if (!confirm(`Delete ${inv.invoiceNo}? This cannot be undone.`)) return
  for (const item of inv.items) {
    if (item.partId && item.qty) restorePartStock(item.partId, item.qty)
    if (item.filamentType && item.printGrams) restoreFilament(item.filamentType as FilamentType, item.printGrams)
  }
  await storeDelete(inv.invoiceNo)
}

// ── Inline rename ──────────────────────────────────────────────────
const renamingNo  = ref<string | null>(null)
const renameInput = ref('')

// ── Inline PO edit ─────────────────────────────────────────────────
const editingPoFor = ref<string | null>(null)
const poInput      = ref('')

function startEditPo(inv: SavedInvoice) {
  editingPoFor.value = inv.invoiceNo
  poInput.value      = inv.poNumber ?? ''
}

function cancelEditPo() {
  editingPoFor.value = null
}

async function saveEditPo(invoiceNo: string) {
  await updatePoNumber(invoiceNo, poInput.value.trim())
  editingPoFor.value = null
}

function startRename(inv: SavedInvoice) {
  renamingNo.value  = inv.invoiceNo
  renameInput.value = inv.invoiceNo
}

function cancelRename() {
  renamingNo.value = null
}

async function saveRename(oldNo: string) {
  const newNo = renameInput.value.trim()
  if (!newNo || newNo === oldNo) { cancelRename(); return }
  await renameInvoice(oldNo, newNo)
  renamingNo.value = null
}
</script>

<template>
  <div class="history">
    <p class="panel-heading">📋 Invoice History</p>

    <div v-if="loading" class="status-msg">Loading…</div>

    <div v-else-if="apiError" class="status-msg warn">
      Could not connect to the API. Invoice history is only available when running via Docker.
    </div>

    <div v-else-if="invoices.length === 0" class="status-msg">
      No invoices saved yet.
    </div>

    <div v-else class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Invoice #</th>
            <th>Date</th>
            <th>Customer</th>
            <th>PO Ref</th>
            <th class="amount">Total</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="inv in invoices" :key="inv.invoiceNo">
            <td class="inv-no">
              <template v-if="renamingNo === inv.invoiceNo">
                <input
                  class="rename-input"
                  v-model="renameInput"
                  @keydown.enter="saveRename(inv.invoiceNo)"
                  @keydown.escape="cancelRename()"
                  @click.stop
                  autofocus
                />
                <button class="btn-rename-save" @click="saveRename(inv.invoiceNo)" title="Save">✓</button>
                <button class="btn-rename-cancel" @click="cancelRename()" title="Cancel">✕</button>
              </template>
              <template v-else>
                <span class="inv-no-text" @click="startRename(inv)" title="Click to rename">{{ inv.invoiceNo }}</span>
              </template>
            </td>
            <td>{{ inv.date }}</td>
            <td>{{ inv.customer }}</td>
            <td class="po-cell">
              <template v-if="editingPoFor === inv.invoiceNo">
                <input
                  class="rename-input po-edit-input"
                  v-model="poInput"
                  placeholder="PO number…"
                  @keydown.enter="saveEditPo(inv.invoiceNo)"
                  @keydown.escape="cancelEditPo()"
                  @click.stop
                  autofocus
                />
                <button class="btn-rename-save" @click="saveEditPo(inv.invoiceNo)" title="Save">✓</button>
                <button class="btn-rename-cancel" @click="cancelEditPo()" title="Cancel">✕</button>
              </template>
              <template v-else>
                <span class="po-edit-text" @click="startEditPo(inv)" title="Click to edit PO number">{{ inv.poNumber || '—' }}</span>
              </template>
            </td>
            <td class="amount">£{{ Number(inv.grandTotal).toFixed(2) }}</td>
            <td>
              <button class="btn-paid" :class="inv.paid ? 'is-paid' : 'is-unpaid'" @click="togglePaid(inv)">
                {{ inv.paid ? '✅ Paid' : '⏳ Unpaid' }}
              </button>
            </td>
            <td class="actions-cell">
              <button class="btn-reprint" @click="reprint(inv)">🖨️ Reprint</button>
              <button class="btn-delete" @click="deleteInvoice(inv)" title="Delete">🗑️</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.history { width: 100%; }

.status-msg { color: #a0a0b0; font-size: 0.9rem; padding: 24px 0; text-align: center; }
.status-msg.warn { color: #e9a020; }

.table-wrap { overflow-x: auto; }

table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
thead tr { background: #1a1a2e; }
thead th { padding: 10px 14px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.07em; color: #a0b0c8; white-space: nowrap; }
tbody tr { border-bottom: 1px solid #1a3a5a; transition: background 0.1s; }
tbody tr:hover { background: #0f2a45; }
tbody td { padding: 10px 14px; color: #c8d0e0; }

.inv-no { font-family: monospace; font-weight: 600; white-space: nowrap; }
.inv-no-text { color: #e94560; cursor: pointer; border-bottom: 1px dashed rgba(233,69,96,0.4); }
.inv-no-text:hover { border-bottom-color: #e94560; }

.rename-input {
  background: #0f2040;
  border: 1px solid #4a90d9;
  border-radius: 5px;
  color: #e0e8f0;
  font-family: monospace;
  font-size: 0.88rem;
  padding: 2px 6px;
  width: 120px;
  outline: none;
}

.btn-rename-save, .btn-rename-cancel {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.82rem;
  cursor: pointer;
  border: none;
  margin-left: 4px;
}
.btn-rename-save { background: #1a4a2a; color: #4caf50; }
.btn-rename-save:hover { background: #2a6a3a; }
.btn-rename-cancel { background: #3a1a1a; color: #e94560; }
.btn-rename-cancel:hover { background: #5a2a2a; }

.po-cell { color: #a0bcd8; font-size: 0.9rem; font-family: monospace; white-space: nowrap; font-weight: 500; }
.po-edit-text { cursor: pointer; border-bottom: 1px dashed rgba(160,188,216,0.4); }
.po-edit-text:hover { border-bottom-color: #a0bcd8; color: #c8ddf0; }
.po-edit-input { width: 140px; }
.amount { text-align: right; font-weight: 600; color: #4caf50; }

.btn-reprint { padding: 5px 14px; background: #1a4a7a; color: #e0e8f0; border: none; border-radius: 6px; font-size: 0.82rem; font-weight: 600; cursor: pointer; white-space: nowrap; transition: background 0.15s; }
.btn-reprint:hover { background: #e94560; color: #fff; }

.actions-cell { display: flex; gap: 8px; align-items: center; }

.btn-delete { padding: 5px 10px; background: none; border: 1px solid #3a2a3a; border-radius: 6px; color: #e94560; font-size: 0.85rem; cursor: pointer; transition: background 0.15s; }
.btn-delete:hover { background: #e94560; color: #fff; border-color: #e94560; }

.btn-paid { padding: 4px 12px; border-radius: 20px; font-size: 0.78rem; font-weight: 600; cursor: pointer; border: none; white-space: nowrap; transition: opacity 0.15s; }
.btn-paid:hover { opacity: 0.8; }
.btn-paid.is-paid { background: #1a4a2a; color: #4caf50; }
.btn-paid.is-unpaid { background: #3a2a1a; color: #e9a020; }
</style>
