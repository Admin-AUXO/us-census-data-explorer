<template>
  <div class="dimension-filters">
    <button 
      class="filters-toggle"
      @click="store.filtersExpanded = !store.filtersExpanded"
      :aria-expanded="store.filtersExpanded"
      :class="{ 'has-active-filters': hasActiveFilters }"
    >
      <Filter :size="18" />
      <span>Advanced Filters</span>
      <span v-if="hasActiveFilters" class="filter-badge">{{ activeFilterCount }}</span>
      <ChevronDown :size="16" :class="{ rotated: !store.filtersExpanded }" />
    </button>

    <transition name="expand">
      <div v-show="store.filtersExpanded" class="filters-content">
        <div v-if="store.currentLevel === 'state'" class="filter-section">
          <div class="filter-group">
            <label class="filter-label">
              <MapPin :size="16" />
              <span>Regions</span>
              <span v-if="store.dimensionFilters.selectedRegions.length > 0" class="filter-count">
                ({{ store.dimensionFilters.selectedRegions.length }})
              </span>
            </label>
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
            <label class="filter-label">
              <Globe :size="16" />
              <span>States</span>
              <span v-if="store.dimensionFilters.selectedStates.length > 0" class="filter-count">
                ({{ store.dimensionFilters.selectedStates.length }})
              </span>
            </label>
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
                <X :size="14" />
                Clear
              </button>
            </div>
          </div>
          <div v-if="availableDivisions.length > 0" class="filter-group">
            <label class="filter-label">
              <Map :size="16" />
              <span>Census Divisions</span>
              <span v-if="store.dimensionFilters.selectedDivisions.length > 0" class="filter-count">
                ({{ store.dimensionFilters.selectedDivisions.length }})
              </span>
            </label>
            <div class="filter-checkboxes">
              <label v-for="division in availableDivisions" :key="division" class="checkbox-label">
                <input
                  type="checkbox"
                  :value="division"
                  v-model="store.dimensionFilters.selectedDivisions"
                />
                <span>{{ division }}</span>
              </label>
            </div>
          </div>
          <div class="filter-group numeric-filters">
            <label class="filter-label">
              <TrendingUp :size="16" />
              <span>Population Range</span>
            </label>
            <div class="numeric-inputs">
              <input
                type="number"
                v-model.number="store.dimensionFilters.populationMin"
                placeholder="Min"
                class="numeric-input"
              />
              <span class="numeric-separator">to</span>
              <input
                type="number"
                v-model.number="store.dimensionFilters.populationMax"
                placeholder="Max"
                class="numeric-input"
              />
              <button 
                v-if="store.dimensionFilters.populationMin || store.dimensionFilters.populationMax"
                @click="store.dimensionFilters.populationMin = null; store.dimensionFilters.populationMax = null"
                class="clear-numeric"
              >
                <X :size="12" />
              </button>
            </div>
          </div>
          <div class="filter-group numeric-filters">
            <label class="filter-label">
              <MapPin :size="16" />
              <span>Area Range (km²)</span>
            </label>
            <div class="slider-container">
              <div class="slider-wrapper">
                <input
                  type="range"
                  :min="areaRange.min"
                  :max="areaRange.max"
                  :step="areaRange.step"
                  v-model.number="areaSliderMin"
                  class="slider"
                />
                <input
                  type="range"
                  :min="areaRange.min"
                  :max="areaRange.max"
                  :step="areaRange.step"
                  v-model.number="areaSliderMax"
                  class="slider"
                />
              </div>
              <div class="slider-values">
                <input
                  type="number"
                  v-model.number="store.dimensionFilters.areaMin"
                  :min="areaRange.min"
                  :max="areaRange.max"
                  placeholder="Min"
                  class="numeric-input small"
                />
                <span class="numeric-separator">to</span>
                <input
                  type="number"
                  v-model.number="store.dimensionFilters.areaMax"
                  :min="areaRange.min"
                  :max="areaRange.max"
                  placeholder="Max"
                  class="numeric-input small"
                />
                <button 
                  v-if="store.dimensionFilters.areaMin || store.dimensionFilters.areaMax"
                  @click="store.dimensionFilters.areaMin = null; store.dimensionFilters.areaMax = null"
                  class="clear-numeric"
                >
                  <X :size="12" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-if="store.currentLevel === 'county'" class="filter-section">
          <div class="filter-group">
            <label class="filter-label">
              <Building :size="16" />
              <span>Urban/Rural</span>
              <span v-if="store.dimensionFilters.selectedUrbanRural.length > 0" class="filter-count">
                ({{ store.dimensionFilters.selectedUrbanRural.length }})
              </span>
            </label>
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
            <label class="filter-label">
              <MapPin :size="16" />
              <span>AIANNH Areas</span>
              <span v-if="store.dimensionFilters.selectedAiannh.length > 0" class="filter-count">
                ({{ store.dimensionFilters.selectedAiannh.length }})
              </span>
            </label>
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
                <X :size="14" />
                Clear
              </button>
            </div>
          </div>
          <div v-if="availableCongressionalDistricts.length > 0" class="filter-group">
            <label class="filter-label">
              <Map :size="16" />
              <span>Congressional Districts</span>
              <span v-if="store.dimensionFilters.selectedCongressionalDistricts.length > 0" class="filter-count">
                ({{ store.dimensionFilters.selectedCongressionalDistricts.length }})
              </span>
            </label>
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
                <X :size="14" />
                Clear
              </button>
            </div>
          </div>
          <div v-if="availableMetroAreas.length > 0" class="filter-group">
            <label class="filter-label">
              <Building :size="16" />
              <span>Metro Areas</span>
              <span v-if="store.dimensionFilters.selectedMetroAreas.length > 0" class="filter-count">
                ({{ store.dimensionFilters.selectedMetroAreas.length }})
              </span>
            </label>
            <div class="filter-multiselect">
              <select
                multiple
                v-model="store.dimensionFilters.selectedMetroAreas"
                size="5"
                class="multiselect"
              >
                <option v-for="metro in availableMetroAreas" :key="metro" :value="metro">
                  {{ metro }}
                </option>
              </select>
              <button 
                v-if="store.dimensionFilters.selectedMetroAreas.length > 0"
                @click="store.dimensionFilters.selectedMetroAreas = []"
                class="clear-filter"
              >
                <X :size="14" />
                Clear
              </button>
            </div>
          </div>
          <div class="filter-group numeric-filters">
            <label class="filter-label">
              <TrendingUp :size="16" />
              <span>Population Range</span>
            </label>
            <div class="slider-container">
              <div class="slider-wrapper">
                <input
                  type="range"
                  :min="populationRange.min"
                  :max="populationRange.max"
                  :step="populationRange.step"
                  v-model.number="populationSliderMin"
                  class="slider"
                />
                <input
                  type="range"
                  :min="populationRange.min"
                  :max="populationRange.max"
                  :step="populationRange.step"
                  v-model.number="populationSliderMax"
                  class="slider"
                />
              </div>
              <div class="slider-values">
                <input
                  type="number"
                  v-model.number="store.dimensionFilters.populationMin"
                  :min="populationRange.min"
                  :max="populationRange.max"
                  placeholder="Min"
                  class="numeric-input small"
                />
                <span class="numeric-separator">to</span>
                <input
                  type="number"
                  v-model.number="store.dimensionFilters.populationMax"
                  :min="populationRange.min"
                  :max="populationRange.max"
                  placeholder="Max"
                  class="numeric-input small"
                />
                <button 
                  v-if="store.dimensionFilters.populationMin || store.dimensionFilters.populationMax"
                  @click="store.dimensionFilters.populationMin = null; store.dimensionFilters.populationMax = null"
                  class="clear-numeric"
                >
                  <X :size="12" />
                </button>
              </div>
            </div>
          </div>
          <div class="filter-group numeric-filters">
            <label class="filter-label">
              <MapPin :size="16" />
              <span>Area Range (km²)</span>
            </label>
            <div class="slider-container">
              <div class="slider-wrapper">
                <input
                  type="range"
                  :min="areaRange.min"
                  :max="areaRange.max"
                  :step="areaRange.step"
                  v-model.number="areaSliderMin"
                  class="slider"
                />
                <input
                  type="range"
                  :min="areaRange.min"
                  :max="areaRange.max"
                  :step="areaRange.step"
                  v-model.number="areaSliderMax"
                  class="slider"
                />
              </div>
              <div class="slider-values">
                <input
                  type="number"
                  v-model.number="store.dimensionFilters.areaMin"
                  :min="areaRange.min"
                  :max="areaRange.max"
                  placeholder="Min"
                  class="numeric-input small"
                />
                <span class="numeric-separator">to</span>
                <input
                  type="number"
                  v-model.number="store.dimensionFilters.areaMax"
                  :min="areaRange.min"
                  :max="areaRange.max"
                  placeholder="Max"
                  class="numeric-input small"
                />
                <button 
                  v-if="store.dimensionFilters.areaMin || store.dimensionFilters.areaMax"
                  @click="store.dimensionFilters.areaMin = null; store.dimensionFilters.areaMax = null"
                  class="clear-numeric"
                >
                  <X :size="12" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-if="store.currentLevel === 'zcta5'" class="filter-section">
          <div class="filter-group">
            <label class="filter-label">
              <Building :size="16" />
              <span>Urban/Rural</span>
              <span v-if="store.dimensionFilters.selectedUrbanRural.length > 0" class="filter-count">
                ({{ store.dimensionFilters.selectedUrbanRural.length }})
              </span>
            </label>
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
            <label class="filter-label">
              <MapPin :size="16" />
              <span>AIANNH Areas</span>
              <span v-if="store.dimensionFilters.selectedAiannh.length > 0" class="filter-count">
                ({{ store.dimensionFilters.selectedAiannh.length }})
              </span>
            </label>
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
                <X :size="14" />
                Clear
              </button>
            </div>
          </div>
          <div v-if="availableMetroAreas.length > 0" class="filter-group">
            <label class="filter-label">
              <Building :size="16" />
              <span>Metro Areas</span>
              <span v-if="store.dimensionFilters.selectedMetroAreas.length > 0" class="filter-count">
                ({{ store.dimensionFilters.selectedMetroAreas.length }})
              </span>
            </label>
            <div class="filter-multiselect">
              <select
                multiple
                v-model="store.dimensionFilters.selectedMetroAreas"
                size="5"
                class="multiselect"
              >
                <option v-for="metro in availableMetroAreas" :key="metro" :value="metro">
                  {{ metro }}
                </option>
              </select>
              <button 
                v-if="store.dimensionFilters.selectedMetroAreas.length > 0"
                @click="store.dimensionFilters.selectedMetroAreas = []"
                class="clear-filter"
              >
                <X :size="14" />
                Clear
              </button>
            </div>
          </div>
          <div class="filter-group numeric-filters">
            <label class="filter-label">
              <TrendingUp :size="16" />
              <span>Population Range</span>
            </label>
            <div class="slider-container">
              <div class="slider-wrapper">
                <input
                  type="range"
                  :min="populationRange.min"
                  :max="populationRange.max"
                  :step="populationRange.step"
                  v-model.number="populationSliderMin"
                  class="slider"
                />
                <input
                  type="range"
                  :min="populationRange.min"
                  :max="populationRange.max"
                  :step="populationRange.step"
                  v-model.number="populationSliderMax"
                  class="slider"
                />
              </div>
              <div class="slider-values">
                <input
                  type="number"
                  v-model.number="store.dimensionFilters.populationMin"
                  :min="populationRange.min"
                  :max="populationRange.max"
                  placeholder="Min"
                  class="numeric-input small"
                />
                <span class="numeric-separator">to</span>
                <input
                  type="number"
                  v-model.number="store.dimensionFilters.populationMax"
                  :min="populationRange.min"
                  :max="populationRange.max"
                  placeholder="Max"
                  class="numeric-input small"
                />
                <button 
                  v-if="store.dimensionFilters.populationMin || store.dimensionFilters.populationMax"
                  @click="store.dimensionFilters.populationMin = null; store.dimensionFilters.populationMax = null"
                  class="clear-numeric"
                >
                  <X :size="12" />
                </button>
              </div>
            </div>
          </div>
          <div class="filter-group numeric-filters">
            <label class="filter-label">
              <MapPin :size="16" />
              <span>Area Range (km²)</span>
            </label>
            <div class="slider-container">
              <div class="slider-wrapper">
                <input
                  type="range"
                  :min="areaRange.min"
                  :max="areaRange.max"
                  :step="areaRange.step"
                  v-model.number="areaSliderMin"
                  class="slider"
                />
                <input
                  type="range"
                  :min="areaRange.min"
                  :max="areaRange.max"
                  :step="areaRange.step"
                  v-model.number="areaSliderMax"
                  class="slider"
                />
              </div>
              <div class="slider-values">
                <input
                  type="number"
                  v-model.number="store.dimensionFilters.areaMin"
                  :min="areaRange.min"
                  :max="areaRange.max"
                  placeholder="Min"
                  class="numeric-input small"
                />
                <span class="numeric-separator">to</span>
                <input
                  type="number"
                  v-model.number="store.dimensionFilters.areaMax"
                  :min="areaRange.min"
                  :max="areaRange.max"
                  placeholder="Max"
                  class="numeric-input small"
                />
                <button 
                  v-if="store.dimensionFilters.areaMin || store.dimensionFilters.areaMax"
                  @click="store.dimensionFilters.areaMin = null; store.dimensionFilters.areaMax = null"
                  class="clear-numeric"
                >
                  <X :size="12" />
                </button>
              </div>
            </div>
          </div>
          <div v-if="store.currentMetric && metricRange" class="filter-group numeric-filters">
            <label class="filter-label">
              <Activity :size="16" />
              <span>Metric Value Range</span>
            </label>
            <div class="slider-container">
              <div class="slider-wrapper">
                <input
                  type="range"
                  :min="metricRange.min"
                  :max="metricRange.max"
                  :step="metricRange.step"
                  v-model.number="metricSliderMin"
                  class="slider"
                />
                <input
                  type="range"
                  :min="metricRange.min"
                  :max="metricRange.max"
                  :step="metricRange.step"
                  v-model.number="metricSliderMax"
                  class="slider"
                />
              </div>
              <div class="slider-values">
                <input
                  type="number"
                  v-model.number="store.dimensionFilters.metricValueMin"
                  :min="metricRange.min"
                  :max="metricRange.max"
                  placeholder="Min"
                  class="numeric-input small"
                />
                <span class="numeric-separator">to</span>
                <input
                  type="number"
                  v-model.number="store.dimensionFilters.metricValueMax"
                  :min="metricRange.min"
                  :max="metricRange.max"
                  placeholder="Max"
                  class="numeric-input small"
                />
                <button 
                  v-if="store.dimensionFilters.metricValueMin || store.dimensionFilters.metricValueMax"
                  @click="store.dimensionFilters.metricValueMin = null; store.dimensionFilters.metricValueMax = null"
                  class="clear-numeric"
                >
                  <X :size="12" />
                </button>
              </div>
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
import { computed, ref, watch } from 'vue'
import { useCensusStore } from '../stores/census'
import { Filter, ChevronDown, MapPin, Globe, Building, Map, X, TrendingUp, Activity } from 'lucide-vue-next'

