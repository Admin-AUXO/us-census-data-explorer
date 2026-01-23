import { computed, watch } from 'vue'
import { useCensusStore } from '../stores/census'
import { useFilterData } from './useFilterData'

export const useAvailableFilters = () => {
  const store = useCensusStore()
  const { getBaseFilteredData } = useFilterData()
  
  const syncFilterSelection = (availableItems, selectedItems, setSelected) => {
    if (!availableItems.length) {
      if (selectedItems.length) setSelected([])
      return
    }
    
    if (!selectedItems.length) {
      setSelected([...availableItems])
      return
    }
    
    const validItems = selectedItems.filter(item => availableItems.includes(item))
    const allSelected = validItems.length === availableItems.length
    
    if (!allSelected && (validItems.length !== selectedItems.length || !validItems.length)) {
      setSelected(validItems.length ? validItems : [...availableItems])
    }
  }
  
  const availableRegions = computed(() => {
    if (!store.data.state?.length) return []
    const filtered = getBaseFilteredData('regions')
    if (!filtered.length) return []
    const regions = new Set()
    filtered.forEach(row => {
      if (row.census_region) {
        const regionName = store.getRegionName(row.census_region)
        if (regionName !== 'N/A') regions.add(regionName)
      }
    })
    return Array.from(regions).sort()
  })
  
  const availableStates = computed(() => {
    if (!store.data.state?.length) return []
    return [...new Set(getBaseFilteredData('states').map(r => r.state_name).filter(Boolean))].sort()
  })
  
  const availableDivisions = computed(() => {
    if (!store.data.state?.length) return []
    const filtered = getBaseFilteredData('divisions')
    if (!filtered.length) return []
    const divisions = new Set()
    filtered.forEach(row => {
      if (row.census_division) {
        const divisionName = store.getDivisionName(row.census_division)
        if (divisionName !== 'N/A') divisions.add(divisionName)
      }
    })
    return Array.from(divisions).sort()
  })
  
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
  
  const availableUrbanRural = computed(() => {
    if (store.currentLevel !== 'county' && store.currentLevel !== 'zcta5') return []
    if (!store.data.county && !store.data.zcta5) return []
    const filtered = getBaseFilteredData('urbanRural')
    if (!filtered.length) return []
    const ur = new Set()
    filtered.forEach(row => {
      if (row.urban_rural && row.urban_rural !== 'N/A') ur.add(row.urban_rural)
    })
    return Array.from(ur).sort()
  })
  
  const availableAiannh = computed(() => {
    if (store.currentLevel !== 'county' && store.currentLevel !== 'zcta5') return []
    if (!store.data.county && !store.data.zcta5) return []
    const filtered = getBaseFilteredData('aiannh')
    if (!filtered.length) return []
    const aiannh = new Set()
    filtered.forEach(row => {
      if (row.aiannh_name && row.aiannh_name !== 'N/A' && row.aiannh_name !== '') {
        aiannh.add(row.aiannh_name)
      }
    })
    return Array.from(aiannh).sort()
  })
  
  const availableCongressionalDistricts = computed(() => {
    if (store.currentLevel !== 'county' || !store.data.county) return []
    const filtered = getBaseFilteredData('congressional')
    if (!filtered.length) return []
    const cds = new Set()
    filtered.forEach(row => {
      const cd = row.congressional_district || row.cd116 || row.cd || ''
      if (cd && cd !== 'N/A' && cd !== '') cds.add(cd)
    })
    return Array.from(cds).sort((a, b) => (parseInt(a) || 0) - (parseInt(b) || 0))
  })
  
  watch(() => availableRegions.value, (regions) => {
    syncFilterSelection(regions, store.dimensionFilters.selectedRegions, (val) => {
      store.dimensionFilters.selectedRegions = val
    })
  }, { immediate: true, flush: 'sync' })
  
  watch(() => availableStates.value, (states) => {
    syncFilterSelection(states, store.dimensionFilters.selectedStates, (val) => {
      store.dimensionFilters.selectedStates = val
    })
  }, { immediate: true, flush: 'sync' })
  
  watch(() => availableDivisions.value, (divisions) => {
    syncFilterSelection(divisions, store.dimensionFilters.selectedDivisions, (val) => {
      store.dimensionFilters.selectedDivisions = val
    })
  }, { immediate: true, flush: 'sync' })
  
  watch(() => availableMetroAreas.value, (metros) => {
    syncFilterSelection(metros, store.dimensionFilters.selectedMetroAreas, (val) => {
      store.dimensionFilters.selectedMetroAreas = val
    })
  }, { immediate: true, flush: 'sync' })
  
  watch(() => availableUrbanRural.value, (urList) => {
    syncFilterSelection(urList, store.dimensionFilters.selectedUrbanRural, (val) => {
      store.dimensionFilters.selectedUrbanRural = val
    })
  }, { immediate: true, flush: 'sync' })
  
  watch(() => availableAiannh.value, (aiannhList) => {
    syncFilterSelection(aiannhList, store.dimensionFilters.selectedAiannh, (val) => {
      store.dimensionFilters.selectedAiannh = val
    })
  }, { immediate: true, flush: 'sync' })
  
  watch(() => availableCongressionalDistricts.value, (cdList) => {
    syncFilterSelection(cdList, store.dimensionFilters.selectedCongressionalDistricts, (val) => {
      store.dimensionFilters.selectedCongressionalDistricts = val
    })
  }, { immediate: true, flush: 'sync' })
  
  return {
    availableRegions,
    availableStates,
    availableDivisions,
    availableMetroAreas,
    availableUrbanRural,
    availableAiannh,
    availableCongressionalDistricts
  }
}
