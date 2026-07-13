import { ref } from 'vue'
import type { SavedInvoice } from '@/types'

// Module-level shared state — survives tab switches
const invoices  = ref<SavedInvoice[]>([])
const loading   = ref(true)
const apiError  = ref(false)
let fetched = false

const PAID_KEY = 'invoice-paid-status'

function getPaidMap(): Record<string, boolean> {
  try { return JSON.parse(localStorage.getItem(PAID_KEY) || '{}') } catch { return {} }
}

function savePaidMap(map: Record<string, boolean>) {
  localStorage.setItem(PAID_KEY, JSON.stringify(map))
}

export function useInvoiceStore() {
  async function fetchInvoices(force = false) {
    if (fetched && !force) return
    if (!fetched) loading.value = true   // spinner only on very first load
    try {
      const res = await fetch('/api/invoices')
      if (!res.ok) throw new Error()
      const data: SavedInvoice[] = await res.json()
      // Merge localStorage paid statuses — survives server not having PATCH yet
      const paidMap = getPaidMap()
      invoices.value = data.map(inv => ({
        ...inv,
        paid: paidMap[inv.invoiceNo] ?? inv.paid ?? false,
      }))
      apiError.value = false
    } catch {
      apiError.value = true
    } finally {
      loading.value = false
      fetched = true
    }
  }

  async function togglePaid(inv: SavedInvoice) {
    const idx = invoices.value.findIndex(i => i.invoiceNo === inv.invoiceNo)
    if (idx === -1) return
    const newPaid = !invoices.value[idx].paid

    // 1. Persist in localStorage so it survives tab-switches and refetches
    const paidMap = getPaidMap()
    paidMap[inv.invoiceNo] = newPaid
    savePaidMap(paidMap)

    // 2. Splice replaces the element — guaranteed to trigger Vue reactivity
    invoices.value.splice(idx, 1, { ...invoices.value[idx], paid: newPaid })

    // 3. Best-effort server persist
    try {
      await fetch(`/api/invoices/${encodeURIComponent(inv.invoiceNo)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paid: newPaid }),
      })
    } catch { /* API unavailable — localStorage already has correct state */ }
  }

  async function deleteInvoice(invoiceNo: string) {
    await fetch(`/api/invoices/${encodeURIComponent(invoiceNo)}`, { method: 'DELETE' })
    invoices.value = invoices.value.filter(i => i.invoiceNo !== invoiceNo)
    // Also clean up localStorage entry
    const paidMap = getPaidMap()
    delete paidMap[invoiceNo]
    savePaidMap(paidMap)
  }

  function addInvoice(invoice: SavedInvoice) {
    invoices.value.unshift(invoice)
  }

  async function updatePoNumber(invoiceNo: string, poNumber: string) {
    const idx = invoices.value.findIndex(i => i.invoiceNo === invoiceNo)
    if (idx === -1) return
    await fetch(`/api/invoices/${encodeURIComponent(invoiceNo)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ poNumber: poNumber || null }),
    })
    invoices.value.splice(idx, 1, { ...invoices.value[idx], poNumber: poNumber || undefined })
  }

  async function renameInvoice(oldNo: string, newNo: string) {
    const idx = invoices.value.findIndex(i => i.invoiceNo === oldNo)
    if (idx === -1) return
    await fetch(`/api/invoices/${encodeURIComponent(oldNo)}/rename`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newInvoiceNo: newNo }),
    })
    // Migrate the paid-map key so the status is preserved
    const paidMap = getPaidMap()
    if (oldNo in paidMap) {
      paidMap[newNo] = paidMap[oldNo]
      delete paidMap[oldNo]
      savePaidMap(paidMap)
    }
    invoices.value.splice(idx, 1, { ...invoices.value[idx], invoiceNo: newNo })
  }

  return { invoices, loading, apiError, fetchInvoices, togglePaid, deleteInvoice, addInvoice, renameInvoice, updatePoNumber }
}
