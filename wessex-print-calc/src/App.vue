<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue'
import { useCalculator } from '@/composables/useCalculator'
import { useOrderList }  from '@/composables/useOrderList'
import { useInvoice }    from '@/composables/useInvoice'
import NavBar            from '@/components/NavBar.vue'
import CalculatorForm    from '@/components/CalculatorForm.vue'
import CompanySetup      from '@/components/CompanySetup.vue'
import MaterialsSetup    from '@/components/MaterialsSetup.vue'
import CostResult        from '@/components/CostResult.vue'
import OrderList         from '@/components/OrderList.vue'
import InvoicePreview    from '@/components/InvoicePreview.vue'
import InvoiceHistory    from '@/components/InvoiceHistory.vue'
import StatsView         from '@/components/StatsView.vue'
import { useFilaments }   from '@/composables/useFilaments'
import { useCompany }    from '@/composables/useCompany'
import type { NavView } from '@/types'

const activeView = ref<NavView>('calculator')

const {
  printGrams, printHours, printMins, jobDesc, labourMins,
  wattage, ratePerKwh, labourRate, margin,
  showResult, showError, result, pendingItem,
  calculate, resetJobFields,
} = useCalculator()

const businessName = ref(localStorage.getItem('business-name') ?? '')
watch(businessName, val => localStorage.setItem('business-name', val))

const customerName = ref('')
const customerList = ref<string[]>([])

function normalizeCustomerName(name: string) {
  return name.trim().replace(/\s+/g, ' ')
}

function normalizeCustomerList(names: unknown[]) {
  const seen = new Set<string>()
  const normalized: string[] = []
  for (const name of names) {
    if (typeof name !== 'string') continue
    const cleaned = normalizeCustomerName(name)
    if (!cleaned) continue
    const key = cleaned.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    normalized.push(cleaned)
  }
  return normalized.sort((a, b) => a.localeCompare(b))
}

function rememberCustomer(name: string) {
  const normalized = normalizeCustomerName(name)
  if (!normalized) return
  if (customerList.value.some(existing => existing.toLowerCase() === normalized.toLowerCase())) return
  customerList.value = [...customerList.value, normalized].sort((a, b) => a.localeCompare(b))
}

const { invItems, listTotal, addItem, removeItem, clearAll } = useOrderList()
const { generateInvoice } = useInvoice()
const { prices, costPrices, selectedType } = useFilaments()
const { address: cAddr, email: cEmail, phone: cPhone } = useCompany()

// Cross-device settings sync — loads from server on mount, saves on change
let _settingsReady = false
let _saveTimer: ReturnType<typeof setTimeout> | null = null
function _saveSettings() {
  if (!_settingsReady) return
  if (_saveTimer) clearTimeout(_saveTimer)
  _saveTimer = setTimeout(() => {
    fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessName: businessName.value,
        customerList: customerList.value,
        wattage:      wattage.value,
        ratePerKwh:   ratePerKwh.value,
        labourRate:   labourRate.value,
        margin:       margin.value,
        filamentPrices:     prices.value,
        filamentCostPrices: costPrices.value,
        filamentType:       selectedType.value,
        companyAddress:     cAddr.value,
        companyEmail:       cEmail.value,
        companyPhone:       cPhone.value,
      }),
    }).catch(() => {})
  }, 500)
}
watch([businessName, customerList, wattage, ratePerKwh, labourRate, margin, selectedType, cAddr, cEmail, cPhone], _saveSettings)
watch([prices, costPrices], _saveSettings, { deep: true })
onMounted(async () => {
  try {
    const res  = await fetch('/api/settings')
    const data = await res.json()
    if (data.businessName   !== undefined) businessName.value   = data.businessName
    if (Array.isArray(data.customerList)) {
      customerList.value = normalizeCustomerList(data.customerList)
    }
    if (data.wattage        !== undefined) wattage.value        = data.wattage
    if (data.ratePerKwh     !== undefined) ratePerKwh.value     = data.ratePerKwh
    if (data.labourRate     !== undefined) labourRate.value     = data.labourRate
    if (data.margin         !== undefined) margin.value         = data.margin
    if (data.filamentPrices     !== undefined) prices.value         = data.filamentPrices
    if (data.filamentCostPrices !== undefined) costPrices.value     = data.filamentCostPrices
    if (data.filamentType       !== undefined) selectedType.value   = data.filamentType
    if (data.companyAddress     !== undefined) cAddr.value          = data.companyAddress
    if (data.companyEmail       !== undefined) cEmail.value         = data.companyEmail
    if (data.companyPhone       !== undefined) cPhone.value         = data.companyPhone
    await nextTick()
  } catch { /* keep localStorage values if API unavailable */ }
  _settingsReady = true
})

const invoiceNo   = ref('')
const invoiceDate = ref('')