const store = useCensusStore()

const populationRange = computed(() => {
  if (!store.filteredData || store.filteredData.length === 0) {
    return { min: 0, max: 1000000, step: 1000 }
  }
  
  const popCol = store.filteredData[0]?.total_population_2024 || 
                 store.filteredData[0]?.total_population_2023 ||
                 store.filteredData[0]?.total_population_2022 ||
                 Object.keys(store.filteredData[0] || {}).find(k => k.includes('total_population'))
  
  if (!popCol) return { min: 0, max: 1000000, step: 1000 }
  
  const values = store.filteredData
    .map(row => parseFloat(row[popCol]) || 0)
    .filter(v => v > 0)
  
  if (values.length === 0) return { min: 0, max: 1000000, step: 1000 }
  
  const min = Math.floor(Math.min(...values))
  const max = Math.ceil(Math.max(...values))
  const step = Math.max(1, Math.floor((max - min) / 1000))
  
  return { min, max, step }
})

const areaRange = computed(() => {
  if (!store.filteredData || store.filteredData.length === 0) {
    return { min: 0, max: 100000, step: 100 }
  }
  
  const values = store.filteredData
    .map(row => parseFloat(row.land_area_sq_km) || 0)
    .filter(v => v > 0)
  
  if (values.length === 0) return { min: 0, max: 100000, step: 100 }
  
  const min = Math.floor(Math.min(...values))
  const max = Math.ceil(Math.max(...values))
  const step = Math.max(0.1, (max - min) / 1000)
  
  return { min, max, step }
})

