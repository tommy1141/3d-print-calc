<script setup lang="ts">
import { ref } from 'vue'
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
import type { NavView } from '@/types'

const activeView = ref<NavView>('calculator')

const {
  printGrams, printHours, printMins, jobDesc, labourMins,
  wattage, ratePerKwh, labourRate, margin,
  showResult, showError, result, pendingItem,
  calculate, resetJobFields,
} = useCalculator()

const businessName = ref('')
const customerName = ref('')

const { invItems, listTotal, addItem, removeItem, clearAll } = useOrderList()
const { generateInvoice } = useInvoice()

const invoiceNo   = ref('')
const invoiceDate = ref('')

function addToOrder() {
  if (!pendingItem.value) return
  addItem(pendingItem.value)
  resetJobFields()
}

function onInvoice() {
  if (invItems.value.length === 0) {
    alert('Please add at least one item to the order first.')
    return
  }
  invoiceNo.value   = 'INV-' + Date.now().toString().slice(-6)
  invoiceDate.value = new Date().toLocaleDateString('en-GB')
  activeView.value  = 'invoice'
}

function onPrintInvoice() {
  generateInvoice(invItems.value, businessName.value, customerName.value)
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
            v-model:customerName="customerName"
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

    </Transition>
  </main>
</template>
