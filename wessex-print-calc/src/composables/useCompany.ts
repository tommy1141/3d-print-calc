import { ref, watch } from 'vue'

const address       = ref(localStorage.getItem('company-address')        ?? '')
const email         = ref(localStorage.getItem('company-email')          ?? '')
const phone         = ref(localStorage.getItem('company-phone')          ?? '')
const bankName      = ref(sessionStorage.getItem('company-bank-name')      ?? '')
const accountName   = ref(sessionStorage.getItem('company-account-name')   ?? '')
const sortCode      = ref(sessionStorage.getItem('company-sort-code')      ?? '')
const accountNumber = ref(sessionStorage.getItem('company-account-number') ?? '')

watch(address,       val => localStorage.setItem('company-address',        val))
watch(email,         val => localStorage.setItem('company-email',          val))
watch(phone,         val => localStorage.setItem('company-phone',          val))
watch(bankName,      val => sessionStorage.setItem('company-bank-name',      val))
watch(accountName,   val => sessionStorage.setItem('company-account-name',   val))
watch(sortCode,      val => sessionStorage.setItem('company-sort-code',      val))
watch(accountNumber, val => sessionStorage.setItem('company-account-number', val))

export function useCompany() {
  return { address, email, phone, bankName, accountName, sortCode, accountNumber }
}
