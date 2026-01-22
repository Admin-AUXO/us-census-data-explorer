<template>
  <header class="header">
    <div class="container">
      <div class="header-content">
        <div class="header-left">
          <div class="logo-section">
            <AuxoLogo size="normal" />
            <span class="separator-pipe">|</span>
            <div class="title-text">
              <p class="subtitle">USA Census Data Explorer</p>
            </div>
          </div>
          <div class="breadcrumb-section">
            <button
              v-if="store.currentLevel !== 'state'"
              class="back-button"
              @click="store.goBack()"
              aria-label="Go back to previous level"
            >
              <ChevronLeft :size="16" />
              <span>Back</span>
            </button>
            <div class="breadcrumb-trail">
              <button
                class="breadcrumb-item root"
                @click="store.reset()"
                :class="{ active: store.currentLevel === 'state' }"
              >
                <Globe :size="14" />
                <span>United States</span>
              </button>
              <ChevronRight v-if="store.currentState" :size="12" class="separator" />
              <button
                v-if="store.currentState"
                class="breadcrumb-item"
                @click="navigateToState"
                :class="{ active: store.currentLevel === 'county' }"
              >
                <MapPin :size="14" />
                <span>{{ store.currentState }}</span>
              </button>
              <ChevronRight v-if="store.currentCounty" :size="12" class="separator" />
              <button
                v-if="store.currentCounty"
                class="breadcrumb-item"
                :class="{ active: store.currentLevel === 'zcta5' }"
                disabled
              >
                <Building :size="14" />
                <span>{{ store.currentCounty }}</span>
              </button>
            </div>
          </div>
        </div>
        <div class="header-right">
          <div class="level-indicator">
            <div class="indicator-icon">
              <component :is="levelIcon" :size="16" />
            </div>
            <div class="indicator-text">
              <span class="level-label">Current View</span>
              <span class="level-value">{{ levelName }}</span>
            </div>
          </div>
          <div class="header-actions">
            <button 
              class="btn-filters" 
              @click="$emit('toggle-filters')" 
              :class="{ 'has-active-filters': hasActiveFilters }"
              title="Toggle advanced filters" 
              aria-label="Toggle advanced filters"
            >
              <Filter :size="20" />
              <span>Filters</span>
              <span v-if="hasActiveFilters" class="filter-badge">{{ activeFilterCount }}</span>
            </button>
            <button class="btn-help" @click="$emit('show-help')" title="Show help" aria-label="Show help">
              <HelpCircle :size="20" />
              <span>Help</span>
            </button>
          </div>
        </div>
      </div>

      <div class="header-filters">
        <div class="control-group">
          <label for="dataset-select">
            <Database :size="18" />
            Dataset
          </label>
          <select
            id="dataset-select"
            v-model="selectedDataset"
            @change="onDatasetChange"
            aria-label="Select dataset"
          >
            <option value="">Choose a dataset...</option>
            <option
              v-for="dataset in store.manifest?.datasets"
              :key="dataset.source_file"
              :value="dataset.source_file"
            >
              {{ formatDatasetName(dataset.source_file) }}
            </option>
          </select>
        </div>

        <div class="control-group">
          <label for="year-select">
            <Calendar :size="18" />
            Year
          </label>
          <select
            id="year-select"
            v-model="selectedYear"
            @change="onYearChange"
            :disabled="!selectedDataset"
            aria-label="Select year"
          >
            <option value="">Select year...</option>
            <option v-for="year in availableYears" :key="year" :value="year">
              {{ year }}
            </option>
          </select>
        </div>

        <div class="control-group">
          <label for="metric-select">
            <TrendingUp :size="18" />
            Metric
          </label>
          <select
            id="metric-select"
            v-model="selectedMetric"
            @change="onMetricChange"
            :disabled="!selectedYear"
            aria-label="Select metric"
          >
            <option value="">Select metric...</option>
            <option v-for="metric in availableMetrics" :key="metric.value" :value="metric.value">
              {{ metric.label }}
            </option>
          </select>
        </div>

        <div class="control-group">
          <label for="compare-year">
            <GitCompare :size="18" />
            Compare
          </label>
          <select
            id="compare-year"
            :value="store.compareYear || ''"
            @change="handleCompareYearChange"
            :disabled="!selectedMetric"
            aria-label="Compare with year"
          >
            <option value="">Auto (Previous Year)</option>
            <option v-for="year in compareYears" :key="year" :value="year">
              {{ year }}
            </option>
          </select>
        </div>

        <div class="control-group search-wrapper">
          <label for="search-input">
            <Search :size="18" />
            Search
          </label>
          <div class="search-input-wrapper">
            <input
              type="text"
              id="search-input"
              v-model="store.searchQuery"
              placeholder="Type to filter locations..."
              :disabled="!selectedMetric"
              aria-label="Search locations"
            />
            <button
              v-if="store.searchQuery"
              class="clear-search"
              @click="store.searchQuery = ''"
              aria-label="Clear search"
            >
              <X :size="16" />
            </button>
          </div>
        </div>
      </div>
      <div v-if="store.isLoading" class="loading-bar">
        <div class="loading-progress"></div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useCensusStore } from '../stores/census'
