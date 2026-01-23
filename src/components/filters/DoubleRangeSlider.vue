<template>
  <div class="double-range-slider">
    <div class="slider-track-wrapper">
      <div class="slider-track" :style="trackStyle"></div>
      <input
        type="range"
        :min="min"
        :max="max"
        :step="step"
        :value="minValue"
        @input="handleMinInput"
        class="slider-input slider-min"
        :style="{ zIndex: minValue >= maxValue ? 3 : 1 }"
      />
      <input
        type="range"
        :min="min"
        :max="max"
        :step="step"
        :value="maxValue"
        @input="handleMaxInput"
        class="slider-input slider-max"
        :style="{ zIndex: minValue >= maxValue ? 2 : 3 }"
      />
    </div>
    <div class="slider-values">
      <input
        type="number"
        :value="minValue"
        @input="handleMinNumberInput"
        :min="min"
        :max="max"
        placeholder="Min"
        class="numeric-input small"
      />
      <span class="numeric-separator">to</span>
      <input
        type="number"
        :value="maxValue"
        @input="handleMaxNumberInput"
        :min="min"
        :max="max"
        placeholder="Max"
        class="numeric-input small"
      />
      <button 
        v-if="hasValue"
        @click="clear"
        class="clear-numeric"
      >
        <X :size="12" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { X } from 'lucide-vue-next'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({ min: null, max: null })
  },
  min: {
    type: Number,
    required: true
  },
  max: {
    type: Number,
    required: true
  },
  step: {
    type: Number,
    default: 1
  }
})

const emit = defineEmits(['update:modelValue'])

const minValue = ref(props.modelValue.min ?? props.min)
const maxValue = ref(props.modelValue.max ?? props.max)

watch(() => props.modelValue, (newVal) => {
  minValue.value = newVal.min ?? props.min
  maxValue.value = newVal.max ?? props.max
}, { deep: true })

const hasValue = computed(() => {
  return (minValue.value !== props.min) || (maxValue.value !== props.max)
})

const trackStyle = computed(() => {
  const minPercent = ((minValue.value - props.min) / (props.max - props.min)) * 100
  const maxPercent = ((maxValue.value - props.min) / (props.max - props.min)) * 100
  return {
    left: `${minPercent}%`,
    width: `${maxPercent - minPercent}%`
  }
})

const handleMinInput = (e) => {
  const value = parseFloat(e.target.value)
  let newMin = value
  if (newMin >= maxValue.value) {
    newMin = Math.max(props.min, maxValue.value - props.step)
  }
  minValue.value = newMin
  emit('update:modelValue', { 
    min: newMin === props.min ? null : newMin, 
    max: props.modelValue.max ?? null 
  })
}

const handleMaxInput = (e) => {
  const value = parseFloat(e.target.value)
  let newMax = value
  if (newMax <= minValue.value) {
    newMax = Math.min(props.max, minValue.value + props.step)
  }
  maxValue.value = newMax
  emit('update:modelValue', { 
    min: props.modelValue.min ?? null, 
    max: newMax === props.max ? null : newMax 
  })
}

const handleMinNumberInput = (e) => {
  const value = parseFloat(e.target.value)
  if (isNaN(value)) {
    minValue.value = props.min
    emit('update:modelValue', { min: null, max: props.modelValue.max ?? null })
    return
  }
  const newMin = Math.max(props.min, Math.min(value, maxValue.value))
  minValue.value = newMin
  emit('update:modelValue', { 
    min: newMin === props.min ? null : newMin, 
    max: props.modelValue.max ?? null 
  })
}

const handleMaxNumberInput = (e) => {
  const value = parseFloat(e.target.value)
  if (isNaN(value)) {
    maxValue.value = props.max
    emit('update:modelValue', { min: props.modelValue.min ?? null, max: null })
    return
  }
  const newMax = Math.min(props.max, Math.max(value, minValue.value))
  maxValue.value = newMax
  emit('update:modelValue', { 
    min: props.modelValue.min ?? null, 
    max: newMax === props.max ? null : newMax 
  })
}

