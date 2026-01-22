<template>
  <Teleport to="body">
    <transition name="sidebar">
      <div v-if="isOpen" class="sidebar-overlay" @click="$emit('close')">
        <div class="sidebar-panel" @click.stop>
          <div class="sidebar-header">
            <div class="sidebar-title">
              <Filter :size="20" />
              <h3>Advanced Filters</h3>
              <span v-if="hasActiveFilters" class="filter-badge">{{ activeFilterCount }}</span>
            </div>
            <button class="sidebar-close" @click="$emit('close')" aria-label="Close filters">
              <X :size="20" />
            </button>
          </div>
          
          <div class="sidebar-content">
            <div v-if="hasActiveFilters" class="filter-actions-top">
              <button @click="store.resetFilters()" class="btn-reset-filters">
                <X :size="16" />
                Reset All Filters
                <span class="filter-count-badge">{{ activeFilterCount }}</span>
              </button>
            </div>
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
              <MultiSelectList
                v-model="store.dimensionFilters.selectedStates"
                :items="availableStates"
                search-placeholder="Search states..."
              />
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
              <label 
                v-for="division in availableDivisions" 
                :key="division" 
                class="checkbox-label"
                :class="{ 'not-selected': !store.dimensionFilters.selectedDivisions.includes(division) }"
              >
                <input
                  type="checkbox"
                  :value="division"
                  v-model="store.dimensionFilters.selectedDivisions"
                />
                <span>{{ division }}</span>
                <span v-if="!store.dimensionFilters.selectedDivisions.includes(division)" class="available-badge">Available</span>
              </label>
            </div>
          </div>
          <div class="filter-group numeric-filters">
            <label class="filter-label">
              <TrendingUp :size="16" />
              <span>Population Range</span>
            </label>
            <div class="slider-container">
              <div class="range-info">
                <span class="range-label">Range: {{ populationRange.min.toLocaleString() }} - {{ populationRange.max.toLocaleString() }}</span>
              </div>
              <DoubleRangeSlider
                v-model="populationRangeValue"
                :min="populationRange.min"
                :max="populationRange.max"
                :step="populationRange.step"
              />
            </div>
          </div>
          <div class="filter-group numeric-filters">
            <label class="filter-label">
              <MapPin :size="16" />
              <span>Area Range (km²)</span>
            </label>
            <div class="slider-container">
              <div class="range-info">
                <span class="range-label">Range: {{ areaRange.min.toLocaleString() }} - {{ areaRange.max.toLocaleString() }} km²</span>
              </div>
              <DoubleRangeSlider
                v-model="areaRangeValue"
                :min="areaRange.min"
                :max="areaRange.max"
                :step="areaRange.step"
              />
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
              <label 
                v-for="ur in availableUrbanRural" 
                :key="ur" 
                class="checkbox-label"
                :class="{ 'not-selected': !store.dimensionFilters.selectedUrbanRural.includes(ur) }"
              >
                <input
                  type="checkbox"
                  :value="ur"
                  v-model="store.dimensionFilters.selectedUrbanRural"
                />
                <span>{{ ur }}</span>
                <span v-if="!store.dimensionFilters.selectedUrbanRural.includes(ur)" class="available-badge">Available</span>
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
              <MultiSelectList
                v-model="store.dimensionFilters.selectedAiannh"
                :items="availableAiannh"
                search-placeholder="Search AIANNH areas..."
              />
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
              <MultiSelectList
                :key="`cd-${store.dimensionFilters.selectedCongressionalDistricts.length}`"
                v-model="store.dimensionFilters.selectedCongressionalDistricts"
                :items="availableCongressionalDistricts"
                search-placeholder="Search districts..."
              />
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
              <MultiSelectList
                v-model="store.dimensionFilters.selectedMetroAreas"
                :items="availableMetroAreas"
                search-placeholder="Search metro areas..."
              />
            </div>
          </div>
          <div class="filter-group numeric-filters">
            <label class="filter-label">
              <TrendingUp :size="16" />
              <span>Population Range</span>
            </label>
            <div class="slider-container">
              <div class="range-info">
                <span class="range-label">Range: {{ populationRange.min.toLocaleString() }} - {{ populationRange.max.toLocaleString() }}</span>
              </div>
              <DoubleRangeSlider
                v-model="populationRangeValue"
                :min="populationRange.min"
                :max="populationRange.max"
                :step="populationRange.step"
              />
            </div>
          </div>
          <div class="filter-group numeric-filters">
            <label class="filter-label">
              <MapPin :size="16" />
              <span>Area Range (km²)</span>
            </label>
            <div class="slider-container">
              <div class="range-info">
                <span class="range-label">Range: {{ areaRange.min.toLocaleString() }} - {{ areaRange.max.toLocaleString() }} km²</span>
              </div>
              <DoubleRangeSlider
                v-model="areaRangeValue"
                :min="areaRange.min"
                :max="areaRange.max"
                :step="areaRange.step"
              />
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
              <label 
                v-for="ur in availableUrbanRural" 
                :key="ur" 
                class="checkbox-label"
                :class="{ 'not-selected': !store.dimensionFilters.selectedUrbanRural.includes(ur) }"
              >
                <input
                  type="checkbox"
                  :value="ur"
                  v-model="store.dimensionFilters.selectedUrbanRural"
                />
                <span>{{ ur }}</span>
                <span v-if="!store.dimensionFilters.selectedUrbanRural.includes(ur)" class="available-badge">Available</span>
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
              <MultiSelectList
                v-model="store.dimensionFilters.selectedAiannh"
                :items="availableAiannh"
                search-placeholder="Search AIANNH areas..."
              />
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
              <MultiSelectList
                v-model="store.dimensionFilters.selectedMetroAreas"
                :items="availableMetroAreas"
                search-placeholder="Search metro areas..."
              />
            </div>
          </div>
          <div class="filter-group numeric-filters">
            <label class="filter-label">
              <TrendingUp :size="16" />
              <span>Population Range</span>
            </label>
            <div class="slider-container">
              <div class="range-info">
                <span class="range-label">Range: {{ populationRange.min.toLocaleString() }} - {{ populationRange.max.toLocaleString() }}</span>
              </div>
              <DoubleRangeSlider
                v-model="populationRangeValue"
                :min="populationRange.min"
                :max="populationRange.max"
                :step="populationRange.step"
              />
            </div>
          </div>
          <div class="filter-group numeric-filters">
            <label class="filter-label">
              <MapPin :size="16" />
              <span>Area Range (km²)</span>
            </label>
            <div class="slider-container">
              <div class="range-info">
                <span class="range-label">Range: {{ areaRange.min.toLocaleString() }} - {{ areaRange.max.toLocaleString() }} km²</span>
              </div>
              <DoubleRangeSlider
                v-model="areaRangeValue"
                :min="areaRange.min"
                :max="areaRange.max"
                :step="areaRange.step"
              />
            </div>
          </div>
          <div v-if="store.currentMetric && metricRange" class="filter-group numeric-filters">
            <label class="filter-label">
              <Activity :size="16" />
              <span>Metric Value Range</span>
            </label>
            <div class="slider-container">
              <div class="range-info">
                <span class="range-label">Range: {{ metricRange.min.toLocaleString() }} - {{ metricRange.max.toLocaleString() }}</span>
              </div>
              <DoubleRangeSlider
                v-model="metricRangeValue"
                :min="metricRange.min"
                :max="metricRange.max"
                :step="metricRange.step"
              />
            </div>
          </div>
        </div>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { computed, ref, watch, nextTick } from 'vue'
