import { ref, computed, watch } from 'vue'

export type FilamentType = 'pla_plus' | 'petg' | 'abs' | 'tpu'

export const FILAMENT_LABELS: Record<FilamentType, string> = {
  pla_plus: 'PLA+',
  petg:     'PETG',
  abs:      'ABS',
  tpu:      'TPU',
}

export const FILAMENT_KEYS: FilamentType[] = ['pla_plus', 'petg', 'abs', 'tpu']

const DEFAULT_BRANDS = ['Bambu Labs', 'Sunlu']

// Module-level shared state — persisted to localStorage
const _storedPrices = localStorage.getItem('filament-prices')
const prices = ref<Record<FilamentType, number | null>>(
  _storedPrices ? JSON.parse(_storedPrices) : { pla_plus: 17.99, petg: 17.99, abs: 17.99, tpu: 17.99 }
)
watch(prices, val => localStorage.setItem('filament-prices', JSON.stringify(val)), { deep: true })

const _storedType = localStorage.getItem('filament-type') as FilamentType | null
const selectedType = ref<FilamentType>(_storedType ?? 'pla_plus')
watch(selectedType, val => localStorage.setItem('filament-type', val))

const _storedCostPrices = localStorage.getItem('filament-cost-prices')
const costPrices = ref<Record<FilamentType, number | null>>(
  _storedCostPrices ? JSON.parse(_storedCostPrices) : { pla_plus: null, petg: null, abs: null, tpu: null }
)
watch(costPrices, val => localStorage.setItem('filament-cost-prices', JSON.stringify(val)), { deep: true })

const _storedBrands = localStorage.getItem('filament-brands')
const brands = ref<string[]>(_storedBrands ? JSON.parse(_storedBrands) : [...DEFAULT_BRANDS])
watch(brands, val => localStorage.setItem('filament-brands', JSON.stringify(val)), { deep: true })

const _storedBrandCostPrices = localStorage.getItem('brand-cost-prices')
const brandCostPrices = ref<Record<string, number | null>>(_storedBrandCostPrices ? JSON.parse(_storedBrandCostPrices) : {})
watch(brandCostPrices, val => localStorage.setItem('brand-cost-prices', JSON.stringify(val)), { deep: true })

export function useFilaments() {
  const selectedPrice     = computed(() => prices.value[selectedType.value])
  const selectedCostPrice = computed(() => costPrices.value[selectedType.value])

  function addBrand(name: string) {
    const n = name.trim()
    if (n && !brands.value.includes(n)) brands.value.push(n)
  }

  function removeBrand(name: string) {
    brands.value = brands.value.filter(b => b !== name)
    delete brandCostPrices.value[name]
  }

  return { prices, costPrices, selectedType, selectedPrice, selectedCostPrice, brands, brandCostPrices, addBrand, removeBrand }
}
