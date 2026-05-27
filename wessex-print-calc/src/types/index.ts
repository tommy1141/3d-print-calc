export type NavView = 'calculator' | 'setup' | 'materials' | 'invoice' | 'invoices' | 'stats'

export interface CustomerContact {
  name: string
  email?: string
  phone?: string
  address?: string
}

export interface SavedInvoice {
  invoiceNo: string
  date: string
  business: string
  customer: string
  customerEmail?: string
  customerPhone?: string
  customerAddress?: string
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
}

export interface InvItem {
  job: string
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
