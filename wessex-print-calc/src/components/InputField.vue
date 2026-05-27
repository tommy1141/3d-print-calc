<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  id: string
  label?: string
  unit?: string
  type?: string
  placeholder?: string
  min?: number | string
  max?: number | string
  step?: number | string
  hint?: string
}>()

const model = defineModel<number | string | null>()
const isText = computed(() => props.type === 'text')
const hasUnit = computed(() => !!props.unit)

function onInput(e: Event) {
  const raw = (e.target as HTMLInputElement).value
  model.value = isText.value ? raw : (raw === '' ? null : Number(raw))
}
</script>

<template>
  <div class="field-wrapper">
    <label v-if="label" :for="id">{{ label }}</label>
    <div class="input-group" :class="{ 'no-unit': !hasUnit }">
      <input
        :id="id"
        :type="type ?? 'number'"
        :placeholder="placeholder"
        :min="min"
        :max="max"
        :step="step"
        :value="model"
        @input="onInput"
      />
      <span v-if="hasUnit" class="unit">{{ unit }}</span>
    </div>
    <p v-if="hint" class="hint">{{ hint }}</p>
  </div>
</template>

<style scoped>
.field-wrapper {
  margin-bottom: 20px;
}

.field-wrapper:has(.hint) {
  margin-bottom: 0;
}

.input-group {
  position: relative;
}

.input-group input {
  width: 100%;
  padding: 12px 48px 12px 16px;
  background: #0f3460;
  border: 1px solid #1a4a7a;
  border-radius: 8px;
  color: #ffffff;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s;
}

.input-group.no-unit input {
  padding-right: 16px;
}

.input-group input:focus {
  border-color: #e94560;
}

.unit {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #a0a0b0;
  font-size: 0.85rem;
  pointer-events: none;
}
</style>
