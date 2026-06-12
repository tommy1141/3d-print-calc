import { ref } from 'vue'
import type { SavedQuote, QuoteStatus } from '@/types'

const quotes  = ref<SavedQuote[]>([])
const loading = ref(true)
const apiError = ref(false)
let fetched = false

const STATUS_KEY = 'quote-status-map'

function getStatusMap(): Record<string, QuoteStatus> {
  try { return JSON.parse(localStorage.getItem(STATUS_KEY) || '{}') } catch { return {} }
}
function saveStatusMap(map: Record<string, QuoteStatus>) {
  localStorage.setItem(STATUS_KEY, JSON.stringify(map))
}

export function useQuoteStore() {
  async function fetchQuotes(force = false) {
    if (fetched && !force) return
    if (!fetched) loading.value = true
    try {
      const res = await fetch('/api/quotes')
      if (!res.ok) throw new Error()
      const data: SavedQuote[] = await res.json()
      const statusMap = getStatusMap()
      quotes.value = data.map(q => ({
        ...q,
        status: (statusMap[q.quoteNo] as QuoteStatus) ?? q.status ?? 'pending',
      }))
      apiError.value = false
    } catch {
      apiError.value = true
    } finally {
      loading.value = false
      fetched = true
    }
  }

  async function setStatus(quote: SavedQuote, status: QuoteStatus) {
    const idx = quotes.value.findIndex(q => q.quoteNo === quote.quoteNo)
    if (idx === -1) return
    quotes.value.splice(idx, 1, { ...quotes.value[idx], status })
    const map = getStatusMap()
    map[quote.quoteNo] = status
    saveStatusMap(map)
    try {
      await fetch(`/api/quotes/${encodeURIComponent(quote.quoteNo)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
    } catch {}
  }

  async function deleteQuote(quoteNo: string) {
    await fetch(`/api/quotes/${encodeURIComponent(quoteNo)}`, { method: 'DELETE' })
    quotes.value = quotes.value.filter(q => q.quoteNo !== quoteNo)
    const map = getStatusMap()
    delete map[quoteNo]
    saveStatusMap(map)
  }

  function addQuote(quote: SavedQuote) {
    quotes.value.unshift(quote)
  }

  async function convertToInvoice(quote: SavedQuote): Promise<{ invoiceNo: string; date: string } | null> {
    try {
      const res = await fetch(`/api/quotes/${encodeURIComponent(quote.quoteNo)}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json()
      // Mark locally as accepted + converted
      const idx = quotes.value.findIndex(q => q.quoteNo === quote.quoteNo)
      if (idx !== -1) {
        quotes.value.splice(idx, 1, {
          ...quotes.value[idx],
          status: 'accepted',
          convertedToInvoice: data.invoiceNo,
        })
      }
      const map = getStatusMap()
      map[quote.quoteNo] = 'accepted'
      saveStatusMap(map)
      return { invoiceNo: data.invoiceNo, date: data.date }
    } catch {
      return null
    }
  }

  return { quotes, loading, apiError, fetchQuotes, setStatus, deleteQuote, addQuote, convertToInvoice }
}
