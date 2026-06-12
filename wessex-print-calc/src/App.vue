<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue'
import { useCalculator } from '@/composables/useCalculator'
import { useOrderList }  from '@/composables/useOrderList'
import { useInvoice }    from '@/composables/useInvoice'
import { useInvoiceStore } from '@/composables/useInvoiceStore'
import { useQuoteStore }   from '@/composables/useQuoteStore'
import NavBar            from '@/components/NavBar.vue'
import CalculatorForm    from '@/components/CalculatorForm.vue'
import CompanySetup      from '@/components/CompanySetup.vue'
import MaterialsSetup    from '@/components/MaterialsSetup.vue'
import CostResult        from '@/components/CostResult.vue'
import OrderList         from '@/components/OrderList.vue'
import InvoicePreview    from '@/components/InvoicePreview.vue'
import InvoiceHistory    from '@/components/InvoiceHistory.vue'
import InvoicingHub      from '@/components/InvoicingHub.vue'
import QuoteHistory      from '@/components/QuoteHistory.vue'
import QuotePreview      from '@/components/QuotePreview.vue'
import StatsView         from '@/components/StatsView.vue'
import InventoryView     from '@/components/InventoryView.vue'
import StockJobForm      from '@/components/StockJobForm.vue'
import { useFilaments }   from '@/composables/useFilaments'
import { useInventory }  from '@/composables/useInventory'
import type { PartDefinition } from '@/composables/useInventory'
import { useCompany }    from '@/composables/useCompany'
import type { NavView } from '@/types'
import type { InvItem } from '@/types'

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
const { addInvoice: addInvoiceToStore } = useInvoiceStore()
const { addQuote: addQuoteToStore } = useQuoteStore()

// Snapshot of items used to generate the current invoice/quote preview
const invoicedItems = ref<InvItem[]>([])
const quotedItems   = ref<InvItem[]>([])
const { prices, costPrices, selectedType } = useFilaments()
const { address: cAddr, email: cEmail, phone: cPhone } = useCompany()
const { deductPartStock, deductFilament, restorePartStock, restoreFilament } = useInventory()

// Invoicing mode: 'custom' = manual form, 'stock' = pick from inventory parts
const invoicingMode = ref<'custom' | 'stock'>('custom')
const stockPartId   = ref<string | null>(null)

function onFillPart(part: PartDefinition) {
  // Auto-fill calculator state from part spec
  selectedType.value = part.filamentType
  printGrams.value   = part.gramsPerUnit
  printHours.value   = part.printHoursPerUnit
  printMins.value    = part.printMinsPerUnit
  labourMins.value   = part.labourMinsPerUnit
  jobDesc.value      = part.name
  stockPartId.value  = part.id
  calculate()
}

function onClearPart() {
  stockPartId.value = null
  resetJobFields()
}

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
  const item = {
    ...base,
    qty,
    partId:       stockPartId.value ?? undefined,
    filamentType: selectedType.value,
    filamentCost: base.filamentCost * qty,
    powerCost:    base.powerCost    * qty,
    labourCost:   base.labourCost   * qty,
    total:        base.total        * qty,
    sellingPrice: base.sellingPrice * qty,
    profit:       base.profit       * qty,
    printGrams:   base.printGrams   * qty,
  }
  addItem(item)
  if (stockPartId.value) deductPartStock(stockPartId.value, qty)
  deductFilament(selectedType.value, base.printGrams * qty)
  stockPartId.value = null
  resetJobFields()
}

function onRemoveItem(index: number) {
  const item = invItems.value[index]
  if (item.partId) restorePartStock(item.partId, item.qty)
  restoreFilament(item.filamentType as any, item.printGrams)
  invItems.value.splice(index, 1)
}