import { useCensusStore } from '../stores/census'
import { Filter, ChevronDown, MapPin, Globe, Building, Map, X, TrendingUp, Activity, Search } from 'lucide-vue-next'
import DoubleRangeSlider from './DoubleRangeSlider.vue'
import MultiSelectList from './MultiSelectList.vue'

defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
})

defineEmits(['close'])

const store = useCensusStore()

const populationRange = computed(() => {
  const filtered = getBaseFilteredData('population')
  if (!filtered || filtered.length === 0) {
    return { min: 0, max: 1000000, step: 1000 }
  }
  
  const popCol = filtered[0]?.total_population_2024 || 
                 filtered[0]?.total_population_2023 ||
                 filtered[0]?.total_population_2022 ||
                 Object.keys(filtered[0] || {}).find(k => k.includes('total_population'))
  
  if (!popCol) return { min: 0, max: 1000000, step: 1000 }
  
  const values = filtered
    .map(row => parseFloat(row[popCol]) || 0)
    .filter(v => v > 0)
  
  if (values.length === 0) return { min: 0, max: 1000000, step: 1000 }
  
  const min = Math.floor(Math.min(...values))
  const max = Math.ceil(Math.max(...values))
  const step = Math.max(1, Math.floor((max - min) / 1000))
  
  return { min, max, step }
})

const areaRange = computed(() => {
  const filtered = getBaseFilteredData('area')
  if (!filtered || filtered.length === 0) {
    return { min: 0, max: 100000, step: 100 }
  }
  
  const values = filtered
    .map(row => parseFloat(row.land_area_sq_km) || 0)
    .filter(v => v > 0)
  
  if (values.length === 0) return { min: 0, max: 100000, step: 100 }
  
  const min = Math.floor(Math.min(...values))
  const max = Math.ceil(Math.max(...values))
  const step = Math.max(0.1, (max - min) / 1000)
  
  return { min, max, step }
})

const metricRange = computed(() => {
  if (!store.currentMetric) return null
  
  const filtered = getBaseFilteredData('metric')
  if (!filtered || filtered.length === 0) {
    return null
  }
  
  const values = filtered
    .map(row => parseFloat(row[store.currentMetric]) || 0)
    .filter(v => !isNaN(v) && v !== 0)
  
  if (values.length === 0) return null
  
  const min = Math.floor(Math.min(...values))
  const max = Math.ceil(Math.max(...values))
  const step = Math.max(0.01, (max - min) / 1000)
  
  return { min, max, step }
})


const populationRangeValue = computed({
  get: () => ({
    min: store.dimensionFilters.populationMin,
    max: store.dimensionFilters.populationMax
  }),
  set: (val) => {
    store.dimensionFilters.populationMin = val.min
    store.dimensionFilters.populationMax = val.max
  }
})

const areaRangeValue = computed({
  get: () => ({
    min: store.dimensionFilters.areaMin,
    max: store.dimensionFilters.areaMax
  }),
  set: (val) => {
    store.dimensionFilters.areaMin = val.min
    store.dimensionFilters.areaMax = val.max
  }
})

