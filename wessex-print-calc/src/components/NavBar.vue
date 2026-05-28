<script setup lang="ts">
import { ref } from 'vue'
import type { NavView } from '@/types'

defineProps<{ activeView: NavView }>()

const emit = defineEmits<{ navigate: [view: NavView] }>()

const mobileOpen = ref(false)

function go(view: NavView) {
  emit('navigate', view)
  mobileOpen.value = false
}
</script>

<template>
  <header class="app-header">
    <div class="app-header-inner">
      <div class="nav-brand">
        <span class="nav-brand-icon">🖨️</span>
        3D Print Calc
      </div>

      <!-- Desktop inline tabs -->
      <nav class="nav-links">
        <button
          class="nav-tab"
          :class="{ active: activeView === 'inventory' }"
          @click="go('inventory')"
        >
          📦 Inventory
        </button>
        <button
          class="nav-tab"
          :class="{ active: activeView === 'materials' }"
          @click="go('materials')"
        >
          🧵 Materials
        </button>
        <button
          class="nav-tab"
          :class="{ active: activeView === 'calculator' }"
          @click="go('calculator')"
        >
          🧾 Invoicing
        </button>
        <button
          class="nav-tab"
          :class="{ active: activeView === 'invoices' }"
          @click="go('invoices')"
        >
          📊 Invoices
        </button>
        <button
          class="nav-tab"
          :class="{ active: activeView === 'stats' }"
          @click="go('stats')"
        >
          📈 Stats
        </button>
        <button
          class="nav-tab nav-tab--right"
          :class="{ active: activeView === 'setup' }"
          @click="go('setup')"
        >
          ⚙️ Company Setup
        </button>
      </nav>

      <!-- Mobile burger -->
      <button
        class="burger"
        :class="{ open: mobileOpen }"
        @click="mobileOpen = !mobileOpen"
        aria-label="Toggle menu"
      >
        <span class="bar" />
        <span class="bar" />
        <span class="bar" />
      </button>

      <!-- Mobile backdrop + dropdown -->
      <div v-if="mobileOpen" class="backdrop" @click="mobileOpen = false" />
      <Transition name="slide-down">
        <nav v-if="mobileOpen" class="nav-dropdown">
          <button
            class="nav-tab"
            :class="{ active: activeView === 'inventory' }"
            @click="go('inventory')"
          >
            📦 Inventory
          </button>
          <button
            class="nav-tab"
            :class="{ active: activeView === 'materials' }"
            @click="go('materials')"
          >
            🧵 Materials
          </button>
          <button
            class="nav-tab"
            :class="{ active: activeView === 'calculator' }"
            @click="go('calculator')"
          >
            🧾 Invoicing
          </button>
          <button
            class="nav-tab"
            :class="{ active: activeView === 'invoices' }"
            @click="go('invoices')"
          >
            📊 Invoices
          </button>
          <button
            class="nav-tab"
            :class="{ active: activeView === 'stats' }"
            @click="go('stats')"
          >
            📈 Stats
          </button>
          <button
            class="nav-tab"
            :class="{ active: activeView === 'setup' }"
            @click="go('setup')"
          >
            ⚙️ Company Setup
          </button>
        </nav>
      </Transition>
    </div>
  </header>
</template>
