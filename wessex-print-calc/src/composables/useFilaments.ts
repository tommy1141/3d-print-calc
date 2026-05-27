import { ref, computed } from 'vue'

export type FilamentType = 'pla_plus' | 'petg' | 'abs' | 'tpu'

export const FILAMENT_LABELS: Record<FilamentType, string> = {
  pla_plus: 'PLA+',
  petg:     'PETG',
  abs:      'ABS',
  tpu:      'TPU',
}

export const FILAMENT_KEYS: FilamentType[] = ['pla_plus', 'petg', 'abs', 'tpu']

// Module-level shared state — persists across all component instances
const prices = ref<Record<FilamentType, number | null>>({
  pla_plus: 17.99,
  petg:     17.99,
  abs:      17.99,
  tpu:      17.99,
})

const selectedType = ref<FilamentType>('pla_plus')

export function useFilaments() {
  const selectedPrice = computed(() => prices.value[selectedType.value])
  return { prices, selectedType, selectedPrice }
}