const metricRangeValue = computed({
  get: () => ({
    min: store.dimensionFilters.metricValueMin,
    max: store.dimensionFilters.metricValueMax
  }),
  set: (val) => {
    store.dimensionFilters.metricValueMin = val.min
    store.dimensionFilters.metricValueMax = val.max
  }
})

const getBaseFilteredData = (excludeFilter = null) => {
  let dataset = null
  switch (store.currentLevel) {
    case 'state':
      dataset = store.data.state
      break
    case 'county':
      dataset = store.data.county?.filter(d => d.state_name === store.currentState)
      break
    case 'zcta5':
      dataset = store.data.zcta5?.filter(d =>
        d.state_name === store.currentState && d.county_name === store.currentCounty
      )
      break
  }
  if (!dataset) return []

  let filtered = [...dataset]

  if (store.currentLevel === 'state') {
    if (excludeFilter !== 'states' && store.dimensionFilters.selectedStates.length > 0) {
      const allStates = [...new Set(dataset.map(r => r.state_name).filter(Boolean))]
      if (store.dimensionFilters.selectedStates.length < allStates.length) {
        filtered = filtered.filter(d => store.dimensionFilters.selectedStates.includes(d.state_name))
      }
    }
    if (excludeFilter !== 'regions' && store.dimensionFilters.selectedRegions.length > 0) {
      filtered = filtered.filter(d => {
        const regionName = store.getRegionName(d.census_region)
        return store.dimensionFilters.selectedRegions.includes(regionName)
      })
    }
    if (excludeFilter !== 'divisions' && store.dimensionFilters.selectedDivisions.length > 0) {
      filtered = filtered.filter(d => {
        const divisionName = store.getDivisionName(d.census_division)
        return store.dimensionFilters.selectedDivisions.includes(divisionName)
      })
    }
  }

  if (store.dimensionFilters.populationMin !== null && store.dimensionFilters.populationMin !== '' && excludeFilter !== 'population') {
    const popCol = filtered[0]?.total_population_2024 || 
                   filtered[0]?.total_population_2023 ||
                   filtered[0]?.total_population_2022 ||
                   Object.keys(filtered[0] || {}).find(k => k.includes('total_population'))
    if (popCol) {
      filtered = filtered.filter(d => {
        const pop = parseFloat(d[popCol]) || 0
        return pop >= parseFloat(store.dimensionFilters.populationMin)
      })
    }
  }
  if (store.dimensionFilters.populationMax !== null && store.dimensionFilters.populationMax !== '' && excludeFilter !== 'population') {
    const popCol = filtered[0]?.total_population_2024 || 
                   filtered[0]?.total_population_2023 ||
                   filtered[0]?.total_population_2022 ||
                   Object.keys(filtered[0] || {}).find(k => k.includes('total_population'))
    if (popCol) {
      filtered = filtered.filter(d => {
        const pop = parseFloat(d[popCol]) || 0
        return pop <= parseFloat(store.dimensionFilters.populationMax)
      })
    }
  }
  if (store.dimensionFilters.areaMin !== null && store.dimensionFilters.areaMin !== '' && excludeFilter !== 'area') {
    filtered = filtered.filter(d => {
      const area = parseFloat(d.land_area_sq_km) || 0
      return area >= parseFloat(store.dimensionFilters.areaMin)
    })
  }
  if (store.dimensionFilters.areaMax !== null && store.dimensionFilters.areaMax !== '' && excludeFilter !== 'area') {
    filtered = filtered.filter(d => {
      const area = parseFloat(d.land_area_sq_km) || 0
      return area <= parseFloat(store.dimensionFilters.areaMax)
    })
  }
  if (store.currentMetric && store.dimensionFilters.metricValueMin !== null && store.dimensionFilters.metricValueMin !== '' && excludeFilter !== 'metric') {
    filtered = filtered.filter(d => {
      const val = parseFloat(d[store.currentMetric]) || 0
      return val >= parseFloat(store.dimensionFilters.metricValueMin)
    })
  }
  if (store.currentMetric && store.dimensionFilters.metricValueMax !== null && store.dimensionFilters.metricValueMax !== '' && excludeFilter !== 'metric') {
    filtered = filtered.filter(d => {
      const val = parseFloat(d[store.currentMetric]) || 0
      return val <= parseFloat(store.dimensionFilters.metricValueMax)
    })
  }

  if (store.currentLevel === 'county' && excludeFilter !== 'congressional') {
    const availableCDs = [...new Set(filtered.map(d => d.congressional_district || d.cd116 || '').filter(Boolean))]
    if (availableCDs.length > 0 && store.dimensionFilters.selectedCongressionalDistricts.length > 0 && store.dimensionFilters.selectedCongressionalDistricts.length < availableCDs.length) {
      filtered = filtered.filter(d => {
        const cd = d.congressional_district || d.cd116 || ''
        return store.dimensionFilters.selectedCongressionalDistricts.includes(cd)
      })
    }
  }
  if ((store.currentLevel === 'county' || store.currentLevel === 'zcta5') && excludeFilter !== 'aiannh') {
    const availableAiannh = [...new Set(filtered.map(d => d.aiannh_name || 'N/A').filter(a => a && a !== 'N/A'))]
    if (availableAiannh.length > 0 && store.dimensionFilters.selectedAiannh.length > 0 && store.dimensionFilters.selectedAiannh.length < availableAiannh.length) {
      filtered = filtered.filter(d => {
        const aiannh = d.aiannh_name || 'N/A'
        return store.dimensionFilters.selectedAiannh.includes(aiannh)
      })
    }
  }
  if ((store.currentLevel === 'county' || store.currentLevel === 'zcta5') && excludeFilter !== 'urbanRural') {
    if (store.dimensionFilters.selectedUrbanRural.length > 0) {
      filtered = filtered.filter(d => {
        const ur = d.urban_rural || 'N/A'
        return store.dimensionFilters.selectedUrbanRural.includes(ur)
      })
    }
  }
  if ((store.currentLevel === 'county' || store.currentLevel === 'zcta5') && excludeFilter !== 'metro') {
    const availableMetros = [...new Set(filtered.map(d => d.urban_area_name || (d.cbsa_code ? `CBSA: ${d.cbsa_code}` : null)).filter(Boolean))]
    if (availableMetros.length > 0 && store.dimensionFilters.selectedMetroAreas.length > 0 && store.dimensionFilters.selectedMetroAreas.length < availableMetros.length) {
      filtered = filtered.filter(d => {
        const metro = d.urban_area_name || (d.cbsa_code ? `CBSA: ${d.cbsa_code}` : null)
        return store.dimensionFilters.selectedMetroAreas.includes(metro)
      })
    }
  }

  return filtered
}