const metricRange = computed(() => {
  if (!store.currentMetric || !store.filteredData || store.filteredData.length === 0) {
    return null
  }
  
  const values = store.filteredData
    .map(row => parseFloat(row[store.currentMetric]) || 0)
    .filter(v => !isNaN(v) && v > 0)
  
  if (values.length === 0) return null
  
  const min = Math.floor(Math.min(...values))
  const max = Math.ceil(Math.max(...values))
  const step = Math.max(0.01, (max - min) / 1000)
  
  return { min, max, step }
})

const populationSliderMin = computed({
  get: () => store.dimensionFilters.populationMin || populationRange.value.min,
  set: (val) => { store.dimensionFilters.populationMin = val === populationRange.value.min ? null : val }
})

const populationSliderMax = computed({
  get: () => store.dimensionFilters.populationMax || populationRange.value.max,
  set: (val) => { store.dimensionFilters.populationMax = val === populationRange.value.max ? null : val }
})

const areaSliderMin = computed({
  get: () => store.dimensionFilters.areaMin || areaRange.value.min,
  set: (val) => { store.dimensionFilters.areaMin = val === areaRange.value.min ? null : val }
})

const areaSliderMax = computed({
  get: () => store.dimensionFilters.areaMax || areaRange.value.max,
  set: (val) => { store.dimensionFilters.areaMax = val === areaRange.value.max ? null : val }
})