import { Database, Calendar, TrendingUp, GitCompare, Search, X, HelpCircle, ChevronLeft, ChevronRight, Globe, MapPin, Building, Map, Layers, Filter } from 'lucide-vue-next'
import AuxoLogo from './AuxoLogo.vue'

const store = useCensusStore()
const selectedDataset = ref('')
const selectedYear = ref('')
const selectedMetric = ref('')

const formatDatasetName = (filename) => {
  return filename
    .replace('.csv', '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
}

const availableYears = computed(() => {
  if (!store.data.state || store.data.state.length === 0) return []

  const columns = Object.keys(store.data.state[0])
  const yearMatches = columns
    .map(col => col.match(/_(\d{4})$/))
    .filter(match => match)
    .map(match => match[1])

  return [...new Set(yearMatches)].sort().reverse()
})

const availableMetrics = computed(() => {
  if (!store.data.state || !selectedYear.value) return []

  const columns = Object.keys(store.data.state[0])
  const metrics = columns
    .filter(col => col.endsWith(`_${selectedYear.value}`))
    .map(col => {
      const base = col.replace(/_(\d{4})$/, '')
      return {
        value: col,
        label: base.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      }
    })

  return metrics
})

const compareYears = computed(() => {
  if (!selectedMetric.value) return []

  const baseMetric = selectedMetric.value.replace(/_(\d{4})$/, '')
  const currentYear = selectedMetric.value.match(/_(\d{4})$/)?.[1]

  return availableYears.value.filter(year => year !== currentYear)
})

watch(() => store.manifest, (manifest) => {
  if (manifest?.datasets && manifest.datasets.length > 0 && !selectedDataset.value && !store.currentDataset) {
    const firstDataset = manifest.datasets[0].source_file
    selectedDataset.value = firstDataset
    onDatasetChange()
  }
}, { immediate: true })

watch(() => selectedMetric.value, () => {
  if (selectedMetric.value && !store.compareYear) {
    store.setAutoCompareYear()
  }
})

watch(() => store.compareYear, (newVal) => {
  if (newVal === '' || newVal === null) {
    store.setAutoCompareYear()
  }
})

const onDatasetChange = async () => {
  if (!selectedDataset.value) {
    store.currentDataset = null
    store.data.state = null
    store.data.county = null
    store.data.zcta5 = null
    selectedYear.value = ''
    selectedMetric.value = ''
    store.currentYear = null
    store.currentMetric = null
    return
  }

  try {
    await store.loadDataset(selectedDataset.value)
    store.currentDataset = selectedDataset.value

    if (availableYears.value.length > 0) {
      selectedYear.value = availableYears.value[0]
      onYearChange()
    }
  } catch (error) {
    console.error('Failed to load dataset:', error)
  }
}

const onYearChange = () => {
  store.currentYear = selectedYear.value
  selectedMetric.value = ''
  store.currentMetric = null
  store.setAutoCompareYear()

  if (availableMetrics.value.length > 0) {
    selectedMetric.value = availableMetrics.value[0].value
    onMetricChange()
  }
}

const onMetricChange = () => {
  store.currentMetric = selectedMetric.value
  if (!store.compareYear) {
    store.setAutoCompareYear()
  }
  store.savePreferences()
}

const handleCompareYearChange = (event) => {
  const value = event.target.value
  if (value === '') {
    store.compareYear = null
    store.setAutoCompareYear()
  } else {
    store.compareYear = value
  }
}

const levelIcon = computed(() => {
  const icons = {
    state: Map,
    county: Layers,
    zcta5: Building
  }
  return icons[store.currentLevel] || Map
})

const levelName = computed(() => {
  const names = {
    state: 'State Level',
    county: 'County Level',
    zcta5: 'ZIP Code Level'
  }
  return names[store.currentLevel] || 'Unknown'
})

const hasActiveFilters = computed(() => {
  const filters = store.dimensionFilters
  if (!filters) return false
  return filters.selectedStates.length > 0 ||
         filters.selectedRegions.length > 0 ||
         filters.selectedDivisions.length > 0 ||
         filters.selectedCongressionalDistricts.length > 0 ||
         filters.selectedAiannh.length > 0 ||
         filters.selectedUrbanRural.length > 0 ||
         filters.selectedMetroAreas.length > 0 ||
         filters.populationMin !== null ||
         filters.populationMax !== null ||
         filters.areaMin !== null ||
         filters.areaMax !== null ||
         filters.metricValueMin !== null ||
         filters.metricValueMax !== null
})

const activeFilterCount = computed(() => {
  const filters = store.dimensionFilters
  if (!filters) return 0
  let count = filters.selectedStates.length +
              filters.selectedRegions.length +
              filters.selectedDivisions.length +
              filters.selectedCongressionalDistricts.length +
              filters.selectedAiannh.length +
              filters.selectedUrbanRural.length +
              filters.selectedMetroAreas.length
  if (filters.populationMin !== null || filters.populationMax !== null) count++
  if (filters.areaMin !== null || filters.areaMax !== null) count++
  if (filters.metricValueMin !== null || filters.metricValueMax !== null) count++
  return count
})

const navigateToState = () => {
  if (store.currentLevel === 'zcta5') {
    store.goBack()
  }
}

watch(() => store.manifest, (manifest) => {
  if (manifest?.datasets && manifest.datasets.length > 0) {
    const prefs = store.loadPreferences()
    if (prefs && prefs.dataset) {
      const exists = manifest.datasets.some(d => d.source_file === prefs.dataset)
      if (exists && !store.currentDataset) {
        selectedDataset.value = prefs.dataset
        if (prefs.year) selectedYear.value = prefs.year
        if (prefs.metric) selectedMetric.value = prefs.metric
        onDatasetChange()
        return
      }
    }
    
    if (!selectedDataset.value && !store.currentDataset) {
      const firstDataset = manifest.datasets[0].source_file
      selectedDataset.value = firstDataset
      onDatasetChange()
    }
  }
}, { immediate: true })
</script>

<style scoped>
.header {
  background: var(--bg-secondary) !important;
  color: var(--text-primary) !important;
  box-shadow: var(--shadow) !important;
  border-bottom: var(--border-width-sm) solid var(--border-color) !important;
  position: sticky !important;
  top: 0 !important;
  z-index: var(--z-index-sticky) !important;
  width: 100% !important;
  margin: 0 !important;
  padding: 0 !important;
}

.container {
  max-width: var(--size-container-max) !important;
  margin: 0 auto !important;
  padding: var(--spacing-sm) var(--spacing-lg) !important;
  width: 100% !important;
  box-sizing: border-box !important;
}

.header-content {
  display: flex !important;
  justify-content: space-between !important;
  align-items: center !important;
  gap: var(--spacing-sm) !important;
  margin-bottom: var(--spacing-sm) !important;
  width: 100% !important;
  box-sizing: border-box !important;
}

.header-left {
  display: flex !important;
  align-items: center !important;
  gap: var(--spacing-sm) !important;
  flex: 1 !important;
  min-width: 0 !important;
  padding: 0 !important;
  margin: 0 !important;
}

.logo-section {
  display: flex !important;
  align-items: center !important;
  gap: 0 !important;
  padding: 0 !important;
  margin: 0 !important;
}

.logo-section > :deep(.auxo-logo-container) {
  padding: 0 !important;
  margin: 0 !important;
  margin-right: 0 !important;
  padding-right: 0 !important;
}

.separator-pipe {
  color: var(--text-tertiary) !important;
  font-size: 0.875rem !important;
  font-weight: 300 !important;
  margin: 0 !important;
  margin-left: 0.25rem !important;
  margin-right: 0.25rem !important;
  padding: 0 !important;
  line-height: 1 !important;
}

.title-text {
  display: flex !important;
  flex-direction: column !important;
  justify-content: center !important;
  gap: 0 !important;
  padding: 0 !important;
  margin: 0 !important;
}

.subtitle {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--text-secondary);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  line-height: 1.2;
  white-space: nowrap;
}

