import { ref } from 'vue'

export const useCache = () => {
  const dataCache = ref(new Map())
  const filterCache = ref(new Map())
  const lastFilterKey = ref('')
  
  const getCacheKey = (baseName, level) => {
    return `${baseName}_${level}`
  }
  
  const hasCache = (baseName, level) => {
    return dataCache.value.has(getCacheKey(baseName, level))
  }
  
  const getCache = (baseName, level) => {
    return dataCache.value.get(getCacheKey(baseName, level))
  }
  
  const setCache = (baseName, level, data) => {
    dataCache.value.set(getCacheKey(baseName, level), data)
  }
  
  const clearFilterCache = () => {
    filterCache.value.clear()
    lastFilterKey.value = ''
  }
  
  const clearDataCache = () => {
    dataCache.value.clear()
  }
  
  const getFilterCache = (key) => {
    if (filterCache.value.has(key) && lastFilterKey.value === key) {
      return filterCache.value.get(key)
    }
    return null
  }
  
  const setFilterCache = (key, data) => {
    if (filterCache.value.size > 10) {
      filterCache.value.clear()
    }
    filterCache.value.set(key, data)
    lastFilterKey.value = key
  }
  
  return {
    dataCache,
    filterCache,
    lastFilterKey,
    getCacheKey,
    hasCache,
    getCache,
    setCache,
    clearFilterCache,
    clearDataCache,
    getFilterCache,
    setFilterCache
  }
}