const metricSliderMin = computed({
  get: () => {
    if (!metricRange.value) return 0
    return store.dimensionFilters.metricValueMin || metricRange.value.min
  },
  set: (val) => {
    if (!metricRange.value) return
    store.dimensionFilters.metricValueMin = val === metricRange.value.min ? null : val
  }
})

const metricSliderMax = computed({
  get: () => {
    if (!metricRange.value) return 0
    return store.dimensionFilters.metricValueMax || metricRange.value.max
  },
  set: (val) => {
    if (!metricRange.value) return
    store.dimensionFilters.metricValueMax = val === metricRange.value.max ? null : val
  }
})

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

const availableDivisions = computed(() => {
  if (!store.data.state) return []
  const divisions = new Set()
  store.data.state.forEach(row => {
    if (row.census_division) {
      const divisionName = store.getDivisionName(row.census_division)
      if (divisionName !== 'N/A') divisions.add(divisionName)
    }
  })
  return Array.from(divisions).sort()
})

const availableMetroAreas = computed(() => {
  if (store.currentLevel === 'county') {
    if (!store.data.county || !store.currentState) return []
    const filtered = store.data.county.filter(d => d.state_name === store.currentState)
    const metros = new Set()
    filtered.forEach(row => {
      const metro = row.urban_area_name || (row.cbsa_code ? `CBSA: ${row.cbsa_code}` : null)
      if (metro && metro !== 'N/A') metros.add(metro)
    })
    return Array.from(metros).sort()
  } else if (store.currentLevel === 'zcta5') {
    if (!store.data.zcta5 || !store.currentState || !store.currentCounty) return []
    const filtered = store.data.zcta5.filter(d => 
      d.state_name === store.currentState && d.county_name === store.currentCounty
    )
    const metros = new Set()
    filtered.forEach(row => {
      const metro = row.urban_area_name || (row.cbsa_code ? `CBSA: ${row.cbsa_code}` : null)
      if (metro && metro !== 'N/A') metros.add(metro)
    })
    return Array.from(metros).sort()
  }
  return []
})