function addToOrder(qty: number = 1) {
  if (!pendingItem.value) return
  const base = pendingItem.value
  const item = qty <= 1 ? { ...base } : {
    ...base,
    job:          `${base.job} \u00d7${qty}`,
    filamentCost: base.filamentCost * qty,
    powerCost:    base.powerCost    * qty,
    labourCost:   base.labourCost   * qty,
    total:        base.total        * qty,
    sellingPrice: base.sellingPrice * qty,
    profit:       base.profit       * qty,
    printGrams:   base.printGrams   * qty,
  }
  addItem(item)
  resetJobFields()
}

async function onInvoice() {
  if (invItems.value.length === 0) {
    alert('Please add at least one item to the order first.')
    return
  }
  const normalizedCustomer = normalizeCustomerName(customerName.value)
  if (normalizedCustomer) {
    customerName.value = normalizedCustomer
    rememberCustomer(normalizedCustomer)
  }
  const invoiceCustomer = normalizedCustomer || 'Customer'

  try {
    const res  = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        business:   businessName.value || 'My 3D Print Shop',
        customer:   invoiceCustomer,
        items:      invItems.value.map(i => ({
        job:          i.job,
        sellingPrice: i.sellingPrice,
        filamentCost: i.filamentCost,
        powerCost:    i.powerCost,
        labourCost:   i.labourCost,
        profit:       i.profit,
      })),
        grandTotal: invItems.value.reduce((s, i) => s + i.sellingPrice, 0),
      }),
    })
    const data = await res.json()
    invoiceNo.value   = data.invoiceNo
    invoiceDate.value = data.date
  } catch {
    // API unavailable – local fallback
    invoiceNo.value   = 'INV-LOCAL'
    invoiceDate.value = new Date().toLocaleDateString('en-GB')
  }
  activeView.value = 'invoice'
}

function onPrintInvoice(showPaymentDetails: boolean) {
  generateInvoice(invItems.value, businessName.value, customerName.value, invoiceNo.value, invoiceDate.value, showPaymentDetails)
}
</script>

<template>
  <NavBar :active-view="activeView" @navigate="activeView = $event" />

  <main class="app-main">
    <Transition name="fade" mode="out-in">

      <!-- ── Calculator view ── -->
      <div v-if="activeView === 'calculator'" class="calc-layout">
        <!-- Left: form panel -->
        <div class="panel">
          <p class="panel-heading">New Job</p>
          <CalculatorForm
            v-model:printGrams="printGrams"
            v-model:printHours="printHours"
            v-model:printMins="printMins"
            v-model:labourMins="labourMins"
            v-model:jobDesc="jobDesc"
            v-model:customerName="customerName"
            :customer-options="customerList"
            :show-error="showError"
            @calculate="calculate"
          />
        </div>

        <!-- Right: results panel -->
        <div class="results-panel">
          <div class="panel">
            <p class="panel-heading">Pricing Breakdown</p>
            <div v-if="!showResult" class="results-empty">
              <span class="results-empty-icon">📊</span>
              <p>Enter job details and click<br /><strong>Calculate Total Cost</strong><br />to see your pricing breakdown.</p>
            </div>
            <CostResult
              v-else
              :result="result!"
              :margin="margin ?? 30"
              @add-to-order="addToOrder"
            />
          </div>

          <div class="panel" v-if="invItems.length > 0">
            <OrderList
              :items="invItems"
              :total="listTotal"
              @remove="removeItem"
              @clear="clearAll"
              @invoice="onInvoice"
            />
          </div>
        </div>
      </div>

      <!-- ── Company setup view ── -->
      <div v-else-if="activeView === 'setup'" class="setup-layout">
        <div class="panel">
          <p class="panel-heading">Company Setup</p>
          <CompanySetup
            v-model:wattage="wattage"
            v-model:ratePerKwh="ratePerKwh"
            v-model:labourRate="labourRate"
            v-model:margin="margin"
            v-model:businessName="businessName"
          />
        </div>
      </div>

      <!-- ── Materials setup view ── -->
      <div v-else-if="activeView === 'materials'" class="setup-layout">
        <div class="panel">
          <p class="panel-heading">Materials Setup</p>
          <MaterialsSetup />
        </div>
      </div>

      <!-- ── Invoice stage ── -->
      <div v-else-if="activeView === 'invoice'" class="invoice-layout">
        <InvoicePreview
          :items="invItems"
          :business="businessName"
          :customer="customerName"
          :invoice-no="invoiceNo"
          :date="invoiceDate"
          @back="activeView = 'calculator'"
          @print="onPrintInvoice"
        />
      </div>

      <!-- ── Invoice history ── -->
      <div v-else-if="activeView === 'invoices'" class="setup-layout">
        <div class="panel">
          <InvoiceHistory @reprint="(inv) => generateInvoice(inv.items, inv.business, inv.customer, inv.invoiceNo, inv.date)" />
        </div>
      </div>

      <!-- ── Stats ── -->
      <div v-else-if="activeView === 'stats'" class="setup-layout">
        <div class="panel">
          <StatsView />
        </div>
      </div>

    </Transition>
  </main>
</template>
