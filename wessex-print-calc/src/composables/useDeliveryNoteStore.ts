import { ref } from 'vue'
import type { SavedDeliveryNote } from '@/types'

const deliveryNotes = ref<SavedDeliveryNote[]>([])
const loading  = ref(true)
const apiError = ref(false)
let fetched = false

export function useDeliveryNoteStore() {
  async function fetchDeliveryNotes(force = false) {
    if (fetched && !force) return
    if (!fetched) loading.value = true
    try {
      const res = await fetch('/api/delivery-notes')
      if (!res.ok) throw new Error()
      deliveryNotes.value = await res.json()
      apiError.value = false
    } catch {
      apiError.value = true
    } finally {
      loading.value = false
      fetched = true
    }
  }

  function addDeliveryNote(dn: SavedDeliveryNote) {
    deliveryNotes.value.unshift(dn)
  }

  async function deleteDeliveryNote(deliveryNo: string) {
    await fetch(`/api/delivery-notes/${encodeURIComponent(deliveryNo)}`, { method: 'DELETE' })
    deliveryNotes.value = deliveryNotes.value.filter(d => d.deliveryNo !== deliveryNo)
  }

  async function convertToInvoice(dn: SavedDeliveryNote): Promise<{ invoiceNo: string; date: string } | null> {
    try {
      const res = await fetch(`/api/delivery-notes/${encodeURIComponent(dn.deliveryNo)}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json()
      const idx = deliveryNotes.value.findIndex(d => d.deliveryNo === dn.deliveryNo)
      if (idx !== -1) {
        deliveryNotes.value.splice(idx, 1, { ...deliveryNotes.value[idx], convertedToInvoice: data.invoiceNo })
      }
      return { invoiceNo: data.invoiceNo, date: data.date }
    } catch {
      return null
    }
  }

  return { deliveryNotes, loading, apiError, fetchDeliveryNotes, addDeliveryNote, deleteDeliveryNote, convertToInvoice }
}
