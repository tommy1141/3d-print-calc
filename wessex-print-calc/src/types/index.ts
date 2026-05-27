export type NavView = 'calculator' | 'setup' | 'materials' | 'invoice'

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
}
