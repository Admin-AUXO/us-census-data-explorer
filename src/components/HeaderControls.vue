<template>
  <header class="header">
    <div class="header-container">
      <div class="header-top">
        <div class="header-brand">
          <AuxoLogo size="normal" />
          <div class="brand-separator"></div>
          <h1 class="app-title">USA Census Data Explorer</h1>
        </div>
        <div class="header-controls">
          <button 
            class="btn-view-level"
            :title="`Current view: ${levelName}`"
          >
            <component :is="levelIcon" :size="18" />
            <span class="view-label">{{ levelName }}</span>
          </button>
          <button 
            class="btn-filters" 
            @click="$emit('toggle-filters')" 
            :class="{ 'active': hasActiveFilters }"
            :title="hasActiveFilters ? `${activeFilterCount} active filters` : 'Toggle filters'"
          >
            <Filter :size="18" />
            <span>Filters</span>
            <span v-if="hasActiveFilters" class="badge">{{ activeFilterCount }}</span>
          </button>
          <button 
            class="btn-help" 
            @click="$emit('show-help')"
            title="Show help"
          >
            <HelpCircle :size="18" />
            <span>Help</span>
          </button>
        </div>
      </div>

      <div class="header-nav">
        <div class="nav-breadcrumbs">
          <button
            v-if="store.currentLevel !== 'state'"
            class="btn-back"
            @click="store.goBack()"
            aria-label="Go back"
          >
            <ChevronLeft :size="16" />
            <span>Back</span>
          </button>
          <nav class="breadcrumb-nav">
            <button
              class="breadcrumb-link"
              :class="{ 'active': store.currentLevel === 'state' }"
              @click="store.reset()"
            >
              <Globe :size="14" />
              <span>United States</span>
            </button>
            <ChevronRight v-if="store.currentState" :size="12" class="breadcrumb-sep" />
            <button
              v-if="store.currentState"
              class="breadcrumb-link"
              :class="{ 'active': store.currentLevel === 'county' }"
              @click="navigateToState"
            >
              <MapPin :size="14" />
              <span>{{ store.currentState }}</span>
            </button>
            <ChevronRight v-if="store.currentCounty" :size="12" class="breadcrumb-sep" />
            <button
              v-if="store.currentCounty"
              class="breadcrumb-link"
              :class="{ 'active': store.currentLevel === 'zcta5' }"
              disabled
            >
              <Building :size="14" />
              <span>{{ store.currentCounty }}</span>
            </button>
          </nav>
        </div>
      </div>

      <div class="header-filters-bar">
        <div class="filter-controls">
          <div class="filter-item">
            <label for="dataset-select">
              <Database :size="16" />
              <span>Dataset</span>
            </label>
            <select
              id="dataset-select"
              v-model="selectedDataset"
              @change="onDatasetChange"
            >
              <option value="">Select dataset...</option>
              <option
                v-for="dataset in store.manifest?.datasets"
                :key="dataset.source_file"
                :value="dataset.source_file"
              >
                {{ formatDatasetName(dataset.source_file) }}
              </option>
            </select>
          </div>

          <div class="filter-item">
            <label for="year-select">
              <Calendar :size="16" />
              <span>Year</span>
            </label>
            <select
              id="year-select"
              v-model="selectedYear"
              @change="onYearChange"
              :disabled="!selectedDataset"
            >
              <option value="">Select year...</option>
              <option
                v-for="year in availableYears"
                :key="year"
                :value="year"
              >
                {{ year }}
              </option>
            </select>
          </div>

          <div class="filter-item">
            <label for="metric-select">
              <TrendingUp :size="16" />
              <span>Metric</span>
            </label>
            <select
              id="metric-select"
              v-model="selectedMetric"
              @change="onMetricChange"
              :disabled="!selectedYear"
            >
              <option value="">Select metric...</option>
              <option
                v-for="metric in availableMetrics"
                :key="metric.value"
                :value="metric.value"
              >
                {{ metric.label }}
              </option>
            </select>
          </div>

          <div class="filter-item">
            <label for="compare-select">
              <GitCompare :size="16" />
              <span>Compare</span>
            </label>
            <select
              id="compare-select"
              v-model="selectedCompareYear"
              @change="handleCompareYearChange"
              :disabled="!selectedMetric"
            >
              <option value="">None</option>
              <option
                v-for="year in compareYears"
                :key="year"
                :value="year"
              >
                {{ year }}
              </option>
            </select>
          </div>

          <div class="filter-item filter-search">
            <label for="search-input">
              <Search :size="16" />
              <span>Search</span>
            </label>
            <div class="search-wrapper">
              <input
                id="search-input"
                type="text"
                v-model="store.searchQuery"
                placeholder="Filter locations..."
                :disabled="!selectedMetric"
              />
              <button
                v-if="store.searchQuery"
                class="btn-clear-search"
                @click="store.searchQuery = ''"
                aria-label="Clear search"
              >
                <X :size="14" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="store.isLoading" class="loading-indicator">
        <div class="loading-bar"></div>
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
const selectedCompareYear = ref('')

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
  const columns = Object.keys(store.data.state[0])
  const yearMatches = columns
    .map(col => col.match(/_(\d{4})$/))
    .filter(match => match)
    .map(match => match[1])
  const years = [...new Set(yearMatches)].sort().reverse()
  return years.filter(y => y !== selectedYear.value)
})

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
  return (
    (filters.selectedStates && filters.selectedStates.length > 0 && filters.selectedStates.length < 50) ||
    (filters.selectedRegions && filters.selectedRegions.length > 0) ||
    (filters.selectedDivisions && filters.selectedDivisions.length > 0) ||
    (filters.selectedCongressionalDistricts && filters.selectedCongressionalDistricts.length > 0) ||
    (filters.selectedAiannh && filters.selectedAiannh.length > 0) ||
    (filters.selectedUrbanRural && filters.selectedUrbanRural.length > 0) ||
    (filters.selectedMetroAreas && filters.selectedMetroAreas.length > 0) ||
    (filters.populationMin !== null && filters.populationMin !== '') ||
    (filters.populationMax !== null && filters.populationMax !== '') ||
    (filters.areaMin !== null && filters.areaMin !== '') ||
    (filters.areaMax !== null && filters.areaMax !== '') ||
    (filters.metricValueMin !== null && filters.metricValueMin !== '') ||
    (filters.metricValueMax !== null && filters.metricValueMax !== '')
  )
})

