import { ref, computed } from 'vue'
import type { InvItem } from '@/types'

export function useOrderList() {
  const invItems = ref<InvItem[]>([])

  const listTotal = computed(() =>
    '£' + invItems.value.reduce((sum, item) => sum + item.sellingPrice, 0).toFixed(2)
  )

  function addItem(item: InvItem) {
    invItems.value.push(item)
  }

  function removeItem(index: number) {
    invItems.value.splice(index, 1)
  }

  function clearAll() {
    if (invItems.value.length && !confirm('Remove all items from the order?')) return
    invItems.value = []
  }

  return { invItems, listTotal, addItem, removeItem, clearAll }
}