const availableRegions = computed(() => {
  if (!store.data.state || store.data.state.length === 0) return []
  const filtered = getBaseFilteredData('regions')
  if (filtered.length === 0) return []
  const regions = new Set()
  filtered.forEach(row => {
    if (row.census_region) {
      const regionName = store.getRegionName(row.census_region)
      if (regionName !== 'N/A') regions.add(regionName)
    }
  })
  return Array.from(regions).sort()
})

watch(() => availableRegions.value, (regions) => {
  if (regions.length === 0) {
    if (store.dimensionFilters.selectedRegions.length > 0) {
      store.dimensionFilters.selectedRegions = []
    }
    return
  }
  const currentSelected = store.dimensionFilters.selectedRegions
  if (currentSelected.length === 0) {
    store.dimensionFilters.selectedRegions = [...regions]
    return
  }
  const validRegions = currentSelected.filter(r => regions.includes(r))
  const allSelected = validRegions.length === regions.length && regions.every(r => validRegions.includes(r))
  if (!allSelected && (validRegions.length !== currentSelected.length || validRegions.length === 0)) {
    store.dimensionFilters.selectedRegions = validRegions.length > 0 ? validRegions : [...regions]
  }
}, { immediate: true, flush: 'sync' })

const availableStates = computed(() => {
  if (!store.data.state || store.data.state.length === 0) return []
  const filtered = getBaseFilteredData('states')
  return [...new Set(filtered.map(r => r.state_name).filter(Boolean))].sort()
})

watch(() => availableStates.value, (states, oldStates) => {
  if (states.length === 0) {
    if (store.dimensionFilters.selectedStates.length > 0) {
      store.dimensionFilters.selectedStates = []
    }
    return
  }
  const currentSelected = store.dimensionFilters.selectedStates
  if (currentSelected.length === 0) {
    store.dimensionFilters.selectedStates = [...states]
    return
  }
  const validStates = currentSelected.filter(s => states.includes(s))
  const allSelected = validStates.length === states.length && states.every(s => validStates.includes(s))
  if (!allSelected && (validStates.length !== currentSelected.length || validStates.length === 0)) {
    store.dimensionFilters.selectedStates = validStates.length > 0 ? validStates : [...states]
  }
}, { immediate: true, flush: 'sync' })

const availableDivisions = computed(() => {
  if (!store.data.state || store.data.state.length === 0) return []
  const filtered = getBaseFilteredData('divisions')
  if (filtered.length === 0) return []
  const divisions = new Set()
  filtered.forEach(row => {
    if (row.census_division) {
      const divisionName = store.getDivisionName(row.census_division)
      if (divisionName !== 'N/A') divisions.add(divisionName)
    }
  })
  return Array.from(divisions).sort()
})

watch(() => availableDivisions.value, (divisions) => {
  if (divisions.length === 0) {
    if (store.dimensionFilters.selectedDivisions.length > 0) {
      store.dimensionFilters.selectedDivisions = []
    }
    return
  }
  const currentSelected = store.dimensionFilters.selectedDivisions
  if (currentSelected.length === 0) {
    store.dimensionFilters.selectedDivisions = [...divisions]
    return
  }
  const validDivisions = currentSelected.filter(d => divisions.includes(d))
  const allSelected = validDivisions.length === divisions.length && divisions.every(d => validDivisions.includes(d))
  if (!allSelected && (validDivisions.length !== currentSelected.length || validDivisions.length === 0)) {
    store.dimensionFilters.selectedDivisions = validDivisions.length > 0 ? validDivisions : [...divisions]
  }
}, { immediate: true, flush: 'sync' })

const availableMetroAreas = computed(() => {
  if (store.currentLevel !== 'county' && store.currentLevel !== 'zcta5') return []
  if (!store.data.county && !store.data.zcta5) return []
  const filtered = getBaseFilteredData('metro')
  if (filtered.length === 0) return []
  const metroSet = new Set()
  filtered.forEach(row => {
    const metro = row.urban_area_name || (row.cbsa_code ? `CBSA: ${row.cbsa_code}` : null)
    if (metro && metro !== 'N/A') metroSet.add(metro)
  })
  return Array.from(metroSet).sort()
})

