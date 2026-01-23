<template>
  <header class="header">
    <div class="header-container">
      <div class="header-top">
        <div class="header-brand">
          <AuxoLogo size="small" />
          <div class="brand-separator"></div>
          <h1 class="app-title">USA Census Data Explorer</h1>
          <div class="header-breadcrumbs">
            <button
              v-if="store.currentLevel !== 'state'"
              class="btn-back"
              @click="store.goBack()"
              aria-label="Go back"
            >
              <ChevronLeft :size="14" />
              <span>Back</span>
            </button>
            <nav class="breadcrumb-nav">
              <button
                class="breadcrumb-link"
                :class="{ 'active': store.currentLevel === 'state' }"
                @click="store.reset()"
              >
                <Globe :size="12" />
                <span>United States</span>
              </button>
              <ChevronRight v-if="store.currentState" :size="10" class="breadcrumb-sep" />
              <button
                v-if="store.currentState"
                class="breadcrumb-link"
                :class="{ 'active': store.currentLevel === 'county' }"
                @click="navigateToState"
              >
                <MapPin :size="12" />
                <span>{{ store.currentState }}</span>
              </button>
              <ChevronRight v-if="store.currentCounty" :size="10" class="breadcrumb-sep" />
              <button
                v-if="store.currentCounty"
                class="breadcrumb-link"
                :class="{ 'active': store.currentLevel === 'zcta5' }"
                disabled
              >
                <Building :size="12" />
                <span>{{ store.currentCounty }}</span>
              </button>
            </nav>
          </div>
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

      <div class="header-filters-bar" :class="{ 'collapsed': !filtersExpanded }">
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

      <div v-if="store.isLoading && store.loadingProgress.stage" class="loading-indicator">
        <div class="loading-bar"></div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCensusStore } from '../../stores/census'
import { Database, Calendar, TrendingUp, GitCompare, Search, X, HelpCircle, ChevronLeft, ChevronRight, Globe, MapPin, Building, Filter } from 'lucide-vue-next'
import AuxoLogo from '../../components/common/AuxoLogo.vue'
import { formatDatasetName } from '../../utils/formatUtils'
import { useFilters } from '../../composables/useFilters'
import { useFilterCount } from '../../composables/useFilterCount'
import { useLevelInfo } from '../../composables/useLevelInfo'

const store = useCensusStore()
const {
  selectedDataset,
  selectedYear,
  selectedMetric,
  selectedCompareYear,
  availableYears,
  availableMetrics,
  compareYears,
  onDatasetChange,
  onYearChange,
  onMetricChange,
  handleCompareYearChange
} = useFilters()

const { hasActiveFilters, activeFilterCount } = useFilterCount()
const { levelIcon, levelName } = useLevelInfo(computed(() => store.currentLevel))

const filtersExpanded = ref(true)

const navigateToState = () => {
  if (store.currentLevel === 'zcta5' || store.currentLevel === 'county') {
    store.goBack()
  }
}


onMounted(async () => {
  if (!store.manifest) {
    try {
      await store.loadManifest()
      const prefs = store.loadPreferences()
      if (prefs?.dataset && store.manifest?.datasets?.find(d => d.source_file === prefs.dataset)) {
        selectedDataset.value = prefs.dataset
        await onDatasetChange()
      } else if (store.manifest?.datasets?.length > 0 && !selectedDataset.value) {
        const firstDataset = store.manifest.datasets[0].source_file
        selectedDataset.value = firstDataset
        await onDatasetChange()
      }
    } catch (error) {
      console.error('Failed to load manifest on mount:', error)
    }
  } else {
    const prefs = store.loadPreferences()
    if (prefs?.dataset && store.manifest?.datasets?.find(d => d.source_file === prefs.dataset)) {
      selectedDataset.value = prefs.dataset
      await onDatasetChange()
    } else if (store.manifest?.datasets?.length > 0 && !selectedDataset.value) {
      const firstDataset = store.manifest.datasets[0].source_file
      selectedDataset.value = firstDataset
      await onDatasetChange()
    }
  }
})
</script>

<style scoped>
.btn-view-level {
  border-color: var(--accent-green);
  background: var(--accent-green-opacity-10);
  color: var(--accent-green);
}

.btn-view-level:hover {
  background: var(--accent-green-opacity-15);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(163, 230, 53, 0.2);
}

.btn-view-level:active {
  transform: translateY(0);
  transition: transform 0.1s cubic-bezier(0.4, 0, 0.2, 1);
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
  font-size: var(--font-size-xs);
  font-weight: 700;
  margin-left: 0.25rem;
}

.btn-filters.active .badge {
  background: var(--bg-card);
  color: var(--accent-green);
}

.breadcrumb-link.active {
  background: var(--accent-green);
  border-color: var(--accent-green);
  color: var(--text-on-accent);
  cursor: default;
}

.breadcrumb-sep {
  color: var(--text-tertiary);
  flex-shrink: 0;
}

.loading-indicator {
  height: 3px;
  background: var(--bg-secondary);
  overflow: hidden;
  position: relative;
}

.loading-bar {
  height: 100%;
  width: 40%;
  background: linear-gradient(90deg, transparent, var(--accent-green), transparent);
  animation: shimmer 1.5s ease-in-out infinite;
  box-shadow: 0 0 8px rgba(163, 230, 53, 0.5);
}
</style>
