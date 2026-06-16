export type NavView = 'inventory' | 'calculator' | 'setup' | 'materials' | 'invoice' | 'invoices' | 'invoicing' | 'stats' | 'quotes' | 'quote-preview' | 'delivery-notes'

export type QuoteStatus = 'pending' | 'sent' | 'accepted' | 'declined'

export interface OrderItem {
  job: string
  sellingPrice: number
  filamentCost?: number
  powerCost?: number
  labourCost?: number
  profit?: number
  partId?: string
  filamentType?: string
  printGrams?: number
  qty?: number
}

export interface SavedQuote {
  quoteNo: string
  date: string
  business: string
  customer: string
  items: OrderItem[]
  grandTotal: number
  savedAt: string
  status: QuoteStatus
  convertedToInvoice?: string  // LEGACY: pre-PO-workflow quotes may have this set; no longer created
  poNumber?: string
  poDueDate?: string
  convertedToDelivery?: string  // deliveryNo once a delivery note has been generated
}

export interface SavedInvoice {
  invoiceNo: string
  date: string
  business: string
  customer: string
  items: OrderItem[]
  grandTotal: number
  savedAt: string
  paid?: boolean
  poNumber?: string
  deliveryNo?: string
  quoteNo?: string
}

export interface SavedDeliveryNote {
  deliveryNo: string
  quoteNo: string
  date: string
  business: string
  customer: string
  items: OrderItem[]
  grandTotal: number
  savedAt: string
  poNumber?: string
  poDueDate?: string
  convertedToInvoice?: string
}

export interface InvItem {
  job: string
  qty: number
  partId?: string
  filamentType: string
  filamentCost: number
  powerCost: number
  labourCost: number
  total: number
  sellingPrice: number
  profit: number
  margin: number
  printGrams: number
  printHoursRaw: number
  printMinsRaw: number
  wattage: number
  ratePerKwh: number
  labourMins: number
  labourRate: number
}

export interface CalcResult {
  filamentCost: number
  powerCost: number
  labourCost: number
  total: number
  sellingPrice: number
  profit: number
  breakdown: string
  actualProfit?: number
}
