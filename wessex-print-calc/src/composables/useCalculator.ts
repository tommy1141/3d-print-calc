import { ref } from 'vue'
import type { CalcResult, InvItem } from '@/types'
import { useFilaments } from './useFilaments'

export function useCalculator() {
  const { selectedPrice } = useFilaments()

  // Per-job inputs (reset after adding to order)
  const printGrams = ref<number | null>(null)
  const printHours = ref<number | null>(0)
  const printMins  = ref<number | null>(0)
  const jobDesc    = ref('')
  const labourMins = ref<number | null>(15)

  // Shared settings (persist between jobs)
  const wattage    = ref<number>(300)
  const ratePerKwh = ref<number>(0.245)
  const labourRate = ref<number>(13.01)
  const margin     = ref<number>(30)

  // UI state
  const showResult  = ref(false)
  const showError   = ref(false)
  const result      = ref<CalcResult | null>(null)
  const pendingItem = ref<InvItem | null>(null)

  function calculate() {
    const pkg   = selectedPrice.value ?? 0
    const pg    = printGrams.value ?? 0
    const phRaw = printHours.value || 0
    const pmRaw = printMins.value  || 0
    const ph    = phRaw + pmRaw / 60
    const w     = wattage.value
    const rate  = ratePerKwh.value
    const mg    = margin.value
    const lm    = labourMins.value || 0
    const lr    = labourRate.value || 0

    const filamentValid = pkg > 0 && pg > 0
    const powerValid    = ph > 0 && w >= 0 && rate >= 0
    const marginValid   = mg >= 0 && mg < 100

    if (!filamentValid || !powerValid || !marginValid) {
      showError.value  = true
      showResult.value = false
      return
    }

    showError.value = false

    const filamentCost = (pkg / 1000) * pg
    const powerCost    = (w / 1000) * ph * rate
    const labourCost   = (lm / 60) * lr
    const total        = filamentCost + powerCost + labourCost
    const sellingPrice = total / (1 - mg / 100)
    const profit       = sellingPrice - total

    result.value = {
      filamentCost,
      powerCost,
      labourCost,
      total,
      sellingPrice,
      profit,
      breakdown: `Filament: £${pkg.toFixed(2)}/kg × ${pg}g  |  Power: ${w}W × ${phRaw}h ${pmRaw}m × £${rate}/kWh`,
    }

    showResult.value = true

    pendingItem.value = {
      job: jobDesc.value || '3D Print Job',
      filamentCost, powerCost, labourCost, total, sellingPrice, profit,
      margin: mg, printGrams: pg, printHoursRaw: phRaw, printMinsRaw: pmRaw,
      wattage: w, ratePerKwh: rate, labourMins: lm, labourRate: lr,
    }
  }

  function resetJobFields() {
    printGrams.value  = null
    printHours.value  = 0
    printMins.value   = 0
    jobDesc.value     = ''
    labourMins.value  = 15
    showResult.value  = false
    result.value      = null
    pendingItem.value = null
  }

  return {
    // per-job inputs
    printGrams, printHours, printMins, jobDesc, labourMins,
    // shared settings
    wattage, ratePerKwh, labourRate, margin,
    // state
    showResult, showError, result, pendingItem,
    // actions
    calculate, resetJobFields,
  }
}