watch(() => availableMetroAreas.value, (metros) => {
  if (metros.length === 0) {
    if (store.dimensionFilters.selectedMetroAreas.length > 0) {
      store.dimensionFilters.selectedMetroAreas = []
    }
    return
  }
  const currentSelected = store.dimensionFilters.selectedMetroAreas
  if (currentSelected.length === 0) {
    store.dimensionFilters.selectedMetroAreas = [...metros]
    return
  }
  const validMetros = currentSelected.filter(m => metros.includes(m))
  const allSelected = validMetros.length === metros.length && metros.every(m => validMetros.includes(m))
  if (!allSelected && (validMetros.length !== currentSelected.length || validMetros.length === 0)) {
    store.dimensionFilters.selectedMetroAreas = validMetros.length > 0 ? validMetros : [...metros]
  }
}, { immediate: true, flush: 'sync' })

const availableUrbanRural = computed(() => {
  if (store.currentLevel !== 'county' && store.currentLevel !== 'zcta5') return []
  if (!store.data.county && !store.data.zcta5) return []
  const filtered = getBaseFilteredData('urbanRural')
  if (filtered.length === 0) return []
  const ur = new Set()
  filtered.forEach(row => {
    if (row.urban_rural && row.urban_rural !== 'N/A') {
      ur.add(row.urban_rural)
    }
  })
  return Array.from(ur).sort()
})

watch(() => availableUrbanRural.value, (urList) => {
  if (urList.length === 0) {
    if (store.dimensionFilters.selectedUrbanRural.length > 0) {
      store.dimensionFilters.selectedUrbanRural = []
    }
    return
  }
  const currentSelected = store.dimensionFilters.selectedUrbanRural
  if (currentSelected.length === 0) {
    store.dimensionFilters.selectedUrbanRural = [...urList]
    return
  }
  const validUR = currentSelected.filter(u => urList.includes(u))
  const allSelected = validUR.length === urList.length && urList.every(u => validUR.includes(u))
  if (!allSelected && (validUR.length !== currentSelected.length || validUR.length === 0)) {
    store.dimensionFilters.selectedUrbanRural = validUR.length > 0 ? validUR : [...urList]
  }
}, { immediate: true, flush: 'sync' })

const availableAiannh = computed(() => {
  if (store.currentLevel !== 'county' && store.currentLevel !== 'zcta5') return []
  if (!store.data.county && !store.data.zcta5) return []
  const filtered = getBaseFilteredData('aiannh')
  if (filtered.length === 0) return []
  const aiannh = new Set()
  filtered.forEach(row => {
    if (row.aiannh_name && row.aiannh_name !== 'N/A' && row.aiannh_name !== '') {
      aiannh.add(row.aiannh_name)
    }
  })
  return Array.from(aiannh).sort()
})

watch(() => availableAiannh.value, (aiannhList) => {
  if (aiannhList.length === 0) {
    if (store.dimensionFilters.selectedAiannh.length > 0) {
      store.dimensionFilters.selectedAiannh = []
    }
    return
  }
  const currentSelected = store.dimensionFilters.selectedAiannh
  if (currentSelected.length === 0) {
    store.dimensionFilters.selectedAiannh = [...aiannhList]
    return
  }
  const validAiannh = currentSelected.filter(a => aiannhList.includes(a))
  const allSelected = validAiannh.length === aiannhList.length && aiannhList.every(a => validAiannh.includes(a))
  if (!allSelected && (validAiannh.length !== currentSelected.length || validAiannh.length === 0)) {
    store.dimensionFilters.selectedAiannh = validAiannh.length > 0 ? validAiannh : [...aiannhList]
  }
}, { immediate: true, flush: 'sync' })

