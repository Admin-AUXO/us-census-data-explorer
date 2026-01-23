import { computed } from 'vue'
import { useCensusStore } from '../stores/census'

export const useFilterCount = () => {
  const store = useCensusStore()
  
  const hasActiveFilters = computed(() => {
    const f = store.dimensionFilters
    if (!f) return false
    return (
      (f.selectedStates?.length > 0 && f.selectedStates.length < 50) ||
      f.selectedRegions?.length > 0 ||
      f.selectedDivisions?.length > 0 ||
      f.selectedCongressionalDistricts?.length > 0 ||
      f.selectedAiannh?.length > 0 ||
      f.selectedUrbanRural?.length > 0 ||
      f.selectedMetroAreas?.length > 0 ||
      (f.areaMin != null && f.areaMin !== '') ||
      (f.areaMax != null && f.areaMax !== '') ||
      (f.metricValueMin != null && f.metricValueMin !== '') ||
      (f.metricValueMax != null && f.metricValueMax !== '')
    )
  })
  
  const activeFilterCount = computed(() => {
    const f = store.dimensionFilters
    if (!f) return 0
    let count = 0
    if (f.selectedStates?.length > 0 && f.selectedStates.length < 50) count++
    if (f.selectedRegions?.length > 0) count++
    if (f.selectedDivisions?.length > 0) count++
    if (f.selectedCongressionalDistricts?.length > 0) count++
    if (f.selectedAiannh?.length > 0) count++
    if (f.selectedUrbanRural?.length > 0) count++
    if (f.selectedMetroAreas?.length > 0) count++
    if (f.areaMin != null && f.areaMin !== '') count++
    if (f.areaMax != null && f.areaMax !== '') count++
    if (f.metricValueMin != null && f.metricValueMin !== '') count++
    if (f.metricValueMax != null && f.metricValueMax !== '') count++
    return count
  })
  
  return {
    hasActiveFilters,
    activeFilterCount
  }
}
