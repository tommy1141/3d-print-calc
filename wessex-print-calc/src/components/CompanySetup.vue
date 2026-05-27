<script setup lang="ts">
import InputField from '@/components/InputField.vue'

const wattage      = defineModel<number | null>('wattage')
const ratePerKwh   = defineModel<number | null>('ratePerKwh')
const labourRate   = defineModel<number | null>('labourRate')
const margin       = defineModel<number | null>('margin')
const businessName = defineModel<string>('businessName')
const customerName = defineModel<string>('customerName')
</script>

<template>
  <div>
    <div class="setup-grid">
      <!-- Col 1: printer + labour -->
      <div>
        <p class="section-title">Printer Settings</p>
        <InputField
          id="wattage"
          label="Average power draw"
          unit="W"
          :min="0"
          step="1"
          hint="P1S + AMS average ~300 W during printing"
          v-model="wattage"
        />
        <InputField
          id="ratePerKwh"
          label="Electricity rate"
          unit="£/kWh"
          :min="0"
          step="0.001"
          hint="UK average ~24.5p per kWh"
          v-model="ratePerKwh"
        />
        <hr class="divider" />
        <p class="section-title">Labour Rate</p>
        <InputField
          id="labourRate"
          label="Your hourly rate"
          unit="£/hr"
          :min="0"
          step="0.01"
          hint="Used to calculate labour cost per job"
          v-model="labourRate"
        />
      </div>

      <!-- Col 2: margin -->
      <div>
        <p class="section-title">Profit Margin</p>
        <InputField
          id="margin"
          label="Target margin"
          unit="%"
          :min="0"
          :max="99"
          step="1"
          hint="e.g. 30% means you keep 30% of the sale price as profit"
          v-model="margin"
        />
      </div>

      <!-- Full-width: invoice details -->
      <div class="setup-grid-full">
        <hr class="divider" />
        <p class="section-title">Invoice Details</p>
        <div class="setup-grid">
          <InputField
            id="businessName"
            label="Your business / name"
            type="text"
            placeholder="e.g. Wessex Prints"
            v-model="businessName"
          />
          <InputField
            id="customerName"
            label="Default customer name"
            type="text"
            placeholder="e.g. John Smith"
            v-model="customerName"
          />
        </div>
      </div>
    </div>

    <p class="setup-note">
      These settings persist across all jobs while the app is open.
    </p>
  </div>
</template>

<style scoped>
.setup-note {
  margin-top: 24px;
  color: #607090;
  font-size: 0.78rem;
  text-align: center;
  line-height: 1.5;
}
</style>
