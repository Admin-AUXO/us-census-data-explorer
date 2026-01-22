<template>
  <div class="multiselect-list">
    <div class="multiselect-actions-top">
      <button 
        v-if="availableItems.length > 0"
        @click="selectAll"
        class="action-btn select-all-btn"
        type="button"
      >
        Select All
      </button>
      <button 
        v-if="selectedItems.length > 0"
        @click="deselectAll"
        class="action-btn clear-btn"
        type="button"
      >
        Remove All
      </button>
    </div>
    
    <div class="multiselect-search">
      <Search :size="16" />
      <input
        type="text"
        v-model="searchQuery"
        placeholder="Search..."
        class="search-input"
      />
      <button 
        v-if="searchQuery"
        @click="searchQuery = ''"
        class="clear-search-btn"
      >
        <X :size="14" />
      </button>
    </div>
    
    <div class="multiselect-columns">
      <div class="column available-column">
        <button 
          @click.stop="availableCollapsed = !availableCollapsed"
          class="column-header"
        >
          <span class="column-title">Available</span>
          <span class="column-count">({{ availableItems.length }})</span>
          <ChevronDown 
            :size="16" 
            class="collapse-icon"
            :class="{ collapsed: availableCollapsed }"
          />
        </button>
        <Transition name="collapse">
          <div v-show="!availableCollapsed" class="column-list">
            <TransitionGroup name="list" tag="div" class="list-container">
              <div
                v-for="item in availableItems"
                :key="item"
                class="list-item"
                :class="{ 'item-animating': animatingItem === item }"
              >
                <span>{{ item }}</span>
                <button
                  @click.stop="selectItem(item)"
                  class="item-action-btn"
                  title="Select"
                  type="button"
                  :disabled="animatingItem === item"
                >
                  <ChevronRight :size="14" />
                </button>
              </div>
            </TransitionGroup>
            <Transition name="fade">
              <div v-if="availableItems.length === 0" class="empty-message">
                All items selected
              </div>
            </Transition>
          </div>
        </Transition>
      </div>
      
      <div class="column selected-column">
        <button 
          @click.stop="selectedCollapsed = !selectedCollapsed"
          class="column-header"
        >
          <span class="column-title">Selected</span>
          <span class="column-count">({{ selectedItems.length }})</span>
          <ChevronDown 
            :size="16" 
            class="collapse-icon"
            :class="{ collapsed: selectedCollapsed }"
          />
        </button>
        <Transition name="collapse">
          <div v-show="!selectedCollapsed" class="column-list">
            <TransitionGroup name="list" tag="div" class="list-container">
              <div
                v-for="item in selectedItems"
                :key="item"
                class="list-item selected"
                :class="{ 'item-animating': animatingItem === item }"
              >
                <span>{{ item }}</span>
                <button
                  @click.stop="deselectItem(item)"
                  class="item-action-btn"
                  title="Remove"
                  type="button"
                  :disabled="animatingItem === item"
                >
                  <X :size="14" />
                </button>
              </div>
            </TransitionGroup>
            <Transition name="fade">
              <div v-if="selectedItems.length === 0" class="empty-message">
                No items selected
              </div>
            </Transition>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, nextTick } from 'vue'
import { Search, X, ChevronRight, ChevronDown } from 'lucide-vue-next'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  items: {
    type: Array,
    required: true
  },
  searchPlaceholder: {
    type: String,
    default: 'Search...'
  }
})

const emit = defineEmits(['update:modelValue'])

const searchQuery = ref('')
const availableCollapsed = ref(false)
const selectedCollapsed = ref(false)
const animatingItem = ref(null)

const filteredItems = computed(() => {
  if (!searchQuery.value) return props.items
  const query = searchQuery.value.toLowerCase()
  return props.items.filter(item => 
    item.toLowerCase().includes(query)
  )
})

const selectedItems = computed(() => {
  const value = props.modelValue
  if (!Array.isArray(value)) return []
  return [...value]
})

const availableItems = computed(() => {
  const selected = selectedItems.value
  return filteredItems.value.filter(item => !selected.includes(item))
})

watch(() => props.modelValue, () => {
}, { deep: true, immediate: true })

watch(() => props.items, () => {
}, { deep: true, immediate: true })