const availableCongressionalDistricts = computed(() => {
  if (store.currentLevel !== 'county') return []
  if (!store.data.county) return []
  const filtered = getBaseFilteredData('congressional')
  if (filtered.length === 0) return []
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

watch(() => availableCongressionalDistricts.value, (cdList) => {
  if (cdList.length === 0) {
    if (store.dimensionFilters.selectedCongressionalDistricts.length > 0) {
      store.dimensionFilters.selectedCongressionalDistricts = []
    }
    return
  }
  const currentSelected = store.dimensionFilters.selectedCongressionalDistricts
  if (currentSelected.length === 0) {
    store.dimensionFilters.selectedCongressionalDistricts = [...cdList]
    return
  }
  const validCDs = currentSelected.filter(cd => cdList.includes(cd))
  const allSelected = validCDs.length === cdList.length && cdList.every(cd => validCDs.includes(cd))
  if (!allSelected && (validCDs.length !== currentSelected.length || validCDs.length === 0)) {
    store.dimensionFilters.selectedCongressionalDistricts = validCDs.length > 0 ? validCDs : [...cdList]
  }
}, { immediate: true, flush: 'sync' })

watch(() => store.data.state, () => {
}, { deep: true, immediate: true, flush: 'sync' })

watch(() => store.data.county, () => {
}, { deep: true, immediate: true, flush: 'sync' })

watch(() => store.data.zcta5, () => {
}, { deep: true, immediate: true, flush: 'sync' })

watch(() => store.filteredData, () => {
}, { deep: true, immediate: true, flush: 'sync' })

watch(() => store.currentLevel, () => {
}, { immediate: true, flush: 'sync' })

watch(() => [
  store.dimensionFilters.selectedStates,
  store.dimensionFilters.selectedRegions,
  store.dimensionFilters.selectedDivisions,
  store.dimensionFilters.selectedCongressionalDistricts,
  store.dimensionFilters.selectedAiannh,
  store.dimensionFilters.selectedUrbanRural,
  store.dimensionFilters.selectedMetroAreas,
  store.dimensionFilters.populationMin,
  store.dimensionFilters.populationMax,
  store.dimensionFilters.areaMin,
  store.dimensionFilters.areaMax,
  store.dimensionFilters.metricValueMin,
  store.dimensionFilters.metricValueMax
], () => {
}, { deep: true, flush: 'sync' })

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
.sidebar-overlay {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  background: var(--overlay-bg) !important;
  z-index: var(--z-index-sidebar-overlay) !important;
  display: flex !important;
  align-items: flex-start !important;
  justify-content: flex-end !important;
  padding: 0 !important;
  margin: 0 !important;
  backdrop-filter: blur(var(--blur-sm)) !important;
  visibility: visible !important;
  opacity: 1 !important;
  pointer-events: auto !important;
}

.sidebar-panel {
  width: var(--size-sidebar-width) !important;
  max-width: 90vw !important;
  height: 100vh !important;
  max-height: 100vh !important;
  background: var(--bg-surface) !important;
  border-left: var(--border-width-sm) solid var(--border-color) !important;
  box-shadow: -4px 0 24px var(--overlay-bg-light) !important;
  display: flex !important;
  flex-direction: column !important;
  overflow: hidden !important;
  position: relative !important;
  z-index: var(--z-index-sidebar-panel) !important;
  visibility: visible !important;
  opacity: 1 !important;
  pointer-events: auto !important;
}

.sidebar-header {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  padding: var(--spacing-lg) var(--spacing-xl) !important;
  border-bottom: var(--border-width-sm) solid var(--border-color) !important;
  background: var(--bg-elevated) !important;
  flex-shrink: 0 !important;
  width: 100% !important;
  box-sizing: border-box !important;
}

.sidebar-title {
  display: flex !important;
  align-items: center !important;
  gap: var(--spacing-md) !important;
  flex: 1 !important;
  min-width: 0 !important;
}

.sidebar-title h3 {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin: 0;
}

.sidebar-title svg {
  color: var(--accent-green);
  flex-shrink: 0;
}

.sidebar-title .filter-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: var(--size-lg);
  height: var(--size-lg);
  padding: 0 var(--spacing-sm);
  background: var(--accent-green);
  color: var(--bg-card);
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  margin-left: var(--spacing-sm);
}

.sidebar-close {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: var(--size-input-height) !important;
  height: var(--size-input-height) !important;
  padding: 0 !important;
  background: var(--bg-card) !important;
  border: var(--border-width-sm) solid var(--border-color) !important;
  border-radius: var(--radius-md) !important;
  color: var(--text-secondary) !important;
  cursor: pointer !important;
  transition: all var(--duration-fast) var(--easing-standard) !important;
  flex-shrink: 0 !important;
  box-sizing: border-box !important;
}

.sidebar-close:hover {
  background: var(--bg-surface);
  border-color: var(--accent-green);
  color: var(--accent-green);
  transform: rotate(90deg);
}

.sidebar-content {
  flex: 1 !important;
  overflow-y: auto !important;
  overflow-x: hidden !important;
  padding: var(--spacing-xl) var(--spacing-lg) !important;
  display: flex !important;
  flex-direction: column !important;
  gap: var(--spacing-sm) !important;
  width: 100% !important;
  box-sizing: border-box !important;
  min-height: 0 !important;
}

@media (max-width: 768px) {
  .sidebar-panel {
    width: var(--size-sidebar-width-mobile) !important;
    max-width: var(--size-sidebar-width-mobile) !important;
  }
  
  .sidebar-content {
    padding: var(--spacing-md) !important;
  }
  
  .filter-group {
    padding: var(--spacing-md) !important;
  }
  
  .slider-container {
    padding: var(--spacing-sm) !important;
  }
}

.filter-section {
  display: flex !important;
  flex-direction: column !important;
  gap: var(--spacing-2xl) !important;
  margin-bottom: 0 !important;
  width: 100% !important;
  box-sizing: border-box !important;
}

.filter-group {
  display: flex !important;
  flex-direction: column !important;
  gap: var(--spacing-md) !important;
  padding: var(--spacing-md) var(--spacing-lg) !important;
  background: var(--bg-card) !important;
  border: var(--border-width-sm) solid var(--border-color) !important;
  border-radius: var(--radius-md) !important;
  transition: all var(--duration-fast) var(--easing-standard) !important;
  width: 100% !important;
  box-sizing: border-box !important;
  min-width: 0 !important;
}

.filter-group:hover {
  border-color: var(--border-color-light);
  background: var(--bg-elevated);
}

.filter-label {
  display: flex !important;
  align-items: center !important;
  gap: var(--spacing-sm) !important;
  font-size: var(--font-size-md) !important;
  font-weight: var(--font-weight-semibold) !important;
  color: var(--text-primary) !important;
  margin-bottom: 0 !important;
  padding-bottom: var(--spacing-xs) !important;
  border-bottom: var(--border-width-sm) solid var(--border-color) !important;
  width: 100% !important;
  box-sizing: border-box !important;
}

.filter-label svg {
  color: var(--accent-green);
  flex-shrink: 0;
}

.filter-count {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--accent-green);
  margin-left: auto;
  padding: 0.125rem 0.5rem;
  background: rgba(163, 230, 53, 0.15);
  border-radius: var(--radius-full);
}

