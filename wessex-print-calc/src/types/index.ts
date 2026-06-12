export type NavView = 'inventory' | 'calculator' | 'setup' | 'materials' | 'invoice' | 'invoices' | 'invoicing' | 'stats' | 'quotes' | 'quote-preview'

export type QuoteStatus = 'pending' | 'sent' | 'accepted' | 'declined'

export interface SavedQuote {
  quoteNo: string
  date: string
  business: string
  customer: string
  items: {
    job: string
    sellingPrice: number
    filamentCost?: number
    powerCost?: number
    labourCost?: number
    profit?: number
  }[]
  grandTotal: number
  savedAt: string
  status: QuoteStatus
  convertedToInvoice?: string  // invoiceNo if converted
}

export interface SavedInvoice {
  invoiceNo: string
  date: string
  business: string
  customer: string
  items: {
    job: string
    sellingPrice: number
    filamentCost?: number
    powerCost?: number
    labourCost?: number
    profit?: number
    // Stock restoration fields
    partId?: string
    filamentType?: string
    printGrams?: number
    qty?: number
  }[]
  grandTotal: number
  savedAt: string
  paid?: boolean
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