const selectItem = (item) => {
  const current = Array.isArray(props.modelValue) ? [...props.modelValue] : []
  if (current.includes(item)) return
  
  animatingItem.value = item
  const newSelected = [...current, item]
  emit('update:modelValue', newSelected)
  
  if (selectedCollapsed.value) {
    selectedCollapsed.value = false
  }
  
  nextTick(() => {
    setTimeout(() => {
      animatingItem.value = null
    }, 200)
  })
}

const deselectItem = (item) => {
  const current = Array.isArray(props.modelValue) ? [...props.modelValue] : []
  if (!current.includes(item)) return
  
  animatingItem.value = item
  const newSelected = current.filter(i => i !== item)
  emit('update:modelValue', newSelected)
  
  if (availableCollapsed.value) {
    availableCollapsed.value = false
  }
  
  nextTick(() => {
    setTimeout(() => {
      animatingItem.value = null
    }, 200)
  })
}

const selectAll = () => {
  const current = Array.isArray(props.modelValue) ? [...props.modelValue] : []
  const allItems = new Set([...current, ...filteredItems.value])
  emit('update:modelValue', [...allItems])
  
  if (selectedCollapsed.value) {
    selectedCollapsed.value = false
  }
}

const deselectAll = () => {
  emit('update:modelValue', [])
  
  if (availableCollapsed.value) {
    availableCollapsed.value = false
  }
}
</script>

<style scoped>
.multiselect-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.multiselect-search {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  transition: all var(--duration-fast) var(--easing-standard);
}

.multiselect-search:focus-within {
  border-color: var(--accent-green);
  box-shadow: 0 0 0 3px rgba(163, 230, 53, 0.1);
  background: var(--bg-surface);
}

.multiselect-search svg {
  color: var(--text-tertiary);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text-primary);
  font-size: var(--font-size-base);
  padding: 0;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
}

.search-input::placeholder {
  color: var(--text-tertiary);
}

.clear-search-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  padding: 0;
  background: transparent;
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  transition: all var(--duration-fast) var(--easing-standard);
  border-radius: var(--radius-sm);
}

.clear-search-btn:hover {
  background: var(--bg-card);
  color: var(--text-primary);
}

.multiselect-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  min-height: 200px;
}

.column {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--bg-elevated);
  overflow: hidden;
}

.column-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.625rem 0.875rem;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-color);
  border: none;
  width: 100%;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.column-header:hover {
  background: var(--bg-elevated);
  transform: translateY(-1px);
}

.collapse-icon {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  color: var(--text-secondary);
  flex-shrink: 0;
}

.collapse-icon.collapsed {
  transform: rotate(-90deg);
}

.column-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.column-count {
  font-size: 0.75rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.column-list {
  flex: 1 !important;
  overflow-y: auto !important;
  overflow-x: hidden !important;
  padding: 0.5rem !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 0.375rem !important;
  min-height: 160px !important;
  max-height: 400px !important;
  position: relative !important;
}

.list-container {
  display: flex !important;
  flex-direction: column !important;
  gap: 0.375rem !important;
  width: 100% !important;
  position: relative !important;
  min-height: 0 !important;
}

.column-list::-webkit-scrollbar {
  width: var(--size-scrollbar-small);
}

.column-list::-webkit-scrollbar-track {
  background: transparent;
}

.column-list::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: var(--radius-sm);
}

.column-list::-webkit-scrollbar-thumb:hover {
  background: var(--accent-green-opacity-30);
}

.list-item {
  display: flex !important;
  align-items: center !important;
  gap: 0.5rem !important;
  padding: 0.625rem 0.75rem !important;
  background: var(--bg-card) !important;
  border: 1px solid var(--border-color) !important;
  border-radius: var(--radius-sm) !important;
  color: var(--text-primary) !important;
  font-size: 0.8125rem !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  text-align: left !important;
  width: 100% !important;
  position: relative !important;
  will-change: transform, opacity, background-color !important;
}

.list-item.selected {
  background: var(--accent-green-opacity-10) !important;
  border-color: var(--accent-green) !important;
  color: var(--accent-green) !important;
}

.list-item:hover {
  background: var(--bg-elevated) !important;
  border-color: var(--border-color) !important;
  transform: translateX(3px) scale(1.01) !important;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1) !important;
}

