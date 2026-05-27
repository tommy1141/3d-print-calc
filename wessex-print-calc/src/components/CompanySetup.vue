<script setup lang="ts">
import InputField from '@/components/InputField.vue'
import { useCompany } from '@/composables/useCompany'

const wattage      = defineModel<number | null>('wattage')
const ratePerKwh   = defineModel<number | null>('ratePerKwh')
const labourRate   = defineModel<number | null>('labourRate')
const margin       = defineModel<number | null>('margin')
const businessName = defineModel<string>('businessName')

const company = useCompany()
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
        <InputField
          id="businessName"
          label="Business / trading name"
          type="text"
          placeholder="e.g. Wessex Prints"
          v-model="businessName"
        />
        <div class="field-wrapper">
          <label for="businessAddress">Address</label>
          <textarea
            id="businessAddress"
            class="address-input"
            placeholder="123 Main Street&#10;Bournemouth&#10;BH1 1AA"
            rows="3"
            v-model="company.address"
          />
        </div>
        <div class="contact-row">
          <InputField
            id="businessEmail"
            label="Email"
            type="text"
            placeholder="e.g. info@myshop.com"
            v-model="company.email"
          />
          <InputField
            id="businessPhone"
            label="Phone"
            type="text"
            placeholder="e.g. 01202 123456"
            v-model="company.phone"
          />
        </div>
        <hr class="divider" />
        <p class="section-title">Bank / Payment Details</p>
        <div class="contact-row">
          <InputField
            id="bankName"
            label="Bank name"
            type="text"
            placeholder="e.g. Barclays"
            v-model="company.bankName"
          />
          <InputField
            id="accountName"
            label="Account name"
            type="text"
            placeholder="e.g. John Smith"
            v-model="company.accountName"
          />
        </div>
        <div class="contact-row">
          <InputField
            id="sortCode"
            label="Sort code"
            type="text"
            placeholder="e.g. 12-34-56"
            v-model="company.sortCode"
          />
          <InputField
            id="accountNumber"
            label="Account number"
            type="text"
            placeholder="e.g. 12345678"
            v-model="company.accountNumber"
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

.field-wrapper {
  margin-bottom: 20px;
}

.field-wrapper label {
  display: block;
  font-size: 0.82rem;
  font-weight: 500;
  margin-bottom: 6px;
  color: var(--color-text, #e0e0f0);
}

.address-input {
  width: 100%;
  padding: 9px 12px;
  border: 1px solid #2a4a7a;
  border-radius: 6px;
  background: #0d1b2a;
  color: #e0e0f0;
  font-size: 0.9rem;
  font-family: inherit;
  resize: vertical;
  min-height: 72px;
  box-sizing: border-box;
}

.address-input::placeholder {
  color: #506080;
}

.address-input:focus {
  outline: none;
  border-color: #4a90d9;
}

.contact-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 1rem;
}

@media (max-width: 480px) {
  .contact-row {
    grid-template-columns: 1fr;
  }
}
</style>