const activeFilterCount = computed(() => {
  const filters = store.dimensionFilters
  if (!filters) return 0
  let count = 0
  if (filters.selectedStates && filters.selectedStates.length > 0 && filters.selectedStates.length < 50) count++
  if (filters.selectedRegions && filters.selectedRegions.length > 0) count++
  if (filters.selectedDivisions && filters.selectedDivisions.length > 0) count++
  if (filters.selectedCongressionalDistricts && filters.selectedCongressionalDistricts.length > 0) count++
  if (filters.selectedAiannh && filters.selectedAiannh.length > 0) count++
  if (filters.selectedUrbanRural && filters.selectedUrbanRural.length > 0) count++
  if (filters.selectedMetroAreas && filters.selectedMetroAreas.length > 0) count++
  if (filters.populationMin !== null && filters.populationMin !== '') count++
  if (filters.populationMax !== null && filters.populationMax !== '') count++
  if (filters.areaMin !== null && filters.areaMin !== '') count++
  if (filters.areaMax !== null && filters.areaMax !== '') count++
  if (filters.metricValueMin !== null && filters.metricValueMin !== '') count++
  if (filters.metricValueMax !== null && filters.metricValueMax !== '') count++
  return count
})

const navigateToState = () => {
  if (store.currentLevel === 'zcta5') {
    store.goBack()
  }
}

const onDatasetChange = async () => {
  if (!selectedDataset.value) {
    store.currentDataset = null
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
    store.setAutoCompareYear()
  } else {
    store.compareYear = value
  }
}

watch(() => store.manifest, (manifest) => {
  if (manifest?.datasets && manifest.datasets.length > 0) {
    const prefs = store.loadPreferences()
    if (prefs) {
      if (prefs.dataset) selectedDataset.value = prefs.dataset
      if (prefs.year) selectedYear.value = prefs.year
      if (prefs.metric) selectedMetric.value = prefs.metric
      onDatasetChange()
      return
    }
    if (!selectedDataset.value && !store.currentDataset) {
      const firstDataset = manifest.datasets[0].source_file
      selectedDataset.value = firstDataset
      onDatasetChange()
    }
  }
}, { immediate: true })

watch(() => store.compareYear, (newVal) => {
  selectedCompareYear.value = newVal || ''
})

watch(() => selectedYear.value, () => {
  if (store.compareYear && !compareYears.value.includes(store.compareYear)) {
    store.setAutoCompareYear()
  }
})
</script>

<style scoped>
.header {
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  z-index: var(--z-index-sticky);
  width: 100%;
}

.header-container {
  max-width: var(--size-container-max);
  margin: 0 auto;
  padding: 0;
  width: 100%;
}

.header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  gap: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.header-brand {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;
}

.header-brand > :deep(.auxo-logo-container) {
  margin: 0;
  padding: 0;
  flex-shrink: 0;
}

.brand-separator {
  width: 1px;
  height: 2rem;
  background: var(--border-color);
  flex-shrink: 0;
}

.app-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  padding: 0;
  white-space: nowrap;
  letter-spacing: -0.01em;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}

.btn-view-level,
.btn-filters,
.btn-help {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--duration-fast) var(--easing-standard);
  white-space: nowrap;
  height: 2.75rem;
  box-sizing: border-box;
}