.list-item.selected:hover {
  background: var(--accent-green-opacity-15) !important;
  border-color: var(--accent-green) !important;
  transform: translateX(3px) scale(1.01) !important;
  box-shadow: var(--shadow-accent-md) !important;
}

.list-item span {
  flex: 1;
  text-align: left;
}

.item-action-btn {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 1.75rem !important;
  height: 1.75rem !important;
  padding: 0 !important;
  background: var(--bg-elevated) !important;
  border: 1px solid var(--border-color) !important;
  border-radius: var(--radius-sm) !important;
  color: var(--text-secondary) !important;
  cursor: pointer !important;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
  flex-shrink: 0 !important;
  will-change: transform, background-color !important;
}

.item-action-btn:hover:not(:disabled) {
  background: var(--accent-green) !important;
  border-color: var(--accent-green) !important;
  color: var(--bg-card) !important;
  transform: scale(1.2) rotate(5deg) !important;
  box-shadow: var(--shadow-accent-lg) !important;
}

.item-action-btn:active:not(:disabled) {
  transform: scale(1.1) rotate(3deg) !important;
  transition: all 0.1s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

.item-action-btn:disabled {
  opacity: 0.5 !important;
  cursor: not-allowed !important;
  pointer-events: none !important;
}

.list-item.selected .item-action-btn:hover:not(:disabled) {
  background: var(--color-error) !important;
  border-color: var(--color-error) !important;
  color: white !important;
  transform: scale(1.2) rotate(-5deg) !important;
  box-shadow: var(--shadow-error-lg) !important;
}

.empty-message {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  color: var(--text-tertiary);
  font-size: var(--font-size-base);
  text-align: center;
}

.multiselect-actions-top {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.multiselect-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.action-btn {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 0.375rem !important;
  padding: 0.5rem 0.875rem !important;
  background: var(--bg-card) !important;
  border: 1px solid var(--border-color) !important;
  border-radius: var(--radius-sm) !important;
  color: var(--text-secondary) !important;
  font-size: 0.75rem !important;
  font-weight: 600 !important;
  cursor: pointer !important;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
  width: 100% !important;
  will-change: transform !important;
}

.select-all-btn {
  color: var(--accent-green);
}

.select-all-btn:hover {
  background: var(--bg-elevated) !important;
  border-color: var(--accent-green) !important;
  transform: translateY(-2px) !important;
  box-shadow: 0 4px 8px rgba(163, 230, 53, 0.2) !important;
}

.select-all-btn:active {
  transform: translateY(0) !important;
  transition: all 0.1s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

.clear-btn:hover {
  background: var(--bg-elevated) !important;
  border-color: var(--color-error) !important;
  color: var(--color-error) !important;
  transform: translateY(-2px) !important;
  box-shadow: var(--shadow-error-md) !important;
}

.clear-btn:active {
  transform: translateY(0) !important;
  transition: all 0.1s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

.multiselect-actions {
  display: none;
}

.collapse-enter-active {
  transition: max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important, 
              opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important, 
              padding 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
  overflow: hidden !important;
}

.collapse-leave-active {
  transition: max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important, 
              opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important, 
              padding 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  overflow: hidden !important;
}

.collapse-enter-from,
.collapse-leave-to {
  max-height: 0 !important;
  opacity: 0 !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
}

.collapse-enter-to,
.collapse-leave-from {
  max-height: 400px !important;
  opacity: 1 !important;
}

.list-enter-active {
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1) !important;
  z-index: 1 !important;
}

.list-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  position: absolute !important;
  width: 100% !important;
  z-index: 0 !important;
}

.list-enter-from {
  opacity: 0 !important;
  transform: translateX(-30px) scale(0.9) !important;
}

.list-enter-to {
  opacity: 1 !important;
  transform: translateX(0) scale(1) !important;
}

.list-leave-from {
  opacity: 1 !important;
  transform: translateX(0) scale(1) !important;
}

.list-leave-to {
  opacity: 0 !important;
  transform: translateX(30px) scale(0.9) !important;
}

.list-move {
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1) !important;
  will-change: transform !important;
  transform: translateZ(0) !important;
}

.list-item {
  will-change: transform, opacity;
}

.list-enter-active,
.list-leave-active {
  will-change: transform, opacity;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0 !important;
}
</style>