function onUpdateQty(index: number, newQty: number) {
  if (newQty < 1) return
  const item = invItems.value[index]
  const oldQty = item.qty
  if (newQty === oldQty) return
  const gramsPerUnit = item.printGrams / oldQty
  const delta = oldQty - newQty
  if (delta > 0) {
    if (item.partId) restorePartStock(item.partId, delta)
    restoreFilament(item.filamentType as any, gramsPerUnit * delta)
  } else {
    const add = -delta
    if (item.partId) deductPartStock(item.partId, add)
    deductFilament(item.filamentType as any, gramsPerUnit * add)
  }
  const scale = newQty / oldQty
  invItems.value.splice(index, 1, {
    ...item,
    qty:          newQty,
    filamentCost: Math.round(item.filamentCost * scale * 100) / 100,
    powerCost:    Math.round(item.powerCost    * scale * 100) / 100,
    labourCost:   Math.round(item.labourCost   * scale * 100) / 100,
    total:        Math.round(item.total        * scale * 100) / 100,
    sellingPrice: Math.round(item.sellingPrice * scale * 100) / 100,
    profit:       Math.round(item.profit       * scale * 100) / 100,
    printGrams:   gramsPerUnit * newQty,
  })
}

function onCancelOrder() {
  for (const item of invItems.value) {
    if (item.partId) restorePartStock(item.partId, item.qty)
    restoreFilament(item.filamentType as any, item.printGrams)
  }
  invItems.value = []
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
        job:          i.qty > 1 ? `${i.job} ×${i.qty}` : i.job,
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
  // Snapshot items for the preview, then clear without confirm dialog
  invoicedItems.value = [...invItems.value]
  invItems.value = []
  // Add to the shared invoice store so the Invoices tab updates immediately
  addInvoiceToStore({
    invoiceNo: invoiceNo.value,
    date:      invoiceDate.value,
    business:  businessName.value || 'My 3D Print Shop',
    customer:  normalizeCustomerName(customerName.value) || 'Customer',
    items:     invoicedItems.value.map(i => ({
      job:          i.qty > 1 ? `${i.job} \u00d7${i.qty}` : i.job,
      sellingPrice: i.sellingPrice,
      filamentCost: i.filamentCost,
      powerCost:    i.powerCost,
      labourCost:   i.labourCost,
      profit:       i.profit,
      // Stock restoration fields
      partId:       i.partId,
      filamentType: i.filamentType,
      printGrams:   i.printGrams,
      qty:          i.qty,
    })),
    grandTotal: invoicedItems.value.reduce((s, i) => s + i.sellingPrice, 0),
    savedAt:   new Date().toISOString(),
    paid:      false,
  })
  activeView.value = 'invoice'
}

const quoteNo   = ref('')
const quoteDate = ref('')

async function onQuote() {
  if (invItems.value.length === 0) {
    alert('Please add at least one item to the order first.')
    return
  }
  const normalizedCustomer = normalizeCustomerName(customerName.value)
  if (normalizedCustomer) {
    customerName.value = normalizedCustomer
    rememberCustomer(normalizedCustomer)
  }
  const quoteCustomer = normalizedCustomer || 'Customer'
  const quoteItems = invItems.value.map(i => ({
    job:          i.qty > 1 ? `${i.job} ×${i.qty}` : i.job,
    sellingPrice: i.sellingPrice,
    filamentCost: i.filamentCost,
    powerCost:    i.powerCost,
    labourCost:   i.labourCost,
    profit:       i.profit,
  }))

  try {
    const res  = await fetch('/api/quotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        business:   businessName.value || 'My 3D Print Shop',
        customer:   quoteCustomer,
        items:      quoteItems,
        grandTotal: invItems.value.reduce((s, i) => s + i.sellingPrice, 0),
      }),
    })
    const data = await res.json()
    quoteNo.value   = data.quoteNo
    quoteDate.value = data.date
  } catch {
    quoteNo.value   = 'QUO-LOCAL'
    quoteDate.value = new Date().toLocaleDateString('en-GB')
  }

  // Snapshot for preview — quotes do NOT clear the order or deduct stock
  quotedItems.value = [...invItems.value]
  addQuoteToStore({
    quoteNo:    quoteNo.value,
    date:       quoteDate.value,
    business:   businessName.value || 'My 3D Print Shop',
    customer:   quoteCustomer,
    items:      quoteItems,
    grandTotal: quotedItems.value.reduce((s, i) => s + i.sellingPrice, 0),
    savedAt:    new Date().toISOString(),
    status:     'pending',
  })
  activeView.value = 'quote-preview'
}

