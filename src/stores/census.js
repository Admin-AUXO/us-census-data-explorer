import { defineStore } from 'pinia'
import { ref, computed, reactive, watch } from 'vue'
import { getDataPath } from '../utils/dataLoader'
import { createFilterSet, checkFilterMatch, parseNumericFilter, checkNumericRange, searchInFields } from '../utils/filterUtils'
import { parseCSV } from '../utils/csvParser'

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

  const filterCache = ref(new Map())
  const lastFilterKey = ref('')

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

    const filterKey = `${level}_${JSON.stringify(filters)}_${query}_${currentMetric.value}`
    if (filterCache.value.has(filterKey) && lastFilterKey.value === filterKey) {
      return filterCache.value.get(filterKey)
    }
    
    if (filterCache.value.size > 10) {
      filterCache.value.clear()
    }

    const firstRow = dataset[0]
    const populationCol = firstRow?.total_population_2024 ||
      firstRow?.total_population_2023 ||
      firstRow?.total_population_2022 ||
      Object.keys(firstRow || {}).find(k => k.includes('total_population')) || null

    const popMin = parseNumericFilter(filters.populationMin)
    const popMax = parseNumericFilter(filters.populationMax)
    const areaMin = parseNumericFilter(filters.areaMin)
    const areaMax = parseNumericFilter(filters.areaMax)
    const metricMin = currentMetric.value ? parseNumericFilter(filters.metricValueMin) : null
    const metricMax = currentMetric.value ? parseNumericFilter(filters.metricValueMax) : null

    const selectedStatesSet = createFilterSet(filters.selectedStates)
    const selectedRegionsSet = createFilterSet(filters.selectedRegions)
    const selectedDivisionsSet = createFilterSet(filters.selectedDivisions)
    const selectedUrbanRuralSet = createFilterSet(filters.selectedUrbanRural)
    const selectedMetroAreasSet = createFilterSet(filters.selectedMetroAreas)
    const selectedAiannhSet = createFilterSet(filters.selectedAiannh)
    const selectedCongressionalDistrictsSet = createFilterSet(filters.selectedCongressionalDistricts)

    const result = dataset.filter(d => {
      if (!d || typeof d !== 'object') return false

      if (level === 'state') {
        if (!checkFilterMatch(d.state_name, selectedStatesSet)) return false
        if (selectedRegionsSet) {
          const regionName = getRegionName(d.census_region)
          if (!checkFilterMatch(regionName, selectedRegionsSet)) return false
        }
        if (selectedDivisionsSet) {
          const divisionName = getDivisionName(d.census_division)
          if (!checkFilterMatch(divisionName, selectedDivisionsSet)) return false
        }
      } else if (level === 'county') {
        if (selectedCongressionalDistrictsSet) {
          const cd = d.congressional_district || d.cd116 || ''
          if (cd && !checkFilterMatch(cd, selectedCongressionalDistrictsSet)) return false
        }
        if (selectedAiannhSet) {
          const aiannh = d.aiannh_name || 'N/A'
          if (aiannh !== 'N/A' && !checkFilterMatch(aiannh, selectedAiannhSet)) return false
        }
        if (selectedUrbanRuralSet) {
          const ur = d.urban_rural || 'N/A'
          if (!checkFilterMatch(ur, selectedUrbanRuralSet)) return false
        }
        if (selectedMetroAreasSet) {
          const metro = d.urban_area_name || (d.cbsa_code ? `CBSA: ${d.cbsa_code}` : null)
          if (metro && !checkFilterMatch(metro, selectedMetroAreasSet)) return false
        }
      } else if (level === 'zcta5') {
        if (selectedUrbanRuralSet) {
          const ur = d.urban_rural || 'N/A'
          if (!checkFilterMatch(ur, selectedUrbanRuralSet)) return false
        }
        if (selectedAiannhSet) {
          const aiannh = d.aiannh_name || 'N/A'
          if (aiannh !== 'N/A' && !checkFilterMatch(aiannh, selectedAiannhSet)) return false
        }
        if (selectedMetroAreasSet) {
          const metro = d.urban_area_name || (d.cbsa_code ? `CBSA: ${d.cbsa_code}` : null)
          if (metro && !checkFilterMatch(metro, selectedMetroAreasSet)) return false
        }
      }

      if (popMin !== null && populationCol) {
        if (!checkNumericRange(d[populationCol], popMin, popMax)) return false
      } else if (popMax !== null && populationCol) {
        if (!checkNumericRange(d[populationCol], null, popMax)) return false
      }

      if (areaMin !== null || areaMax !== null) {
        if (!checkNumericRange(d.land_area_sq_km, areaMin, areaMax)) return false
      }

      if (metricMin !== null && currentMetric.value) {
        if (!checkNumericRange(d[currentMetric.value], metricMin, metricMax)) return false
      } else if (metricMax !== null && currentMetric.value) {
        if (!checkNumericRange(d[currentMetric.value], null, metricMax)) return false
      }

      if (query) {
        const searchableFields = level === 'state'
          ? [d.state_name, d.state_abbr]
          : level === 'county'
          ? [d.county_name, d.state_name, d.urban_area_name]
          : [d.zcta5, d.county_name, d.state_name]

        if (!searchInFields(d, query, searchableFields)) return false
      }

      return true
    })

    filterCache.value.set(filterKey, result)
    lastFilterKey.value = filterKey
    return result
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
    if (!data.value.state?.length) return []
    const firstRow = data.value.state[0]
    if (!firstRow || typeof firstRow !== 'object') return []
    return [...new Set(Object.keys(firstRow)
      .map(col => col.match(/_(\d{4})$/)?.[1])
      .filter(Boolean)
    )].sort().reverse()
  })
  
  const getPreviousYear = (currentYear) => {
    if (!currentYear) return null
    const yearNum = parseInt(currentYear)
    const prevYear = (yearNum - 1).toString()
    return availableYears.value.includes(prevYear) ? prevYear : null
  }


  const loadManifest = async () => {
    try {
      const manifestPath = getDataPath('data/manifest.json')
      if (import.meta.env.DEV) {
        console.log(`[Census Store] Loading manifest from: ${manifestPath}`)
      }
      const response = await fetch(manifestPath)
      if (!response.ok) {
        const errorMsg = `Failed to load manifest: ${response.status} ${response.statusText} from ${manifestPath}. Check if file exists at public/data/manifest.json`
        console.error(`[Census Store] ${errorMsg}`)
        throw new Error(errorMsg)
      }
      const data = await response.json()
      if (!data?.datasets?.length) {
        throw new Error(`Invalid manifest format: expected datasets array`)
      }
      if (import.meta.env.DEV) {
        console.log(`[Census Store] Manifest loaded: ${data.datasets.length} datasets`)
      }
      manifest.value = data
      return manifest.value
    } catch (error) {
      console.error('[Census Store] Failed to load manifest:', error)
      throw error
    }
  }

  const loadDatasetLevel = async (filename, level) => {
    const cacheKey = `${filename}_${level}`
    const levelNames = { state: 'States', county: 'Counties', zcta5: 'ZIP Codes' }
    
    if (dataCache.value.has(cacheKey)) {
      const cached = dataCache.value.get(cacheKey)
      data.value[level] = cached
      return cached
    }

    levelLoadingState.value[level] = true
    if (level === 'state') isLoading.value = true

    try {
      const baseName = filename.replace('.csv', '')
      loadingProgress.value = { loaded: 0, total: 0, percentage: 0, stage: `Loading ${levelNames[level]} data...` }
      
      const filePath = getDataPath(`data/${baseName}_${level}.csv`)
      if (import.meta.env.DEV) {
        console.log(`[Census Store] Loading ${level} data from: ${filePath}`)
      }
      const response = await fetch(filePath)

      if (!response.ok) {
        const errorMsg = `Failed to load ${level} data: ${response.status} ${response.statusText} from ${filePath}. Expected file: public/data/${baseName}_${level}.csv`
        console.error(`[Census Store] ${errorMsg}`)
        throw new Error(errorMsg)
      }
      
      if (import.meta.env.DEV) {
        console.log(`[Census Store] ${level} data file found, size: ${response.headers.get('content-length') || 'unknown'} bytes`)
      }

      const contentLength = response.headers.get('content-length')
      if (contentLength) {
        loadingProgress.value.total = parseInt(contentLength, 10)
      }

      loadingProgress.value.stage = `Downloading ${levelNames[level]}...`
      const text = await response.text()
      
      if (!text || text.trim().length === 0) {
        throw new Error(`Empty file received from ${filePath}`)
      }
      
      loadingProgress.value.stage = `Processing ${levelNames[level]}...`
      let levelData
      try {
        levelData = await parseCSV(text, (progress) => {
          loadingProgress.value = { ...progress, stage: progress.stage || `Processing ${levelNames[level]}...` }
        })
      } catch (parseError) {
        console.error(`[Census Store] CSV parsing error for ${filePath}:`, parseError)
        throw new Error(`Failed to parse CSV: ${parseError.message || parseError}`)
      }
      
      loadingProgress.value.stage = `Finalizing ${levelNames[level]}...`
      
      if (!levelData || !Array.isArray(levelData)) {
        const errorMsg = `Invalid data format returned from ${filePath}. Expected array, got ${typeof levelData}`
        console.error(`[Census Store] ${errorMsg}`, levelData)
        throw new Error(errorMsg)
      }
      
      if (levelData.length === 0) {
        const errorMsg = `No data rows found in ${filePath}. File may be empty or contain only headers.`
        console.error(`[Census Store] ${errorMsg}`)
        throw new Error(errorMsg)
      }
      
      data.value[level] = levelData
      dataCache.value.set(cacheKey, levelData)
      filterCache.value.clear()
      
      if (import.meta.env.DEV) {
        console.log(`[Census Store] ${levelNames[level]} data loaded and cached: ${levelData.length} rows`)
      }

      loadingProgress.value = { loaded: levelData.length, total: levelData.length, percentage: 100, stage: `${levelNames[level]} loaded` }
      
      return levelData
    } catch (error) {
      console.error(`Failed to load ${level} dataset:`, error)
      loadingProgress.value = { loaded: 0, total: 0, percentage: 0, stage: `Failed to load ${levelNames[level]}` }
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
    console.log(`[Census Store] Loading dataset: ${filename} (base: ${baseName})`)
    
    const cacheKeyState = `${baseName}_state`
    const cacheKeyCounty = `${baseName}_county`
    const cacheKeyZcta5 = `${baseName}_zcta5`
    
    const hasState = dataCache.value.has(cacheKeyState)
    const hasCounty = dataCache.value.has(cacheKeyCounty)
    const hasZcta5 = dataCache.value.has(cacheKeyZcta5)
    
    if (hasState && hasCounty && hasZcta5) {
      data.value = {
        state: dataCache.value.get(cacheKeyState),
        county: dataCache.value.get(cacheKeyCounty),
        zcta5: dataCache.value.get(cacheKeyZcta5)
      }
      filterCache.value.clear()
      return data.value
    }

    if (hasState) data.value.state = dataCache.value.get(cacheKeyState)
    if (hasCounty) data.value.county = dataCache.value.get(cacheKeyCounty)
    if (hasZcta5) data.value.zcta5 = dataCache.value.get(cacheKeyZcta5)

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
      return sortDirection.value === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr)
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
      setTimeout(() => { isLevelTransitioning.value = false }, 300)
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
      setTimeout(() => { isLevelTransitioning.value = false }, 300)
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
        resetFilters()
        isLevelTransitioning.value = false
      }, 100)
    }, 200)
  }

  const reset = () => {
    currentLevel.value = 'state'
    currentState.value = null
    currentCounty.value = null
    sortColumn.value = null
    sortDirection.value = 'asc'
    resetFilters()
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
    const f = dimensionFilters
    if (currentLevel.value === 'state' && data.value.state?.length) {
      const allStates = [...new Set(data.value.state.map(d => d.state_name).filter(Boolean))]
      f.selectedStates = allStates.length ? [...allStates] : []
      f.selectedRegions = []
      f.selectedDivisions = []
    } else if (currentLevel.value === 'county' && data.value.county?.length) {
      const countyData = data.value.county.filter(d => d.state_name === currentState.value)
      f.selectedCongressionalDistricts = [...new Set(countyData.map(d => d.congressional_district || d.cd116 || '').filter(Boolean))]
      f.selectedAiannh = [...new Set(countyData.map(d => d.aiannh_name || 'N/A').filter(a => a && a !== 'N/A'))]
      f.selectedUrbanRural = [...new Set(countyData.map(d => d.urban_rural || 'N/A').filter(ur => ur && ur !== 'N/A'))]
      f.selectedMetroAreas = [...new Set(countyData.map(d => d.urban_area_name || (d.cbsa_code ? `CBSA: ${d.cbsa_code}` : null)).filter(Boolean))]
    } else if (currentLevel.value === 'zcta5' && data.value.zcta5?.length) {
      const zcta5Data = data.value.zcta5.filter(d => 
        d.state_name === currentState.value && d.county_name === currentCounty.value
      )
      f.selectedAiannh = [...new Set(zcta5Data.map(d => d.aiannh_name || 'N/A').filter(a => a && a !== 'N/A'))]
      f.selectedUrbanRural = [...new Set(zcta5Data.map(d => d.urban_rural || 'N/A').filter(ur => ur && ur !== 'N/A'))]
      f.selectedMetroAreas = [...new Set(zcta5Data.map(d => d.urban_area_name || (d.cbsa_code ? `CBSA: ${d.cbsa_code}` : null)).filter(Boolean))]
    }
    f.populationMin = null
    f.populationMax = null
    f.areaMin = null
    f.areaMax = null
    f.metricValueMin = null
    f.metricValueMax = null
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
    dimensionFilters.metricValueMax,
    searchQuery.value,
    currentLevel.value,
    currentMetric.value
  ], () => {
    if (filterTimeout) clearTimeout(filterTimeout)
    isFiltering.value = true
    filterCache.value.clear()
    filterTimeout = setTimeout(() => {
      isFiltering.value = false
      filterTimeout = null
    }, 100)
  }, { deep: true })

  const preloadNextLevel = async () => {
    if (!currentDataset.value) return
    const level = currentLevel.value
    if (level === 'state' && !data.value.county && !levelLoadingState.value.county) {
      try {
        await loadDatasetLevel(currentDataset.value, 'county')
      } catch (error) {
        console.error('Failed to preload county data:', error)
      }
    } else if (level === 'county' && currentState.value && !data.value.zcta5 && !levelLoadingState.value.zcta5) {
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
    const level = currentLevel.value
    if (level === 'state' && !data.value.state) {
      await loadDatasetLevel(newDataset, 'state')
    } else if (level === 'county') {
      if (!data.value.state) await loadDatasetLevel(newDataset, 'state')
      if (!data.value.county) await loadDatasetLevel(newDataset, 'county')
    } else if (level === 'zcta5') {
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