const availableUrbanRural = computed(() => {
  if (store.currentLevel === 'county') {
    if (!store.data.county || !store.currentState) return []
    const filtered = store.data.county.filter(d => d.state_name === store.currentState)
    const ur = new Set()
    filtered.forEach(row => {
      if (row.urban_rural && row.urban_rural !== 'N/A') {
        ur.add(row.urban_rural)
      }
    })
    return Array.from(ur).sort()
  } else if (store.currentLevel === 'zcta5') {
    if (!store.data.zcta5 || !store.currentState || !store.currentCounty) return []
    const filtered = store.data.zcta5.filter(d => 
      d.state_name === store.currentState && d.county_name === store.currentCounty
    )
    const ur = new Set()
    filtered.forEach(row => {
      if (row.urban_rural && row.urban_rural !== 'N/A') {
        ur.add(row.urban_rural)
      }
    })
    return Array.from(ur).sort()
  }
  return []
})

const availableAiannh = computed(() => {
  if (store.currentLevel === 'county') {
    if (!store.data.county || !store.currentState) return []
    const filtered = store.data.county.filter(d => d.state_name === store.currentState)
    const aiannh = new Set()
    filtered.forEach(row => {
      if (row.aiannh_name && row.aiannh_name !== 'N/A' && row.aiannh_name !== '') {
        aiannh.add(row.aiannh_name)
      }
    })
    return Array.from(aiannh).sort()
  } else if (store.currentLevel === 'zcta5') {
    if (!store.data.zcta5 || !store.currentState || !store.currentCounty) return []
    const filtered = store.data.zcta5.filter(d => 
      d.state_name === store.currentState && d.county_name === store.currentCounty
    )
    const aiannh = new Set()
    filtered.forEach(row => {
      if (row.aiannh_name && row.aiannh_name !== 'N/A' && row.aiannh_name !== '') {
        aiannh.add(row.aiannh_name)
      }
    })
    return Array.from(aiannh).sort()
  }
  return []
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
  gap: 0.625rem;
  width: 100%;
  padding: 0.75rem 1rem;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--duration-fast) var(--easing-standard);
  position: relative;
}

