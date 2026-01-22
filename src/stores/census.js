import { defineStore } from 'pinia'
import { ref, computed, reactive, watch } from 'vue'
import Papa from 'papaparse'

export const useCensusStore = defineStore('census', () => {
  const currentLevel = ref('state')
  const currentState = ref(null)
  const currentCounty = ref(null)
  const currentDataset = ref(null)
  const currentYear = ref(null)
  const currentMetric = ref(null)
  const compareYear = ref(null)

  const data = ref({
    state: null,
    county: null,
    zcta5: null
  })

  const dataCache = ref(new Map())
  const levelLoadingState = ref({
    state: false,
    county: false,
    zcta5: false
  })
  const sortColumn = ref(null)
  const sortDirection = ref('asc')
  const isLoading = ref(false)
  const isLevelTransitioning = ref(false)
  const isFiltering = ref(false)
  const navigationDirection = ref('forward')
  const manifest = ref(null)
  const searchQuery = ref('')
  
  const dimensionFilters = reactive({
    selectedStates: [],
    selectedRegions: [],
    selectedDivisions: [],
    selectedCongressionalDistricts: [],
    selectedAiannh: [],
    selectedUrbanRural: [],
    selectedMetroAreas: [],
    populationMin: null,
    populationMax: null,
    areaMin: null,
    areaMax: null,
    metricValueMin: null,
    metricValueMax: null
  })
  
  const filtersExpanded = ref(false)

  const breadcrumb = computed(() => {
    if (currentLevel.value === 'zcta5') {
      return `${currentCounty.value}, ${currentState.value}`
    } else if (currentLevel.value === 'county') {
      return currentState.value
    }
    return 'United States'
  })

  const filteredData = computed(() => {
    let dataset = null

    switch (currentLevel.value) {
      case 'state':
        dataset = data.value.state
        break
      case 'county':
        if (!data.value.county) return null
        if (!currentState.value) return data.value.county
        dataset = data.value.county.filter(d => d.state_name === currentState.value)
        break
      case 'zcta5':
        if (!data.value.zcta5) return null
        if (!currentState.value || !currentCounty.value) return null
        dataset = data.value.zcta5.filter(d =>
          d.state_name === currentState.value && d.county_name === currentCounty.value
        )
        break
    }

    if (!dataset || dataset.length === 0) return null

    let filtered = dataset
    const level = currentLevel.value
    const filters = dimensionFilters
    const query = searchQuery.value?.toLowerCase() || ''

    const populationCol = dataset[0] ? (
      dataset[0].total_population_2024 || 
      dataset[0].total_population_2023 ||
      dataset[0].total_population_2022 ||
      Object.keys(dataset[0]).find(k => k.includes('total_population'))
    ) : null

    const popMin = filters.populationMin !== null && filters.populationMin !== '' ? parseFloat(filters.populationMin) : null
    const popMax = filters.populationMax !== null && filters.populationMax !== '' ? parseFloat(filters.populationMax) : null
    const areaMin = filters.areaMin !== null && filters.areaMin !== '' ? parseFloat(filters.areaMin) : null
    const areaMax = filters.areaMax !== null && filters.areaMax !== '' ? parseFloat(filters.areaMax) : null
    const metricMin = currentMetric.value && filters.metricValueMin !== null && filters.metricValueMin !== '' ? parseFloat(filters.metricValueMin) : null
    const metricMax = currentMetric.value && filters.metricValueMax !== null && filters.metricValueMax !== '' ? parseFloat(filters.metricValueMax) : null

    filtered = filtered.filter(d => {
      if (level === 'state') {
        if (filters.selectedStates.length > 0) {
          const allStates = new Set(dataset.map(item => item.state_name).filter(Boolean))
          if (filters.selectedStates.length < allStates.size && !filters.selectedStates.includes(d.state_name)) {
            return false
          }
        }
        if (filters.selectedRegions.length > 0) {
          const regionName = getRegionName(d.census_region)
          if (!filters.selectedRegions.includes(regionName)) return false
        }
        if (filters.selectedDivisions.length > 0) {
          const divisionName = getDivisionName(d.census_division)
          if (!filters.selectedDivisions.includes(divisionName)) return false
        }
      } else if (level === 'county') {
        if (filters.selectedCongressionalDistricts.length > 0) {
          const cd = d.congressional_district || d.cd116 || ''
          if (cd && !filters.selectedCongressionalDistricts.includes(cd)) return false
        }
        if (filters.selectedAiannh.length > 0) {
          const aiannh = d.aiannh_name || 'N/A'
          if (aiannh !== 'N/A' && !filters.selectedAiannh.includes(aiannh)) return false
        }
        if (filters.selectedUrbanRural.length > 0) {
          const ur = d.urban_rural || 'N/A'
          if (!filters.selectedUrbanRural.includes(ur)) return false
        }
        if (filters.selectedMetroAreas.length > 0) {
          const metro = d.urban_area_name || (d.cbsa_code ? `CBSA: ${d.cbsa_code}` : null)
          if (metro && !filters.selectedMetroAreas.includes(metro)) return false
        }
      } else if (level === 'zcta5') {
        if (filters.selectedUrbanRural.length > 0) {
          const ur = d.urban_rural || 'N/A'
          if (!filters.selectedUrbanRural.includes(ur)) return false
        }
        if (filters.selectedAiannh.length > 0) {
          const aiannh = d.aiannh_name || 'N/A'
          if (aiannh !== 'N/A' && !filters.selectedAiannh.includes(aiannh)) return false
        }
        if (filters.selectedMetroAreas.length > 0) {
          const metro = d.urban_area_name || (d.cbsa_code ? `CBSA: ${d.cbsa_code}` : null)
          if (metro && !filters.selectedMetroAreas.includes(metro)) return false
        }
      }

      if (popMin !== null && populationCol) {
        const pop = parseFloat(d[populationCol]) || 0
        if (pop < popMin) return false
      }
      if (popMax !== null && populationCol) {
        const pop = parseFloat(d[populationCol]) || 0
        if (pop > popMax) return false
      }
      if (areaMin !== null) {
        const area = parseFloat(d.land_area_sq_km) || 0
        if (area < areaMin) return false
      }
      if (areaMax !== null) {
        const area = parseFloat(d.land_area_sq_km) || 0
        if (area > areaMax) return false
      }
      if (metricMin !== null && currentMetric.value) {
        const val = parseFloat(d[currentMetric.value]) || 0
        if (val < metricMin) return false
      }
      if (metricMax !== null && currentMetric.value) {
        const val = parseFloat(d[currentMetric.value]) || 0
        if (val > metricMax) return false
      }

      if (query) {
        let found = false
        for (const key in d) {
          if (String(d[key]).toLowerCase().includes(query)) {
            found = true
            break
          }
        }
        if (!found) return false
      }

      return true
    })

    return filtered
  })

  const getRegionName = (code) => {
    const regions = {
      '1': 'Northeast',
      '2': 'Midwest',
      '3': 'South',
      '4': 'West'
    }
    return regions[code] || 'N/A'
  }
  
  const getDivisionName = (code) => {
    const divisions = {
      '1': 'New England',
      '2': 'Middle Atlantic',
      '3': 'East North Central',
      '4': 'West North Central',
      '5': 'South Atlantic',
      '6': 'East South Central',
      '7': 'West South Central',
      '8': 'Mountain',
      '9': 'Pacific'
    }
    return divisions[code] || 'N/A'
  }
  
  const availableYears = computed(() => {
    if (!data.value.state || data.value.state.length === 0) return []
    const columns = Object.keys(data.value.state[0])
    const yearMatches = columns
      .map(col => col.match(/_(\d{4})$/))
      .filter(match => match)
      .map(match => match[1])
    return [...new Set(yearMatches)].sort().reverse()
  })
  
  const getPreviousYear = (currentYear) => {
    if (!currentYear) return null
    const yearNum = parseInt(currentYear)
    const prevYear = (yearNum - 1).toString()
    return availableYears.value.includes(prevYear) ? prevYear : null
  }

  const parseCSV = async (text) => {
    return new Promise((resolve, reject) => {
      Papa.parse(text, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => resolve(results.data),
        error: (error) => reject(error)
      })
    })
  }

  const loadManifest = async () => {
    try {
      const baseUrl = import.meta.env.BASE_URL
      const response = await fetch(`${baseUrl}data/manifest.json`)
      if (!response.ok) throw new Error('Failed to load manifest')
      manifest.value = await response.json()
      return manifest.value
    } catch (error) {
      console.error('Failed to load manifest:', error)
      throw error
    }
  }

  const loadDatasetLevel = async (filename, level) => {
    const cacheKey = `${filename}_${level}`
    
    if (dataCache.value.has(cacheKey)) {
      const cached = dataCache.value.get(cacheKey)
      data.value[level] = cached
      return cached
    }

    levelLoadingState.value[level] = true
    if (level === 'state') isLoading.value = true

    try {
      const baseUrl = import.meta.env.BASE_URL
      const baseName = filename.replace('.csv', '')
      const response = await fetch(`${baseUrl}data/${baseName}_${level}.csv`)

      if (!response.ok) {
        throw new Error(`Failed to load ${level} data file`)
      }

      const levelData = await response.text().then(parseCSV)
      
      data.value[level] = levelData
      dataCache.value.set(cacheKey, levelData)

      return levelData
    } catch (error) {
      console.error(`Failed to load ${level} dataset:`, error)
      throw error
    } finally {
      levelLoadingState.value[level] = false
      if (level === 'state') isLoading.value = false
    }
  }

  const loadDataset = async (filename) => {
    const baseName = filename.replace('.csv', '')
    
    const hasState = dataCache.value.has(`${baseName}_state`)
    const hasCounty = dataCache.value.has(`${baseName}_county`)
    const hasZcta5 = dataCache.value.has(`${baseName}_zcta5`)
    
    if (hasState && hasCounty && hasZcta5) {
      data.value = {
        state: dataCache.value.get(`${baseName}_state`),
        county: dataCache.value.get(`${baseName}_county`),
        zcta5: dataCache.value.get(`${baseName}_zcta5`)
      }
      return data.value
    }

    if (hasState) {
      data.value.state = dataCache.value.get(`${baseName}_state`)
    }
    if (hasCounty) {
      data.value.county = dataCache.value.get(`${baseName}_county`)
    }
    if (hasZcta5) {
      data.value.zcta5 = dataCache.value.get(`${baseName}_zcta5`)
    }

    isLoading.value = true

    try {
      if (!hasState) {
        await loadDatasetLevel(filename, 'state')
      }
      
      if ((currentLevel.value === 'county' || currentState.value) && !hasCounty) {
        await loadDatasetLevel(filename, 'county')
      }
      
      if ((currentLevel.value === 'zcta5' || (currentState.value && currentCounty.value)) && !hasZcta5) {
        await loadDatasetLevel(filename, 'zcta5')
      }

      if (currentLevel.value === 'state' && !hasCounty) {
        setTimeout(() => preloadNextLevel(), 2000)
      }

      return data.value
    } catch (error) {
      console.error('Failed to load dataset:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const sortData = (dataset) => {
    if (!sortColumn.value || !dataset) return dataset

    return [...dataset].sort((a, b) => {
      const aVal = a[sortColumn.value]
      const bVal = b[sortColumn.value]

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection.value === 'asc' ? aVal - bVal : bVal - aVal
      }

      const aStr = String(aVal).toLowerCase()
      const bStr = String(bVal).toLowerCase()

      if (sortDirection.value === 'asc') {
        return aStr.localeCompare(bStr)
      } else {
        return bStr.localeCompare(aStr)
      }
    })
  }

  const toggleSort = (column) => {
    if (sortColumn.value === column) {
      sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
    } else {
      sortColumn.value = column
      sortDirection.value = 'asc'
    }
  }

  const drillToState = async (stateName) => {
    navigationDirection.value = 'forward'
    isLevelTransitioning.value = true
    setTimeout(async () => {
      currentState.value = stateName
      currentCounty.value = null
      currentLevel.value = 'county'
      sortColumn.value = null
      sortDirection.value = 'asc'
      
      if (currentDataset.value && !data.value.county) {
        try {
          await loadDatasetLevel(currentDataset.value, 'county')
        } catch (error) {
          console.error('Failed to preload county data:', error)
        }
      }
      
      setTimeout(() => {
        isLevelTransitioning.value = false
      }, 300)
    }, 200)
  }

  const drillToCounty = async (countyName) => {
    navigationDirection.value = 'forward'
    isLevelTransitioning.value = true
    setTimeout(async () => {
      currentCounty.value = countyName
      currentLevel.value = 'zcta5'
      sortColumn.value = null
      sortDirection.value = 'asc'
      
      if (currentDataset.value && !data.value.zcta5) {
        try {
          await loadDatasetLevel(currentDataset.value, 'zcta5')
        } catch (error) {
          console.error('Failed to preload zcta5 data:', error)
        }
      }
      
      setTimeout(() => {
        isLevelTransitioning.value = false
      }, 300)
    }, 200)
  }

  const goBack = () => {
    navigationDirection.value = 'backward'
    isLevelTransitioning.value = true
    setTimeout(() => {
      if (currentLevel.value === 'zcta5') {
        currentCounty.value = null
        currentLevel.value = 'county'
      } else if (currentLevel.value === 'county') {
        currentState.value = null
        currentCounty.value = null
        currentLevel.value = 'state'
      }
      sortColumn.value = null
      sortDirection.value = 'asc'
      setTimeout(() => {
        isLevelTransitioning.value = false
      }, 300)
    }, 200)
  }

  const reset = () => {
    currentLevel.value = 'state'
    currentState.value = null
    currentCounty.value = null
    sortColumn.value = null
    sortDirection.value = 'asc'
  }

  const savePreferences = () => {
    try {
      const prefs = {
        dataset: currentDataset.value,
        year: currentYear.value,
        metric: currentMetric.value
      }
      localStorage.setItem('census_prefs', JSON.stringify(prefs))
    } catch (error) {
      console.error('Failed to save preferences:', error)
    }
  }

  const loadPreferences = () => {
    try {
      const prefs = localStorage.getItem('census_prefs')
      if (prefs) {
        const parsed = JSON.parse(prefs)
        return parsed
      }
    } catch (error) {
      console.error('Failed to load preferences:', error)
    }
    return null
  }

  const setAutoCompareYear = () => {
    if (currentYear.value) {
      const prevYear = getPreviousYear(currentYear.value)
      if (prevYear) {
        compareYear.value = prevYear
      } else {
        compareYear.value = null
      }
    }
  }
  
  const resetFilters = () => {
    if (currentLevel.value === 'state' && data.value.state) {
      const allStates = [...new Set(data.value.state.map(d => d.state_name).filter(Boolean))]
      dimensionFilters.selectedStates = allStates.length > 0 ? [...allStates] : []
      dimensionFilters.selectedRegions = []
      dimensionFilters.selectedDivisions = []
    } else if (currentLevel.value === 'county' && data.value.county) {
      const countyData = data.value.county.filter(d => d.state_name === currentState.value)
      const allCDs = [...new Set(countyData.map(d => d.congressional_district || d.cd116 || '').filter(Boolean))]
      const allAiannh = [...new Set(countyData.map(d => d.aiannh_name || 'N/A').filter(a => a && a !== 'N/A'))]
      const allUR = [...new Set(countyData.map(d => d.urban_rural || 'N/A').filter(ur => ur && ur !== 'N/A'))]
      const allMetros = [...new Set(countyData.map(d => d.urban_area_name || (d.cbsa_code ? `CBSA: ${d.cbsa_code}` : null)).filter(Boolean))]
      
      dimensionFilters.selectedCongressionalDistricts = allCDs.length > 0 ? [...allCDs] : []
      dimensionFilters.selectedAiannh = allAiannh.length > 0 ? [...allAiannh] : []
      dimensionFilters.selectedUrbanRural = allUR.length > 0 ? [...allUR] : []
      dimensionFilters.selectedMetroAreas = allMetros.length > 0 ? [...allMetros] : []
    } else if (currentLevel.value === 'zcta5' && data.value.zcta5) {
      const zcta5Data = data.value.zcta5.filter(d => 
        d.state_name === currentState.value && d.county_name === currentCounty.value
      )
      const allAiannh = [...new Set(zcta5Data.map(d => d.aiannh_name || 'N/A').filter(a => a && a !== 'N/A'))]
      const allUR = [...new Set(zcta5Data.map(d => d.urban_rural || 'N/A').filter(ur => ur && ur !== 'N/A'))]
      const allMetros = [...new Set(zcta5Data.map(d => d.urban_area_name || (d.cbsa_code ? `CBSA: ${d.cbsa_code}` : null)).filter(Boolean))]
      
      dimensionFilters.selectedAiannh = allAiannh.length > 0 ? [...allAiannh] : []
      dimensionFilters.selectedUrbanRural = allUR.length > 0 ? [...allUR] : []
      dimensionFilters.selectedMetroAreas = allMetros.length > 0 ? [...allMetros] : []
    }
    
    dimensionFilters.populationMin = null
    dimensionFilters.populationMax = null
    dimensionFilters.areaMin = null
    dimensionFilters.areaMax = null
    dimensionFilters.metricValueMin = null
    dimensionFilters.metricValueMax = null
  }

  watch(() => [
    dimensionFilters.selectedStates,
    dimensionFilters.selectedRegions,
    dimensionFilters.selectedDivisions,
    dimensionFilters.selectedCongressionalDistricts,
    dimensionFilters.selectedAiannh,
    dimensionFilters.selectedUrbanRural,
    dimensionFilters.selectedMetroAreas,
    dimensionFilters.populationMin,
    dimensionFilters.populationMax,
    dimensionFilters.areaMin,
    dimensionFilters.areaMax,
    dimensionFilters.metricValueMin,
    dimensionFilters.metricValueMax
  ], () => {
    isFiltering.value = true
    setTimeout(() => {
      isFiltering.value = false
    }, 300)
  }, { deep: true })

  const preloadNextLevel = async () => {
    if (!currentDataset.value) return
    
    if (currentLevel.value === 'state' && !data.value.county && !levelLoadingState.value.county) {
      try {
        await loadDatasetLevel(currentDataset.value, 'county')
      } catch (error) {
        console.error('Failed to preload county data:', error)
      }
    } else if (currentLevel.value === 'county' && currentState.value && !data.value.zcta5 && !levelLoadingState.value.zcta5) {
      try {
        await loadDatasetLevel(currentDataset.value, 'zcta5')
      } catch (error) {
        console.error('Failed to preload zcta5 data:', error)
      }
    }
  }

  watch(() => currentLevel.value, async (newLevel) => {
    if (!currentDataset.value) return
    
    if (newLevel === 'county' && !data.value.county && !levelLoadingState.value.county) {
      try {
        await loadDatasetLevel(currentDataset.value, 'county')
      } catch (error) {
        console.error('Failed to load county data:', error)
      }
    } else if (newLevel === 'zcta5' && !data.value.zcta5 && !levelLoadingState.value.zcta5) {
      try {
        await loadDatasetLevel(currentDataset.value, 'zcta5')
      } catch (error) {
        console.error('Failed to load zcta5 data:', error)
      }
    }
  })

  watch(() => [currentState.value, currentLevel.value], async () => {
    if (currentLevel.value === 'state' && currentState.value) {
      setTimeout(() => preloadNextLevel(), 1000)
    }
  })

  watch(() => currentDataset.value, async (newDataset) => {
    if (!newDataset) return
    
    if (currentLevel.value === 'state' && !data.value.state) {
      await loadDatasetLevel(newDataset, 'state')
    } else if (currentLevel.value === 'county') {
      if (!data.value.state) await loadDatasetLevel(newDataset, 'state')
      if (!data.value.county) await loadDatasetLevel(newDataset, 'county')
    } else if (currentLevel.value === 'zcta5') {
      if (!data.value.state) await loadDatasetLevel(newDataset, 'state')
      if (!data.value.county) await loadDatasetLevel(newDataset, 'county')
      if (!data.value.zcta5) await loadDatasetLevel(newDataset, 'zcta5')
    }
  })

  return {
    currentLevel,
    currentState,
    currentCounty,
    currentDataset,
    currentYear,
    currentMetric,
    compareYear,
    data,
    dataCache,
    sortColumn,
    sortDirection,
    isLoading,
    isLevelTransitioning,
    isFiltering,
    navigationDirection,
    levelLoadingState,
    manifest,
    searchQuery,
    dimensionFilters,
    filtersExpanded,
    breadcrumb,
    filteredData,
    availableYears,
    getRegionName,
    getDivisionName,
    getPreviousYear,
    setAutoCompareYear,
    resetFilters,
    loadManifest,
    loadDataset,
    loadDatasetLevel,
    preloadNextLevel,
    sortData,
    toggleSort,
    drillToState,
    drillToCounty,
    goBack,
    reset,
    savePreferences,
    loadPreferences
  }
})