.filter-checkboxes {
  display: grid !important;
  grid-template-columns: repeat(2, 1fr) !important;
  gap: 0.5rem !important;
  padding: 0.75rem !important;
  background: var(--bg-elevated) !important;
  border-radius: var(--radius-sm) !important;
  border: 1px solid var(--border-color) !important;
  margin-top: 0.25rem !important;
  width: 100% !important;
  box-sizing: border-box !important;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
  cursor: pointer;
  padding: var(--spacing-sm) var(--spacing-sm);
  border-radius: var(--radius-sm);
  transition: all var(--duration-fast) var(--easing-standard);
  min-width: 0;
  width: 100%;
  position: relative;
}

.checkbox-label:hover {
  background: var(--bg-elevated);
  color: var(--text-primary);
}

.checkbox-label.not-selected {
  opacity: 0.7;
  border: var(--border-width-sm) solid transparent;
}

.checkbox-label.not-selected:hover {
  opacity: 1;
  border-color: var(--border-color);
  background: var(--bg-card);
}

.checkbox-label input[type="checkbox"] {
  width: var(--size-icon-sm);
  height: var(--size-icon-sm);
  cursor: pointer;
  accent-color: var(--accent-green);
  flex-shrink: 0;
}

.checkbox-label input[type="checkbox"]:checked + span {
  color: var(--accent-green);
  font-weight: var(--font-weight-semibold);
}

.available-badge {
  margin-left: auto;
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  font-weight: var(--font-weight-medium);
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--bg-card);
  border-radius: var(--radius-sm);
  border: var(--border-width-sm) solid var(--border-color);
}

.filter-multiselect {
  display: flex !important;
  flex-direction: column !important;
  gap: 0.625rem !important;
  margin-top: 0.25rem !important;
  width: 100% !important;
  box-sizing: border-box !important;
  min-width: 0 !important;
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
  box-shadow: var(--shadow-focus);
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

input.search-input::-webkit-input-placeholder {
  color: var(--text-tertiary);
}

input.search-input::-moz-placeholder {
  color: var(--text-tertiary);
  opacity: 1;
}

input.search-input:-ms-input-placeholder {
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
  background: var(--bg-elevated);
  color: var(--text-primary);
}

.multiselect {
  padding: 0.5rem 0;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--bg-elevated);
  color: var(--text-primary);
  font-size: var(--font-size-base);
  min-height: 180px;
  max-height: 240px;
  transition: all var(--duration-fast) var(--easing-standard);
  line-height: 2;
  overflow-y: auto;
  cursor: pointer;
}

.multiselect::-webkit-scrollbar {
  width: 8px;
}

.multiselect::-webkit-scrollbar-track {
  background: var(--bg-card);
  border-radius: 4px;
}

.multiselect::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 4px;
}

.multiselect::-webkit-scrollbar-thumb:hover {
  background: var(--accent-green-opacity-30);
}

.multiselect option {
  padding: 0.625rem 0.875rem;
  margin: 0.125rem 0.5rem;
  border-radius: var(--radius-sm);
  transition: all var(--duration-fast) var(--easing-standard);
  cursor: pointer;
  background: transparent;
  color: var(--text-primary);
}

.multiselect option:hover {
  background: var(--bg-surface);
  color: var(--accent-green);
}

.multiselect option:checked,
.multiselect option:focus {
  background: rgba(163, 230, 53, 0.25);
  color: var(--accent-green);
  font-weight: var(--font-weight-semibold);
}

.multiselect option:checked:hover {
  background: rgba(163, 230, 53, 0.35);
}

.multiselect-container {
  position: relative;
}

.multiselect-empty {
  padding: 2rem 1rem;
  text-align: center;
  color: var(--text-tertiary);
  font-size: var(--font-size-base);
  background: var(--bg-elevated);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  min-height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.multiselect-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 0.5rem;
}

.select-all-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  padding: 0.5rem 0.875rem;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--accent-green);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all var(--duration-fast) var(--easing-standard);
  width: fit-content;
}

.select-all-btn:hover {
  background: var(--bg-elevated);
  border-color: var(--accent-green);
  transform: translateY(-1px);
}

.multiselect:focus {
  outline: none;
  border-color: var(--accent-green);
  box-shadow: var(--shadow-focus);
}

.multiselect option:checked {
  background: var(--accent-green) linear-gradient(0deg, var(--accent-green) 0%, var(--accent-green) 100%);
  color: var(--bg-card);
  font-weight: var(--font-weight-semibold);
}

.clear-filter {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  padding: 0.5rem 0.875rem;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--duration-fast) var(--easing-standard);
  margin-top: 0;
  align-self: flex-start;
  width: fit-content;
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
  margin-top: 0;
}