.breadcrumb-section {
  display: flex !important;
  align-items: center !important;
  gap: var(--spacing-sm) !important;
  min-width: 0 !important;
  padding: 0 !important;
  margin: 0 !important;
}

.header-right {
  display: flex !important;
  align-items: center !important;
  gap: var(--spacing-sm) !important;
  flex-shrink: 0 !important;
  padding: 0 !important;
  margin: 0 !important;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  background: var(--accent-green);
  color: var(--text-on-accent);
  border: none;
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--duration-fast) var(--easing-standard);
  box-shadow: var(--shadow-sm);
  font-size: 0.8125rem;
  white-space: nowrap;
}

.back-button:hover {
  background: var(--accent-green-opacity-85);
  transform: translateX(-2px);
  box-shadow: var(--shadow-md);
}

.breadcrumb-trail {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  flex-wrap: wrap;
  min-width: 0;
}

.breadcrumb-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--duration-fast) var(--easing-standard);
  font-size: 0.8125rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 150px;
}

.breadcrumb-item:not(:disabled):hover {
  background: var(--bg-surface);
  border-color: var(--accent-green);
  color: var(--accent-green);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.breadcrumb-item.root {
  background: var(--accent-green-opacity-15);
  border-color: var(--accent-green);
  color: var(--accent-green);
  font-weight: 600;
}

.breadcrumb-item.active {
  background: var(--accent-green);
  border-color: var(--accent-green);
  color: var(--text-on-accent);
  cursor: default;
}

.breadcrumb-item:disabled {
  background: var(--bg-card);
  color: var(--text-tertiary);
  cursor: default;
}

.separator {
  color: var(--text-tertiary);
  flex-shrink: 0;
}

.level-indicator {
  display: flex !important;
  align-items: center !important;
  gap: var(--spacing-sm) !important;
  padding: var(--spacing-sm) var(--spacing-md) !important;
  background: var(--bg-elevated) !important;
  border: var(--border-width-sm) solid var(--accent-green) !important;
  border-radius: var(--radius-md) !important;
  height: var(--size-button-height-md) !important;
  min-width: 140px !important;
  max-width: 180px !important;
  flex-shrink: 0 !important;
  box-sizing: border-box !important;
}

.indicator-icon {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  flex-shrink: 0 !important;
  width: var(--size-icon-2xl) !important;
  height: var(--size-icon-2xl) !important;
  background: var(--accent-green-opacity-20) !important;
  border-radius: var(--radius-sm) !important;
  color: var(--accent-green) !important;
  box-shadow: var(--shadow-sm) !important;
}

.indicator-text {
  display: flex !important;
  flex-direction: column !important;
  gap: 0 !important;
  min-width: 0 !important;
  flex: 1 !important;
  overflow: hidden !important;
}

.level-label {
  font-size: var(--font-size-xs) !important;
  color: var(--text-secondary) !important;
  font-weight: var(--font-weight-medium) !important;
  text-transform: uppercase !important;
  letter-spacing: var(--letter-spacing-tight) !important;
  line-height: 1 !important;
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
}

.level-value {
  font-size: var(--font-size-base) !important;
  color: var(--accent-green) !important;
  font-weight: var(--font-weight-bold) !important;
  line-height: 1 !important;
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
}

.loading-bar {
  height: 2px;
  background: var(--bg-secondary);
  overflow: hidden;
  margin-top: 0.5rem;
}

.loading-progress {
  height: 100%;
  background: var(--accent-green);
  animation: loading 1.5s ease-in-out infinite;
}

@keyframes loading {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.header-actions {
  display: flex !important;
  gap: var(--spacing-sm) !important;
  align-items: center !important;
}

.btn-filters {
  display: flex !important;
  align-items: center !important;
  gap: var(--spacing-sm) !important;
  padding: var(--spacing-sm) var(--spacing-md) !important;
  background: var(--bg-elevated) !important;
  color: var(--text-primary) !important;
  border: var(--border-width-sm) solid var(--border-color) !important;
  border-radius: var(--radius-md) !important;
  font-weight: var(--font-weight-semibold) !important;
  cursor: pointer !important;
  transition: all var(--duration-fast) var(--easing-standard) !important;
  font-size: var(--font-size-base) !important;
  position: relative !important;
  height: var(--size-button-height-md) !important;
  min-width: 140px !important;
  max-width: 180px !important;
  box-sizing: border-box !important;
  white-space: nowrap !important;
}

.btn-filters:hover {
  background: var(--bg-surface);
  border-color: var(--accent-green);
  color: var(--accent-green);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.btn-filters.has-active-filters {
  border-color: var(--accent-green);
  background: var(--accent-green-opacity-10);
  color: var(--accent-green);
}

.btn-filters .filter-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.25rem;
  height: 1.25rem;
  padding: 0 0.375rem;
  background: var(--accent-green);
  color: var(--bg-card);
  border-radius: var(--radius-full);
  font-size: 0.6875rem;
  font-weight: 700;
  margin-left: 0.25rem;
}

.btn-help {
  display: flex !important;
  align-items: center !important;
  gap: var(--spacing-sm) !important;
  padding: var(--spacing-sm) var(--spacing-md) !important;
  background: var(--bg-elevated) !important;
  color: var(--text-primary) !important;
  border: var(--border-width-sm) solid var(--border-color) !important;
  border-radius: var(--radius-md) !important;
  font-weight: var(--font-weight-semibold) !important;
  cursor: pointer !important;
  transition: all var(--duration-fast) var(--easing-standard) !important;
  font-size: var(--font-size-base) !important;
  height: var(--size-button-height-md) !important;
  box-sizing: border-box !important;
  white-space: nowrap !important;
}

.btn-help:hover {
  background: var(--bg-surface);
  border-color: var(--accent-green);
  color: var(--accent-green);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.header-filters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.875rem;
  background: var(--bg-card);
  padding: 0.875rem;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.control-group label {
  font-weight: 600;
  font-size: 0.75rem;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 0.375rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.control-group label svg {
  color: var(--accent-green);
  flex-shrink: 0;
}

.control-group select,
.control-group input[type="text"] {
  padding: 0.625rem 0.875rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  background: var(--bg-elevated);
  color: var(--text-primary);
  transition: all var(--duration-fast) var(--easing-standard);
  font-weight: 500;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23A3E635' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  background-size: 12px;
  padding-right: 2.5rem;
}

.control-group select:focus,
.control-group input[type="text"]:focus {
  outline: none;
  border-color: var(--accent-green);
  box-shadow: var(--shadow-focus-sm);
  background-color: var(--bg-surface);
}

.control-group select:hover:not(:disabled) {
  border-color: var(--border-color-light);
  background-color: var(--bg-surface);
}

.control-group select:disabled,
.control-group input[type="text"]:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: var(--bg-secondary);
}

.search-input-wrapper {
  position: relative;
}

.search-input-wrapper input {
  width: 100%;
  padding-right: 2.5rem;
}

.search-input-wrapper input::placeholder {
  color: var(--text-tertiary);
  opacity: 0.6;
}

.clear-search {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  color: var(--text-secondary);
  border: none;
  border-radius: var(--radius-sm);
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--duration-fast) var(--easing-standard);
  opacity: 0.7;
}

.clear-search:hover {
  background: var(--bg-surface);
  color: var(--text-primary);
  opacity: 1;
  transform: translateY(-50%) scale(1.1);
}

@media (max-width: 1024px) {
  .header-filters {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  }
}

@media (max-width: 1024px) {
  .header-left {
    flex-wrap: wrap;
  }

  .breadcrumb-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
    width: 100%;
  }

  .header-right {
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .level-indicator {
    min-width: auto;
  }
}

@media (max-width: 768px) {
  .container {
    padding: 0.5rem 1rem;
  }

  .header-content {
    flex-direction: column;
    gap: 0.75rem;
    align-items: stretch;
    margin-bottom: 0.625rem;
  }

  .header-left {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }

  .logo-section {
    width: 100%;
    gap: 0.5rem;
  }

  .separator-pipe {
    display: none;
  }

  .header-right {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
  }

  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .subtitle {
    font-size: 0.75rem;
  }

  .header-filters {
    grid-template-columns: 1fr;
    padding: 0.75rem;
    gap: 0.75rem;
  }

  .breadcrumb-item span {
    max-width: 100px;
  }

  .back-button {
    width: 100%;
    justify-content: center;
  }

  .level-indicator {
    width: 100%;
  }
}
</style>
