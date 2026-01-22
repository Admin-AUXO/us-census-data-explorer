import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
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
  const sortColumn = ref(null)
  const sortDirection = ref('asc')
  const isLoading = ref(false)
  const manifest = ref(null)
  const searchQuery = ref('')
  
  const dimensionFilters = ref({
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
        dataset = data.value.county?.filter(d => d.state_name === currentState.value)
        break
      case 'zcta5':
        dataset = data.value.zcta5?.filter(d =>
          d.state_name === currentState.value && d.county_name === currentCounty.value
        )
        break
    }

    if (!dataset) return null

    let filtered = dataset

    if (currentLevel.value === 'state') {
      if (dimensionFilters.value.selectedStates.length > 0) {
        filtered = filtered.filter(d => dimensionFilters.value.selectedStates.includes(d.state_name))
      }
      if (dimensionFilters.value.selectedRegions.length > 0) {
        filtered = filtered.filter(d => {
          const regionName = getRegionName(d.census_region)
          return dimensionFilters.value.selectedRegions.includes(regionName)
        })
      }
      if (dimensionFilters.value.selectedDivisions.length > 0) {
        filtered = filtered.filter(d => {
          const divisionName = getDivisionName(d.census_division)
          return dimensionFilters.value.selectedDivisions.includes(divisionName)
        })
      }
    } else if (currentLevel.value === 'county') {
      if (dimensionFilters.value.selectedCongressionalDistricts.length > 0) {
        filtered = filtered.filter(d => {
          const cd = d.congressional_district || d.cd116 || ''
          return dimensionFilters.value.selectedCongressionalDistricts.includes(cd)
        })
      }
      if (dimensionFilters.value.selectedAiannh.length > 0) {
        filtered = filtered.filter(d => {
          const aiannh = d.aiannh_name || 'N/A'
          return dimensionFilters.value.selectedAiannh.includes(aiannh)
        })
      }
      if (dimensionFilters.value.selectedUrbanRural.length > 0) {
        filtered = filtered.filter(d => {
          const ur = d.urban_rural || 'N/A'
          return dimensionFilters.value.selectedUrbanRural.includes(ur)
        })
      }
      if (dimensionFilters.value.selectedMetroAreas.length > 0) {
        filtered = filtered.filter(d => {
          const metro = d.urban_area_name || (d.cbsa_code ? `CBSA: ${d.cbsa_code}` : 'N/A')
          return dimensionFilters.value.selectedMetroAreas.includes(metro)
        })
      }
    } else if (currentLevel.value === 'zcta5') {
      if (dimensionFilters.value.selectedUrbanRural.length > 0) {
        filtered = filtered.filter(d => {
          const ur = d.urban_rural || 'N/A'
          return dimensionFilters.value.selectedUrbanRural.includes(ur)
        })
      }
      if (dimensionFilters.value.selectedAiannh.length > 0) {
        filtered = filtered.filter(d => {
          const aiannh = d.aiannh_name || 'N/A'
          return dimensionFilters.value.selectedAiannh.includes(aiannh)
        })
      }
      if (dimensionFilters.value.selectedMetroAreas.length > 0) {
        filtered = filtered.filter(d => {
          const metro = d.urban_area_name || (d.cbsa_code ? `CBSA: ${d.cbsa_code}` : 'N/A')
          return dimensionFilters.value.selectedMetroAreas.includes(metro)
        })
      }
    }

    if (dimensionFilters.value.populationMin !== null && dimensionFilters.value.populationMin !== '') {
      const popCol = filtered[0]?.total_population_2024 || 
                     filtered[0]?.total_population_2023 ||
                     filtered[0]?.total_population_2022 ||
                     Object.keys(filtered[0] || {}).find(k => k.includes('total_population'))
      if (popCol) {
        filtered = filtered.filter(d => {
          const pop = parseFloat(d[popCol]) || 0
          return pop >= parseFloat(dimensionFilters.value.populationMin)
        })
      }
    }
    if (dimensionFilters.value.populationMax !== null && dimensionFilters.value.populationMax !== '') {
      const popCol = filtered[0]?.total_population_2024 || 
                     filtered[0]?.total_population_2023 ||
                     filtered[0]?.total_population_2022 ||
                     Object.keys(filtered[0] || {}).find(k => k.includes('total_population'))
      if (popCol) {
        filtered = filtered.filter(d => {
          const pop = parseFloat(d[popCol]) || 0
          return pop <= parseFloat(dimensionFilters.value.populationMax)
        })
      }
    }
    if (dimensionFilters.value.areaMin !== null && dimensionFilters.value.areaMin !== '') {
      filtered = filtered.filter(d => {
        const area = parseFloat(d.land_area_sq_km) || 0
        return area >= parseFloat(dimensionFilters.value.areaMin)
      })
    }
    if (dimensionFilters.value.areaMax !== null && dimensionFilters.value.areaMax !== '') {
      filtered = filtered.filter(d => {
        const area = parseFloat(d.land_area_sq_km) || 0
        return area <= parseFloat(dimensionFilters.value.areaMax)
      })
    }
    if (currentMetric.value && dimensionFilters.value.metricValueMin !== null && dimensionFilters.value.metricValueMin !== '') {
      filtered = filtered.filter(d => {
        const val = parseFloat(d[currentMetric.value]) || 0
        return val >= parseFloat(dimensionFilters.value.metricValueMin)
      })
    }
    if (currentMetric.value && dimensionFilters.value.metricValueMax !== null && dimensionFilters.value.metricValueMax !== '') {
      filtered = filtered.filter(d => {
        const val = parseFloat(d[currentMetric.value]) || 0
        return val <= parseFloat(dimensionFilters.value.metricValueMax)
      })
    }

    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      filtered = filtered.filter(item => {
        return Object.values(item).some(val =>
          String(val).toLowerCase().includes(query)
        )
      })
    }

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
      const response = await fetch('./data/manifest.json')
      if (!response.ok) throw new Error('Failed to load manifest')
      manifest.value = await response.json()
      return manifest.value
    } catch (error) {
      console.error('Failed to load manifest:', error)
      throw error
    }
  }

  const loadDataset = async (filename) => {
    const cacheKey = `dataset_${filename}`

    if (dataCache.value.has(cacheKey)) {
      const cached = dataCache.value.get(cacheKey)
      data.value = cached
      return cached
    }

    isLoading.value = true

    try {
      const baseName = filename.replace('.csv', '')
      const [stateRes, countyRes, zcta5Res] = await Promise.all([
        fetch(`./data/${baseName}_state.csv`),
        fetch(`./data/${baseName}_county.csv`),
        fetch(`./data/${baseName}_zcta5.csv`)
      ])

      if (!stateRes.ok || !countyRes.ok || !zcta5Res.ok) {
        throw new Error('Failed to load data files')
      }

      const [stateData, countyData, zcta5Data] = await Promise.all([
        stateRes.text().then(parseCSV),
        countyRes.text().then(parseCSV),
        zcta5Res.text().then(parseCSV)
      ])

      const loadedData = {
        state: stateData,
        county: countyData,
        zcta5: zcta5Data
      }

      data.value = loadedData
      dataCache.value.set(cacheKey, loadedData)

      return loadedData
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

  const drillToState = (stateName) => {
    currentState.value = stateName
    currentCounty.value = null
    currentLevel.value = 'county'
    sortColumn.value = null
    sortDirection.value = 'asc'
  }

  const drillToCounty = (countyName) => {
    currentCounty.value = countyName
    currentLevel.value = 'zcta5'
    sortColumn.value = null
    sortDirection.value = 'asc'
  }

  const goBack = () => {
    if (currentLevel.value === 'zcta5') {
      currentCounty.value = null
      currentLevel.value = 'county'
    } else if (currentLevel.value === 'county') {
      currentState.value = null
      currentLevel.value = 'state'
    }
    sortColumn.value = null
    sortDirection.value = 'asc'
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
    dimensionFilters.value = {
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
    }
  }

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