.numeric-inputs {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.slider-container {
  display: flex !important;
  flex-direction: column !important;
  gap: var(--spacing-sm) !important;
  padding: var(--spacing-md) !important;
  background: var(--bg-elevated) !important;
  border-radius: var(--radius-sm) !important;
  border: var(--border-width-sm) solid var(--border-color) !important;
  margin-top: var(--spacing-xs) !important;
  width: 100% !important;
  box-sizing: border-box !important;
}

.range-info {
  display: flex !important;
  justify-content: space-between !important;
  align-items: center !important;
  padding-bottom: var(--spacing-xs) !important;
  border-bottom: var(--border-width-sm) solid var(--border-color) !important;
  margin-bottom: var(--spacing-xs) !important;
}

.range-label {
  font-size: var(--font-size-sm) !important;
  color: var(--text-secondary) !important;
  font-weight: var(--font-weight-medium) !important;
}

.slider {
  width: 100%;
  height: var(--size-slider-track);
  border-radius: var(--radius-sm);
  background: var(--bg-card);
  outline: none;
  -webkit-appearance: none;
  appearance: none;
  cursor: pointer;
  position: relative;
  transition: background 0.2s ease;
}

.slider:hover {
  background: var(--bg-surface);
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: var(--size-thumb);
  height: var(--size-thumb);
  border-radius: var(--radius-circle);
  background: var(--accent-green);
  cursor: pointer;
  border: var(--size-thumb-border) solid var(--bg-card);
  box-shadow: var(--shadow-sm), 0 0 0 var(--size-thumb-border) var(--accent-green-opacity-20);
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  z-index: 2;
}

.slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 3px 12px var(--accent-green-opacity-50), 0 0 0 5px var(--accent-green-opacity-20);
}

.slider::-webkit-slider-thumb:active {
  transform: scale(1.15);
  box-shadow: 0 2px 10px var(--accent-green-opacity-60), 0 0 0 4px var(--accent-green-opacity-20);
}

.slider::-moz-range-thumb {
  width: var(--size-thumb);
  height: var(--size-thumb);
  border-radius: var(--radius-circle);
  background: var(--accent-green);
  cursor: pointer;
  border: var(--size-thumb-border) solid var(--bg-card);
  box-shadow: var(--shadow-sm), 0 0 0 var(--size-thumb-border) var(--accent-green-opacity-20);
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  z-index: 2;
}

.slider::-moz-range-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 3px 12px var(--accent-green-opacity-50), 0 0 0 5px var(--accent-green-opacity-20);
}

.slider::-moz-range-thumb:active {
  transform: scale(1.15);
  box-shadow: 0 2px 10px var(--accent-green-opacity-60), 0 0 0 4px var(--accent-green-opacity-20);
}

.slider::-moz-range-track {
  height: var(--size-slider-track);
  border-radius: var(--radius-sm);
  background: var(--bg-card);
  transition: background 0.2s ease;
}

.slider-values {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  flex-wrap: wrap;
}

.numeric-input {
  flex: 1;
  padding: 0.5rem 0.75rem;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: var(--font-size-base);
  transition: all var(--duration-fast) var(--easing-standard);
  min-width: 0;
}

.numeric-input.small {
  flex: 0 0 110px;
  padding: 0.5rem 0.625rem;
  font-size: var(--font-size-base);
  text-align: center;
}

.numeric-input:focus {
  outline: none;
  border-color: var(--accent-green);
  box-shadow: var(--shadow-focus);
  background: var(--bg-surface);
}

.numeric-input::placeholder {
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
  width: 2rem;
  height: 2rem;
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

.filter-actions-top {
  margin-bottom: 1rem !important;
  padding-bottom: 1rem !important;
  border-bottom: 1px solid var(--border-color) !important;
  display: flex !important;
  justify-content: flex-start !important;
  width: 100% !important;
  box-sizing: border-box !important;
}

.btn-reset-filters {
  display: flex !important;
  align-items: center !important;
  gap: 0.625rem !important;
  padding: 0.75rem 1.25rem !important;
  background: var(--bg-elevated) !important;
  border: 1px solid var(--border-color) !important;
  border-radius: var(--radius-md) !important;
  color: var(--text-secondary) !important;
  font-size: 0.8125rem !important;
  font-weight: 600 !important;
  cursor: pointer !important;
  transition: all var(--duration-fast) var(--easing-standard) !important;
  width: 100% !important;
  justify-content: center !important;
  box-sizing: border-box !important;
}

.filter-count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.5rem;
  height: 1.5rem;
  padding: 0 0.5rem;
  background: var(--accent-green);
  color: var(--bg-card);
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  margin-left: auto;
}

.btn-reset-filters:hover {
  background: var(--bg-surface);
  border-color: var(--color-error);
  color: var(--color-error);
  transform: translateY(-1px);
  box-shadow: var(--shadow-error-sm);
}

.sidebar-enter-active,
.sidebar-leave-active {
  transition: opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

.sidebar-enter-active .sidebar-panel,
.sidebar-leave-active .sidebar-panel {
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
  will-change: transform;
}

.sidebar-enter-from {
  opacity: 0 !important;
}

.sidebar-enter-from .sidebar-panel {
  transform: translateX(100%) !important;
}

.sidebar-leave-to {
  opacity: 0 !important;
}

.sidebar-leave-to .sidebar-panel {
  transform: translateX(100%) !important;
}

.sidebar-enter-to,
.sidebar-leave-from {
  opacity: 1 !important;
}

.sidebar-enter-to .sidebar-panel,
.sidebar-leave-from .sidebar-panel {
  transform: translateX(0) !important;
}

@media (max-width: 768px) {
  .sidebar-panel {
    width: 100vw;
    max-width: 100vw;
  }
  
  .sidebar-content {
    padding: 1rem;
  }
}
</style>
