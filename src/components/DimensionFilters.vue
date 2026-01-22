<template>
  <div class="dimension-filters">
    <button 
      class="filters-toggle"
      @click="store.filtersExpanded = !store.filtersExpanded"
      :aria-expanded="store.filtersExpanded"
    >
      <Filter :size="18" />
      <span>Dimension Filters</span>
      <ChevronDown :size="16" :class="{ rotated: !store.filtersExpanded }" />
    </button>

    <transition name="expand">
      <div v-show="store.filtersExpanded" class="filters-content">
        <div v-if="store.currentLevel === 'state'" class="filter-section">
          <div class="filter-group">
            <label>Regions</label>
            <div class="filter-checkboxes">
              <label v-for="region in availableRegions" :key="region" class="checkbox-label">
                <input
                  type="checkbox"
                  :value="region"
                  v-model="store.dimensionFilters.selectedRegions"
                />
                <span>{{ region }}</span>
              </label>
            </div>
          </div>
          <div class="filter-group">
            <label>States</label>
            <div class="filter-multiselect">
              <select
                multiple
                v-model="store.dimensionFilters.selectedStates"
                size="5"
                class="multiselect"
              >
                <option v-for="state in availableStates" :key="state" :value="state">
                  {{ state }}
                </option>
              </select>
              <button 
                v-if="store.dimensionFilters.selectedStates.length > 0"
                @click="store.dimensionFilters.selectedStates = []"
                class="clear-filter"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        <div v-if="store.currentLevel === 'county'" class="filter-section">
          <div class="filter-group">
            <label>Urban/Rural</label>
            <div class="filter-checkboxes">
              <label v-for="ur in availableUrbanRural" :key="ur" class="checkbox-label">
                <input
                  type="checkbox"
                  :value="ur"
                  v-model="store.dimensionFilters.selectedUrbanRural"
                />
                <span>{{ ur }}</span>
              </label>
            </div>
          </div>
          <div v-if="availableAiannh.length > 0" class="filter-group">
            <label>AIANNH Areas</label>
            <div class="filter-multiselect">
              <select
                multiple
                v-model="store.dimensionFilters.selectedAiannh"
                size="5"
                class="multiselect"
              >
                <option v-for="aiannh in availableAiannh" :key="aiannh" :value="aiannh">
                  {{ aiannh }}
                </option>
              </select>
              <button 
                v-if="store.dimensionFilters.selectedAiannh.length > 0"
                @click="store.dimensionFilters.selectedAiannh = []"
                class="clear-filter"
              >
                Clear
              </button>
            </div>
          </div>
          <div v-if="availableCongressionalDistricts.length > 0" class="filter-group">
            <label>Congressional Districts</label>
            <div class="filter-multiselect">
              <select
                multiple
                v-model="store.dimensionFilters.selectedCongressionalDistricts"
                size="5"
                class="multiselect"
              >
                <option v-for="cd in availableCongressionalDistricts" :key="cd" :value="cd">
                  District {{ cd }}
                </option>
              </select>
              <button 
                v-if="store.dimensionFilters.selectedCongressionalDistricts.length > 0"
                @click="store.dimensionFilters.selectedCongressionalDistricts = []"
                class="clear-filter"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        <div v-if="hasActiveFilters" class="filter-actions">
          <button @click="store.resetFilters()" class="btn-reset-filters">
            Reset All Filters
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useCensusStore } from '../stores/census'
import { Filter, ChevronDown } from 'lucide-vue-next'

const store = useCensusStore()

const availableRegions = computed(() => {
  if (!store.data.state) return []
  const regions = new Set()
  store.data.state.forEach(row => {
    if (row.census_region) {
      const regionName = store.getRegionName(row.census_region)
      if (regionName !== 'N/A') regions.add(regionName)
    }
  })
  return Array.from(regions).sort()
})

const availableStates = computed(() => {
  if (!store.data.state) return []
  return [...new Set(store.data.state.map(r => r.state_name).filter(Boolean))].sort()
})

const availableUrbanRural = computed(() => {
  if (!store.data.county || !store.currentState) return []
  const filtered = store.data.county.filter(d => d.state_name === store.currentState)
  const ur = new Set()
  filtered.forEach(row => {
    if (row.urban_rural && row.urban_rural !== 'N/A') {
      ur.add(row.urban_rural)
    }
  })
  return Array.from(ur).sort()
})

const availableAiannh = computed(() => {
  if (!store.data.county || !store.currentState) return []
  const filtered = store.data.county.filter(d => d.state_name === store.currentState)
  const aiannh = new Set()
  filtered.forEach(row => {
    if (row.aiannh_name && row.aiannh_name !== 'N/A' && row.aiannh_name !== '') {
      aiannh.add(row.aiannh_name)
    }
  })
  return Array.from(aiannh).sort()
})

const availableCongressionalDistricts = computed(() => {
  if (!store.data.county || !store.currentState) return []
  const filtered = store.data.county.filter(d => d.state_name === store.currentState)
  const cds = new Set()
  filtered.forEach(row => {
    const cd = row.congressional_district || row.cd116 || row.cd || ''
    if (cd && cd !== 'N/A' && cd !== '') {
      cds.add(cd)
    }
  })
  return Array.from(cds).sort((a, b) => {
    const aNum = parseInt(a) || 0
    const bNum = parseInt(b) || 0
    return aNum - bNum
  })
})

const hasActiveFilters = computed(() => {
  const filters = store.dimensionFilters
  return filters.selectedStates.length > 0 ||
         filters.selectedRegions.length > 0 ||
         filters.selectedCongressionalDistricts.length > 0 ||
         filters.selectedAiannh.length > 0 ||
         filters.selectedUrbanRural.length > 0
})
</script>

<style scoped>
.dimension-filters {
  margin-top: 0.75rem;
  border-top: 1px solid var(--border-color);
  padding-top: 0.75rem;
}

.filters-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.625rem 1rem;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--duration-fast) var(--easing-standard);
}

.filters-toggle:hover {
  background: var(--bg-elevated);
  border-color: var(--accent-green);
  color: var(--accent-green);
}

.filters-toggle svg.rotated {
  transform: rotate(-90deg);
}

.filters-content {
  margin-top: 0.75rem;
  padding: 1rem;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
}

.filter-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1rem;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-group label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
}

.filter-checkboxes {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 400;
  color: var(--text-secondary);
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: 1rem;
  height: 1rem;
  cursor: pointer;
  accent-color: var(--accent-green);
}

.filter-multiselect {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.multiselect {
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--bg-card);
  color: var(--text-primary);
  font-size: 0.8125rem;
  min-height: 120px;
}

.multiselect:focus {
  outline: none;
  border-color: var(--accent-green);
}

.clear-filter {
  padding: 0.375rem 0.75rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: 0.75rem;
  cursor: pointer;
  transition: all var(--duration-fast) var(--easing-standard);
}

.clear-filter:hover {
  background: var(--bg-surface);
  border-color: var(--accent-green);
  color: var(--accent-green);
}

.filter-actions {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: flex-end;
}

.btn-reset-filters {
  padding: 0.5rem 1rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--duration-fast) var(--easing-standard);
}

.btn-reset-filters:hover {
  background: var(--bg-surface);
  border-color: var(--accent-green);
  color: var(--accent-green);
}

.expand-enter-active,
.expand-leave-active {
  transition: all var(--duration-normal) var(--easing-standard);
  max-height: 1000px;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
}
</style>