.filters-toggle:hover {
  background: var(--bg-elevated);
  border-color: var(--accent-green);
  color: var(--accent-green);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.filters-toggle.has-active-filters {
  border-color: var(--accent-green);
  background: rgba(163, 230, 53, 0.05);
}

.filter-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.5rem;
  height: 1.5rem;
  padding: 0 0.375rem;
  background: var(--accent-green);
  color: var(--bg-card);
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  margin-left: auto;
}

.filters-toggle svg.rotated {
  transform: rotate(-90deg);
}

.filters-content {
  margin-top: 0.75rem;
  padding: 1.25rem;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
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

.filter-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.filter-label svg {
  color: var(--accent-green);
  flex-shrink: 0;
}

.filter-count {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--accent-green);
  margin-left: auto;
}

.filter-checkboxes {
  display: flex;
  flex-wrap: wrap;
  gap: 0.625rem;
  padding: 0.5rem;
  background: var(--bg-card);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-color);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.375rem 0.625rem;
  border-radius: var(--radius-sm);
  transition: all var(--duration-fast) var(--easing-standard);
}

.checkbox-label:hover {
  background: var(--bg-elevated);
  color: var(--text-primary);
}

.checkbox-label input[type="checkbox"] {
  width: 1.125rem;
  height: 1.125rem;
  cursor: pointer;
  accent-color: var(--accent-green);
  flex-shrink: 0;
}

.checkbox-label input[type="checkbox"]:checked + span {
  color: var(--accent-green);
  font-weight: 600;
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
  transition: all var(--duration-fast) var(--easing-standard);
}

.multiselect:focus {
  outline: none;
  border-color: var(--accent-green);
  box-shadow: 0 0 0 3px rgba(163, 230, 53, 0.1);
}

.multiselect option:checked {
  background: var(--accent-green) linear-gradient(0deg, var(--accent-green) 0%, var(--accent-green) 100%);
  color: var(--bg-card);
  font-weight: 600;
}

.clear-filter {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.875rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--duration-fast) var(--easing-standard);
  margin-top: 0.5rem;
}

.clear-filter:hover {
  background: var(--bg-surface);
  border-color: var(--accent-green);
  color: var(--accent-green);
  transform: translateY(-1px);
}

.clear-filter svg {
  flex-shrink: 0;
}

.numeric-filters {
  margin-top: 0.5rem;
}

.numeric-inputs {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.slider-container {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.slider-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  position: relative;
}

.slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: var(--bg-elevated);
  outline: none;
  -webkit-appearance: none;
  appearance: none;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--accent-green);
  cursor: pointer;
  border: 2px solid var(--bg-card);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: all var(--duration-fast) var(--easing-standard);
}

.slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 0 8px var(--accent-green);
}

.slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--accent-green);
  cursor: pointer;
  border: 2px solid var(--bg-card);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: all var(--duration-fast) var(--easing-standard);
}

.slider::-moz-range-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 0 8px var(--accent-green);
}

.slider-values {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.numeric-input {
  flex: 1;
  padding: 0.5rem 0.75rem;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: 0.8125rem;
  transition: all var(--duration-fast) var(--easing-standard);
}

.numeric-input.small {
  flex: 0 0 100px;
  padding: 0.375rem 0.5rem;
  font-size: 0.75rem;
}

.numeric-input:focus {
  outline: none;
  border-color: var(--accent-green);
  box-shadow: 0 0 0 3px rgba(163, 230, 53, 0.1);
}

.numeric-input::placeholder {
  color: var(--text-tertiary);
}

.numeric-separator {
  font-size: 0.8125rem;
  color: var(--text-secondary);
  font-weight: 500;
  flex-shrink: 0;
}

.clear-numeric {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  padding: 0;
  background: var(--bg-elevated);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--duration-fast) var(--easing-standard);
  flex-shrink: 0;
}

.clear-numeric:hover {
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
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--duration-fast) var(--easing-standard);
}

.btn-reset-filters:hover {
  background: var(--bg-surface);
  border-color: #ef4444;
  color: #ef4444;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.1);
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