.btn-view-level {
  border-color: var(--accent-green);
  background: var(--accent-green-opacity-10);
  color: var(--accent-green);
}

.btn-view-level:hover {
  background: var(--accent-green-opacity-15);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.btn-filters:hover,
.btn-help:hover {
  background: var(--bg-surface);
  border-color: var(--accent-green);
  color: var(--accent-green);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.btn-filters.active {
  background: var(--accent-green);
  border-color: var(--accent-green);
  color: var(--text-on-accent);
}

.btn-filters .badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.25rem;
  height: 1.25rem;
  padding: 0 0.375rem;
  background: var(--text-on-accent);
  color: var(--accent-green);
  border-radius: var(--radius-full);
  font-size: 0.6875rem;
  font-weight: 700;
  margin-left: 0.25rem;
}

.btn-filters.active .badge {
  background: var(--bg-card);
  color: var(--accent-green);
}

.header-nav {
  padding: 0.75rem 2rem;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border-color);
}

.nav-breadcrumbs {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.btn-back {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.875rem;
  background: var(--accent-green);
  color: var(--text-on-accent);
  border: none;
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: 0.8125rem;
  cursor: pointer;
  transition: all var(--duration-fast) var(--easing-standard);
  white-space: nowrap;
}

.btn-back:hover {
  background: var(--accent-green-opacity-85);
  transform: translateX(-2px);
  box-shadow: var(--shadow-sm);
}

.breadcrumb-nav {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.breadcrumb-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.875rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--duration-fast) var(--easing-standard);
  white-space: nowrap;
}

.breadcrumb-link:hover:not(:disabled) {
  background: var(--bg-surface);
  border-color: var(--accent-green);
  color: var(--accent-green);
  transform: translateY(-1px);
}

.breadcrumb-link.active {
  background: var(--accent-green);
  border-color: var(--accent-green);
  color: var(--text-on-accent);
  cursor: default;
}

.breadcrumb-link:disabled {
  opacity: 0.6;
  cursor: default;
}

.breadcrumb-sep {
  color: var(--text-tertiary);
  flex-shrink: 0;
}

.header-filters-bar {
  padding: 1rem 2rem;
  background: var(--bg-card);
}

.filter-controls {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-item label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.filter-item label svg {
  color: var(--accent-green);
  flex-shrink: 0;
}

.filter-item select,
.filter-item input {
  padding: 0.625rem 0.875rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--bg-elevated);
  color: var(--text-primary);
  font-size: 0.875rem;
  font-weight: 500;
  transition: all var(--duration-fast) var(--easing-standard);
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23A3E635' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  background-size: 12px;
  padding-right: 2.5rem;
}

.filter-item select:focus,
.filter-item input:focus {
  outline: none;
  border-color: var(--accent-green);
  box-shadow: var(--shadow-focus-sm);
  background-color: var(--bg-surface);
}

.filter-item select:hover:not(:disabled) {
  border-color: var(--border-color-light);
  background-color: var(--bg-surface);
}

.filter-item select:disabled,
.filter-item input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.filter-search {
  grid-column: span 2;
}

.search-wrapper {
  position: relative;
}

.search-wrapper input {
  width: 100%;
  padding-right: 2.5rem;
}

.btn-clear-search {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: var(--radius-sm);
  transition: all var(--duration-fast) var(--easing-standard);
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-clear-search:hover {
  background: var(--bg-surface);
  color: var(--text-primary);
}

.loading-indicator {
  height: 2px;
  background: var(--bg-secondary);
  overflow: hidden;
}

.loading-bar {
  height: 100%;
  background: var(--accent-green);
  animation: loading 1.5s ease-in-out infinite;
}

@keyframes loading {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

@media (max-width: 1024px) {
  .header-top {
    padding: 0.875rem 1.5rem;
  }

  .header-nav {
    padding: 0.625rem 1.5rem;
  }

  .header-filters-bar {
    padding: 0.875rem 1.5rem;
  }

  .filter-controls {
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  }

  .filter-search {
    grid-column: span 1;
  }
}

@media (max-width: 768px) {
  .header-top {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
    padding: 1rem;
  }

  .header-brand {
    justify-content: center;
  }

  .header-controls {
    justify-content: center;
    flex-wrap: wrap;
  }

  .header-nav {
    padding: 0.75rem 1rem;
  }

  .nav-breadcrumbs {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }

  .btn-back {
    width: 100%;
    justify-content: center;
  }

  .header-filters-bar {
    padding: 1rem;
  }

  .filter-controls {
    grid-template-columns: 1fr;
  }

  .filter-search {
    grid-column: span 1;
  }

  .app-title {
    font-size: 1rem;
  }

  .btn-view-level,
  .btn-filters,
  .btn-help {
    flex: 1;
    justify-content: center;
    min-width: 120px;
  }
}
</style>
