import { useCensusStore } from '../stores/census'

export const useFilterData = () => {
  const store = useCensusStore()
  
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
    if (!dataset?.length) return []

    let filtered = [...dataset]

    if (store.currentLevel === 'state') {
      if (excludeFilter !== 'states' && store.dimensionFilters.selectedStates.length > 0) {
        const allStates = [...new Set(dataset.map(r => r.state_name).filter(Boolean))]
        if (store.dimensionFilters.selectedStates.length < allStates.length) {
          filtered = filtered.filter(d => store.dimensionFilters.selectedStates.includes(d.state_name))
        }
      }
      if (excludeFilter !== 'regions' && store.dimensionFilters.selectedRegions.length > 0) {
        filtered = filtered.filter(d => 
          store.dimensionFilters.selectedRegions.includes(store.getRegionName(d.census_region))
        )
      }
      if (excludeFilter !== 'divisions' && store.dimensionFilters.selectedDivisions.length > 0) {
        filtered = filtered.filter(d => 
          store.dimensionFilters.selectedDivisions.includes(store.getDivisionName(d.census_division))
        )
      }
    }

    const popCol = filtered[0]?.total_population_2024 || 
                   filtered[0]?.total_population_2023 ||
                   filtered[0]?.total_population_2022 ||
                   Object.keys(filtered[0] || {}).find(k => k.includes('total_population'))

    if (excludeFilter !== 'population') {
      if (store.dimensionFilters.populationMin !== null && store.dimensionFilters.populationMin !== '' && popCol) {
        filtered = filtered.filter(d => {
          const pop = parseFloat(d[popCol]) || 0
          return pop >= parseFloat(store.dimensionFilters.populationMin)
        })
      }
      if (store.dimensionFilters.populationMax !== null && store.dimensionFilters.populationMax !== '' && popCol) {
        filtered = filtered.filter(d => {
          const pop = parseFloat(d[popCol]) || 0
          return pop <= parseFloat(store.dimensionFilters.populationMax)
        })
      }
    }

    if (excludeFilter !== 'area') {
      if (store.dimensionFilters.areaMin !== null && store.dimensionFilters.areaMin !== '') {
        filtered = filtered.filter(d => {
          const area = parseFloat(d.land_area_sq_km) || 0
          return area >= parseFloat(store.dimensionFilters.areaMin)
        })
      }
      if (store.dimensionFilters.areaMax !== null && store.dimensionFilters.areaMax !== '') {
        filtered = filtered.filter(d => {
          const area = parseFloat(d.land_area_sq_km) || 0
          return area <= parseFloat(store.dimensionFilters.areaMax)
        })
      }
    }

    if (store.currentMetric && excludeFilter !== 'metric') {
      if (store.dimensionFilters.metricValueMin !== null && store.dimensionFilters.metricValueMin !== '') {
        filtered = filtered.filter(d => {
          const val = parseFloat(d[store.currentMetric]) || 0
          return val >= parseFloat(store.dimensionFilters.metricValueMin)
        })
      }
      if (store.dimensionFilters.metricValueMax !== null && store.dimensionFilters.metricValueMax !== '') {
        filtered = filtered.filter(d => {
          const val = parseFloat(d[store.currentMetric]) || 0
          return val <= parseFloat(store.dimensionFilters.metricValueMax)
        })
      }
    }

    if (store.currentLevel === 'county' && excludeFilter !== 'congressional') {
      const availableCDs = [...new Set(filtered.map(d => d.congressional_district || d.cd116 || '').filter(Boolean))]
      if (availableCDs.length && store.dimensionFilters.selectedCongressionalDistricts.length && 
          store.dimensionFilters.selectedCongressionalDistricts.length < availableCDs.length) {
        filtered = filtered.filter(d => 
          store.dimensionFilters.selectedCongressionalDistricts.includes(d.congressional_district || d.cd116 || '')
        )
      }
    }

    if ((store.currentLevel === 'county' || store.currentLevel === 'zcta5') && excludeFilter !== 'aiannh') {
      const availableAiannh = [...new Set(filtered.map(d => d.aiannh_name || 'N/A').filter(a => a && a !== 'N/A'))]
      if (availableAiannh.length && store.dimensionFilters.selectedAiannh.length && 
          store.dimensionFilters.selectedAiannh.length < availableAiannh.length) {
        filtered = filtered.filter(d => 
          store.dimensionFilters.selectedAiannh.includes(d.aiannh_name || 'N/A')
        )
      }
    }

    if ((store.currentLevel === 'county' || store.currentLevel === 'zcta5') && excludeFilter !== 'urbanRural') {
      if (store.dimensionFilters.selectedUrbanRural.length) {
        filtered = filtered.filter(d => 
          store.dimensionFilters.selectedUrbanRural.includes(d.urban_rural || 'N/A')
        )
      }
    }

    if ((store.currentLevel === 'county' || store.currentLevel === 'zcta5') && excludeFilter !== 'metro') {
      const availableMetros = [...new Set(filtered.map(d => d.urban_area_name || (d.cbsa_code ? `CBSA: ${d.cbsa_code}` : null)).filter(Boolean))]
      if (availableMetros.length && store.dimensionFilters.selectedMetroAreas.length && 
          store.dimensionFilters.selectedMetroAreas.length < availableMetros.length) {
        filtered = filtered.filter(d => 
          store.dimensionFilters.selectedMetroAreas.includes(d.urban_area_name || (d.cbsa_code ? `CBSA: ${d.cbsa_code}` : null))
        )
      }
    }

    return filtered
  }
  
  return {
    getBaseFilteredData
  }
}
