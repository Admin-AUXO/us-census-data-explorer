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
import { computed } from 'vue'
import { useCensusStore } from '../../stores/census'
import { Filter, MapPin, Globe, Building, Map, X, Activity } from 'lucide-vue-next'
import { useFilterCount } from '../../composables/useFilterCount'
import { useFilterData } from '../../composables/useFilterData'
import { useAvailableFilters } from '../../composables/useAvailableFilters'
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
const { hasActiveFilters, activeFilterCount } = useFilterCount()
const { getBaseFilteredData } = useFilterData()
const {
  availableRegions,
  availableStates,
  availableDivisions,
  availableMetroAreas,
  availableUrbanRural,
  availableAiannh,
  availableCongressionalDistricts
} = useAvailableFilters()

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





</script>

<style scoped>
</style>