const clear = () => {
  minValue.value = props.min
  maxValue.value = props.max
  emit('update:modelValue', { min: null, max: null })
}
</script>

<style scoped>
.double-range-slider {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.slider-track-wrapper {
  position: relative;
  height: var(--size-slider-track);
  margin: 1.5rem 0;
  padding: 10px 0;
  overflow: visible !important;
  scrollbar-width: none !important;
}

.slider-track-wrapper::-webkit-scrollbar {
  display: none !important;
  width: 0 !important;
  height: 0 !important;
}

.slider-track {
  position: absolute;
  top: 10px;
  height: var(--size-slider-track);
  background: var(--accent-green);
  border-radius: var(--radius-sm);
  pointer-events: none;
  transition: left 0.15s cubic-bezier(0.4, 0, 0.2, 1), width 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}

.slider-input {
  position: absolute;
  top: 10px;
  left: 0;
  width: 100%;
  height: var(--size-slider-track);
  margin: 0;
  padding: 0;
  background: transparent;
  -webkit-appearance: none;
  appearance: none;
  pointer-events: none;
  overflow: visible !important;
  scrollbar-width: none !important;
  touch-action: none !important;
}

.slider-input::-webkit-scrollbar {
  display: none !important;
  width: 0 !important;
  height: 0 !important;
}

.slider-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: var(--radius-circle);
  background: var(--accent-green);
  cursor: pointer;
  border: var(--size-thumb-border) solid var(--bg-card);
  box-shadow: var(--shadow-sm), 0 0 0 var(--size-thumb-border) var(--accent-green-opacity-20);
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: all !important;
  position: relative;
  touch-action: none !important;
}

.slider-input::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 3px 12px var(--accent-green-opacity-50), 0 0 0 5px var(--accent-green-opacity-20);
}

.slider-input::-webkit-slider-thumb:active {
  transform: scale(1.15);
  box-shadow: 0 2px 10px var(--accent-green-opacity-60), 0 0 0 4px var(--accent-green-opacity-20);
}

.slider-input::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: var(--radius-circle);
  background: var(--accent-green);
  cursor: pointer;
  border: var(--size-thumb-border) solid var(--bg-card);
  box-shadow: var(--shadow-sm), 0 0 0 var(--size-thumb-border) var(--accent-green-opacity-20);
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: all !important;
  touch-action: none !important;
}

.slider-input::-moz-range-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 3px 12px var(--accent-green-opacity-50), 0 0 0 5px var(--accent-green-opacity-20);
}

.slider-input::-moz-range-thumb:active {
  transform: scale(1.15);
  box-shadow: 0 2px 10px var(--accent-green-opacity-60), 0 0 0 4px var(--accent-green-opacity-20);
}

.slider-input::-moz-range-track {
  background: transparent;
}

.slider-values {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  flex-wrap: wrap;
  justify-content: space-between;
}

.numeric-input.small {
  flex: 0 0 120px;
  padding: 0.5625rem 0.75rem;
  font-size: var(--font-size-base);
  text-align: center;
  font-weight: 500;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  transition: all var(--duration-fast) var(--easing-standard);
}

.numeric-input.small:focus {
  outline: none;
  border-color: var(--accent-green);
  box-shadow: var(--shadow-focus);
}

.numeric-input.small::placeholder {
  color: var(--text-tertiary);
}

.numeric-separator {
  font-size: var(--font-size-base);
  color: var(--text-secondary);
  font-weight: 500;
  flex-shrink: 0;
  padding: 0 0.5rem;
  text-transform: lowercase;
}

.clear-numeric {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--size-input-height);
  height: var(--size-input-height);
  padding: 0;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--duration-fast) var(--easing-standard);
  flex-shrink: 0;
  margin-left: auto;
}

.clear-numeric:hover {
  background: var(--bg-surface);
  border-color: var(--accent-green);
  color: var(--accent-green);
}
</style>
