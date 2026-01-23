import { ref, computed, watch, nextTick } from 'vue'
import { useCensusStore } from '../stores/census'

export const useFilters = () => {
  const store = useCensusStore()
  
  const selectedDataset = ref(store.currentDataset || '')
  const selectedYear = ref(store.currentYear || '')
  const selectedMetric = ref(store.currentMetric || '')
  const selectedCompareYear = ref(store.compareYear || '')

  const availableYears = computed(() => {
    if (!store.data.state?.length) {
      console.warn('[Filters] No state data available to extract years')
      return []
    }
    const firstRow = store.data.state[0]
    if (!firstRow || typeof firstRow !== 'object') {
      console.warn('[Filters] Cannot extract years: invalid first row')
      return []
    }
    const columns = Object.keys(firstRow)
    if (!columns.length) {
      console.warn('[Filters] Cannot extract years: no columns found')
      return []
    }
    const years = [...new Set(columns
      .map(col => col.match(/_(\d{4})$/)?.[1])
      .filter(Boolean)
    )].sort().reverse()
    
    if (!years.length) {
      console.error('[Filters] No years found. Columns:', columns.slice(0, 10))
    }
    
    return years
  })

  const availableMetrics = computed(() => {
    if (!store.data.state?.length || !selectedYear.value) return []
    const firstRow = store.data.state[0]
    if (!firstRow || typeof firstRow !== 'object') return []
    return Object.keys(firstRow)
      .filter(col => col.endsWith(`_${selectedYear.value}`))
      .map(col => ({
        value: col,
        label: col.replace(/_(\d{4})$/, '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      }))
  })

  const compareYears = computed(() => {
    if (!selectedMetric.value || !store.data.state?.length) return []
    const firstRow = store.data.state[0]
    if (!firstRow || typeof firstRow !== 'object') return []
    const years = [...new Set(Object.keys(firstRow)
      .map(col => col.match(/_(\d{4})$/)?.[1])
      .filter(Boolean)
    )].sort().reverse()
    return years.filter(y => y !== selectedYear.value)
  })

  const onDatasetChange = async () => {
    if (!selectedDataset.value) {
      store.currentDataset = null
      store.currentYear = null
      store.currentMetric = null
      return
    }
    try {
      await store.loadDataset(selectedDataset.value)
      store.currentDataset = selectedDataset.value
      
      await nextTick()
      
      if (store.data.state?.length) {
        let retries = 0
        while (retries < 20 && !availableYears.value?.length) {
          await new Promise(resolve => setTimeout(resolve, 50))
          await nextTick()
          retries++
        }
        
        if (availableYears.value?.length) {
          if (!selectedYear.value || !availableYears.value.includes(selectedYear.value)) {
            selectedYear.value = availableYears.value[0]
            await nextTick()
          }
          if (selectedYear.value) await onYearChange()
        } else {
          const errorMsg = `Year filter has no values. Dataset: ${selectedDataset.value}, Rows: ${store.data.state.length}`
          console.error(`[Filters] ${errorMsg}`)
          throw new Error(errorMsg)
        }
      } else {
        throw new Error(`Cannot extract years. Dataset: ${selectedDataset.value}, Reason: State data not loaded`)
      }
    } catch (error) {
      console.error('Failed to load dataset:', error)
      selectedDataset.value = ''
      store.currentDataset = null
      store.currentYear = null
      store.currentMetric = null
    }
  }

  const onYearChange = async () => {
    if (!selectedYear.value) return
    store.currentYear = selectedYear.value
    await nextTick()
    if (availableMetrics.value && availableMetrics.value.length > 0) {
      if (!selectedMetric.value || !availableMetrics.value.find(m => m.value === selectedMetric.value)) {
        selectedMetric.value = availableMetrics.value[0].value
      }
      onMetricChange()
    }
  }

  const onMetricChange = () => {
    if (!selectedMetric.value) return
    store.currentMetric = selectedMetric.value
    if (!store.compareYear) {
      store.setAutoCompareYear()
    }
    store.savePreferences()
  }

  const handleCompareYearChange = (event) => {
    const value = event.target?.value || event
    if (value === '') {
      store.setAutoCompareYear()
    } else {
      store.compareYear = value
    }
  }

  watch(() => store.currentDataset, (val) => {
    if (val && val !== selectedDataset.value) selectedDataset.value = val
  }, { immediate: true })

  watch(() => store.currentYear, (val) => {
    if (val && val !== selectedYear.value) selectedYear.value = val
  }, { immediate: true })

  watch(() => store.currentMetric, (val) => {
    if (val && val !== selectedMetric.value) selectedMetric.value = val
  }, { immediate: true })

  watch(() => store.compareYear, (val) => {
    selectedCompareYear.value = val || ''
  }, { immediate: true })

  watch(() => availableYears.value, async (years, oldYears) => {
    if (years?.length && selectedDataset.value && store.currentDataset === selectedDataset.value) {
      if (!selectedYear.value || !years.includes(selectedYear.value)) {
        selectedYear.value = years[0]
        await nextTick()
        if (selectedYear.value) await onYearChange()
      }
    } else if (selectedDataset.value && store.currentDataset === selectedDataset.value && !years?.length) {
      if (oldYears?.length) {
        console.warn(`[Filters] Years became empty for dataset ${selectedDataset.value}`)
      } else if (store.data.state?.length) {
        console.error(`[Filters] Year filter has no values. Rows: ${store.data.state.length}`)
      }
    }
  }, { immediate: true })

  watch(() => store.data.state, async (newData) => {
    if (newData?.length && selectedDataset.value && store.currentDataset === selectedDataset.value) {
      await nextTick()
      if (availableYears.value?.length && (!selectedYear.value || !availableYears.value.includes(selectedYear.value))) {
        selectedYear.value = availableYears.value[0]
        await nextTick()
        if (selectedYear.value) await onYearChange()
      }
    }
  }, { immediate: true, deep: true })

  return {
    selectedDataset,
    selectedYear,
    selectedMetric,
    selectedCompareYear,
    availableYears,
    availableMetrics,
    compareYears,
    onDatasetChange,
    onYearChange,
    onMetricChange,
    handleCompareYearChange
  }
}