function onPrintInvoice(showPaymentDetails: boolean) {
  generateInvoice(invoicedItems.value, businessName.value, customerName.value, invoiceNo.value, invoiceDate.value, showPaymentDetails)
}
</script>

<template>
  <NavBar :active-view="activeView" @navigate="activeView = $event" />

  <main class="app-main">
    <Transition name="fade" mode="out-in">

      <!-- ── Inventory view ── -->
      <div v-if="activeView === 'inventory'" class="setup-layout">
        <div class="panel">
          <InventoryView @settings="activeView = 'materials'" />
        </div>
      </div>

      <!-- ── Invoicing hub ── -->
      <div v-else-if="activeView === 'invoicing'" class="setup-layout">
        <InvoicingHub @navigate="(v) => activeView = v" />
      </div>

      <!-- ── Calculator / order form ── -->
      <div v-else-if="activeView === 'calculator'" class="calc-layout">
        <!-- Left: form panel -->
        <div class="panel">
          <div class="back-bar">
            <button class="back-btn" @click="activeView = 'invoicing'">← Back to Invoicing</button>
          </div>
          <!-- Mode toggle -->
          <div class="mode-toggle">
            <button class="mode-btn" :class="{ active: invoicingMode === 'stock' }" @click="invoicingMode = 'stock'; onClearPart()">📦 From Stock</button>
            <button class="mode-btn" :class="{ active: invoicingMode === 'custom' }" @click="invoicingMode = 'custom'; onClearPart()">✏️ Custom Job</button>
          </div>

          <!-- Stock mode: part selector -->
          <div v-if="invoicingMode === 'stock'">
            <StockJobForm @fill-part="onFillPart" @clear="onClearPart" />
          </div>

          <!-- Custom mode: manual form -->
          <div v-else>
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
              @remove="onRemoveItem"
              @update-qty="onUpdateQty"
              @clear="onCancelOrder"
              @invoice="onInvoice"
              @quote="onQuote"
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
          :items="invoicedItems"
          :business="businessName"
          :customer="customerName"
          :invoice-no="invoiceNo"
          :date="invoiceDate"
          @back="activeView = 'invoicing'"
        />
      </div>

      <!-- ── Quote preview ── -->
      <div v-else-if="activeView === 'quote-preview'" class="invoice-layout">
        <div class="back-bar">
          <button class="back-btn" @click="activeView = 'invoicing'">← Back to Invoicing</button>
        </div>
        <QuotePreview
          :items="quotedItems"
          :business="businessName"
          :customer="customerName"
          :quote-no="quoteNo"
          :date="quoteDate"
          @back="activeView = 'invoicing'"
          @view-quotes="activeView = 'quotes'"
        />
      </div>

      <!-- ── Quote history ── -->
      <div v-else-if="activeView === 'quotes'" class="setup-layout">
        <div class="back-bar">
          <button class="back-btn" @click="activeView = 'invoicing'">← Back to Invoicing</button>
        </div>
        <div class="panel">
          <QuoteHistory />
        </div>
      </div>

      <!-- ── Invoice history ── -->
      <div v-else-if="activeView === 'invoices'" class="setup-layout">
        <div class="back-bar">
          <button class="back-btn" @click="activeView = 'invoicing'">← Back to Invoicing</button>
        </div>
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

<style scoped>
.back-bar {
  margin-bottom: 14px;
}

.back-btn {
  padding: 7px 16px;
  background: transparent;
  border: 1px solid #1a3a5c;
  border-radius: 8px;
  color: #7090b0;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.back-btn:hover {
  background: #1a3a5c;
  color: #c0c8d8;
}

.mode-toggle {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.mode-btn {
  flex: 1;
  padding: 8px 12px;
  background: #0a1628;
  border: 1px solid #1a3a5c;
  border-radius: 8px;
  color: #5a7a9a;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}

.mode-btn.active {
  background: #1a3a5c;
  border-color: #4a90d9;
  color: #e0e8f0;
  font-weight: 600;
}
</style>
