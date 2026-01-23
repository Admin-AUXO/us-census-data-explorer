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
  const loadingProgress = ref({ loaded: 0, total: 0, percentage: 0, stage: '' })
  
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

  const levelDataCache = computed(() => {
    switch (currentLevel.value) {
      case 'state':
        return data.value.state
      case 'county':
        if (!data.value.county || !currentState.value) return data.value.county
        return data.value.county.filter(d => d.state_name === currentState.value)
      case 'zcta5':
        if (!data.value.zcta5 || !currentState.value || !currentCounty.value) return null
        return data.value.zcta5.filter(d =>
          d.state_name === currentState.value && d.county_name === currentCounty.value
        )
      default:
        return null
    }
  })

  const filteredData = computed(() => {
    const dataset = levelDataCache.value

    if (!dataset || !Array.isArray(dataset) || dataset.length === 0) return null

    const level = currentLevel.value
    const filters = dimensionFilters
    const query = searchQuery.value?.toLowerCase() || ''

    const hasActiveFilters =
      filters.selectedStates.length > 0 ||
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
      filters.metricValueMax !== null ||
      query !== ''

    if (!hasActiveFilters) return dataset

    const firstRow = dataset[0]
    const populationCol = firstRow?.total_population_2024 ||
      firstRow?.total_population_2023 ||
      firstRow?.total_population_2022 ||
      Object.keys(firstRow || {}).find(k => k.includes('total_population')) || null

    const popMin = filters.populationMin !== null && filters.populationMin !== '' ? parseFloat(filters.populationMin) : null
    const popMax = filters.populationMax !== null && filters.populationMax !== '' ? parseFloat(filters.populationMax) : null
    const areaMin = filters.areaMin !== null && filters.areaMin !== '' ? parseFloat(filters.areaMin) : null
    const areaMax = filters.areaMax !== null && filters.areaMax !== '' ? parseFloat(filters.areaMax) : null
    const metricMin = currentMetric.value && filters.metricValueMin !== null && filters.metricValueMin !== '' ? parseFloat(filters.metricValueMin) : null
    const metricMax = currentMetric.value && filters.metricValueMax !== null && filters.metricValueMax !== '' ? parseFloat(filters.metricValueMax) : null

    const selectedStatesSet = new Set(filters.selectedStates)
    const selectedRegionsSet = new Set(filters.selectedRegions)
    const selectedDivisionsSet = new Set(filters.selectedDivisions)
    const selectedUrbanRuralSet = new Set(filters.selectedUrbanRural)
    const selectedMetroAreasSet = new Set(filters.selectedMetroAreas)
    const selectedAiannhSet = new Set(filters.selectedAiannh)
    const selectedCongressionalDistrictsSet = new Set(filters.selectedCongressionalDistricts)

    return dataset.filter(d => {
      if (!d || typeof d !== 'object') return false

      if (level === 'state') {
        if (selectedStatesSet.size > 0 && !selectedStatesSet.has(d.state_name)) {
          return false
        }
        if (selectedRegionsSet.size > 0) {
          const regionName = getRegionName(d.census_region)
          if (!selectedRegionsSet.has(regionName)) return false
        }
        if (selectedDivisionsSet.size > 0) {
          const divisionName = getDivisionName(d.census_division)
          if (!selectedDivisionsSet.has(divisionName)) return false
        }
      } else if (level === 'county') {
        if (selectedCongressionalDistrictsSet.size > 0) {
          const cd = d.congressional_district || d.cd116 || ''
          if (cd && !selectedCongressionalDistrictsSet.has(cd)) return false
        }
        if (selectedAiannhSet.size > 0) {
          const aiannh = d.aiannh_name || 'N/A'
          if (aiannh !== 'N/A' && !selectedAiannhSet.has(aiannh)) return false
        }
        if (selectedUrbanRuralSet.size > 0) {
          const ur = d.urban_rural || 'N/A'
          if (!selectedUrbanRuralSet.has(ur)) return false
        }
        if (selectedMetroAreasSet.size > 0) {
          const metro = d.urban_area_name || (d.cbsa_code ? `CBSA: ${d.cbsa_code}` : null)
          if (metro && !selectedMetroAreasSet.has(metro)) return false
        }
      } else if (level === 'zcta5') {
        if (selectedUrbanRuralSet.size > 0) {
          const ur = d.urban_rural || 'N/A'
          if (!selectedUrbanRuralSet.has(ur)) return false
        }
        if (selectedAiannhSet.size > 0) {
          const aiannh = d.aiannh_name || 'N/A'
          if (aiannh !== 'N/A' && !selectedAiannhSet.has(aiannh)) return false
        }
        if (selectedMetroAreasSet.size > 0) {
          const metro = d.urban_area_name || (d.cbsa_code ? `CBSA: ${d.cbsa_code}` : null)
          if (metro && !selectedMetroAreasSet.has(metro)) return false
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
        const searchableFields = level === 'state'
          ? [d.state_name, d.state_abbr]
          : level === 'county'
          ? [d.county_name, d.state_name, d.urban_area_name]
          : [d.zcta5, d.county_name, d.state_name]

        const found = searchableFields.some(field =>
          field && String(field).toLowerCase().includes(query)
        )

        if (!found) return false
      }

      return true
    })
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
    if (!data.value.state || !Array.isArray(data.value.state) || data.value.state.length === 0) return []
    const firstRow = data.value.state[0]
    if (!firstRow || typeof firstRow !== 'object' || firstRow === null) return []
    const columns = Object.keys(firstRow)
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

  const parseCSV = async (text, onProgress) => {
    return new Promise((resolve, reject) => {
      let rowCount = 0
      const lines = text.split('\n')
      const estimatedTotal = Math.max(1000, lines.length - 1)

      Papa.parse(text, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        fastMode: true,
        worker: false,
        step: (result) => {
          rowCount++
          if (onProgress && rowCount % 1000 === 0) {
            const percentage = Math.min(95, Math.round((rowCount / estimatedTotal) * 100))
            onProgress({ loaded: rowCount, total: estimatedTotal, percentage, stage: 'Parsing data...' })
          }
        },
        chunkSize: 1024 * 1024,
        complete: (results) => {
          if (onProgress) {
            onProgress({ loaded: results.data.length, total: results.data.length, percentage: 100, stage: 'Processing complete' })
          }
          resolve(results.data)
        },
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
      
      loadingProgress.value = { loaded: 0, total: 0, percentage: 0, stage: `Fetching ${level} data...` }
      
      const response = await fetch(`${baseUrl}data/${baseName}_${level}.csv`)

      if (!response.ok) {
        throw new Error(`Failed to load ${level} data file`)
      }

      const contentLength = response.headers.get('content-length')
      if (contentLength) {
        loadingProgress.value.total = parseInt(contentLength, 10)
      }

      loadingProgress.value.stage = 'Downloading data...'
      const text = await response.text()
      
      loadingProgress.value.stage = 'Parsing CSV data...'
      const levelData = await parseCSV(text, (progress) => {
        loadingProgress.value = { ...progress, stage: progress.stage || loadingProgress.value.stage }
      })
      
      loadingProgress.value.stage = 'Finalizing...'
      data.value[level] = levelData
      dataCache.value.set(cacheKey, levelData)

      loadingProgress.value = { loaded: levelData.length, total: levelData.length, percentage: 100, stage: 'Complete' }
      
      return levelData
    } catch (error) {
      console.error(`Failed to load ${level} dataset:`, error)
      loadingProgress.value = { loaded: 0, total: 0, percentage: 0, stage: 'Error occurred' }
      throw error
    } finally {
      levelLoadingState.value[level] = false
      if (level === 'state') isLoading.value = false
      setTimeout(() => {
        loadingProgress.value = { loaded: 0, total: 0, percentage: 0, stage: '' }
      }, 500)
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
        setTimeout(() => preloadNextLevel(), 1000)
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

  let filterTimeout = null
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
    if (filterTimeout) clearTimeout(filterTimeout)
    isFiltering.value = true
    filterTimeout = setTimeout(() => {
      isFiltering.value = false
      filterTimeout = null
    }, 150)
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
    loadingProgress,
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
