import { ref } from 'vue'
import { getDataPath } from '../utils/dataLoader'
import { parseCSV } from '../utils/csvParser'

export const useDataLoader = () => {
  const loadingProgress = ref({ loaded: 0, total: 0, percentage: 0, stage: '' })
  
  const loadCSVFile = async (filename, level, onProgress) => {
    const levelNames = { state: 'States', county: 'Counties', zcta5: 'ZIP Codes' }
    const baseName = filename.replace('.csv', '')
    
    try {
      loadingProgress.value = { loaded: 0, total: 0, percentage: 0, stage: `Loading ${levelNames[level]} data...` }
      
      const filePath = getDataPath(`data/${baseName}_${level}.csv`)
      if (import.meta.env.DEV) {
        console.log(`[DataLoader] Loading ${level} data from: ${filePath}`)
      }
      const response = await fetch(filePath)

      if (!response.ok) {
        const errorMsg = `Failed to load ${level} data: ${response.status} ${response.statusText} from ${filePath}. Expected file: public/data/${baseName}_${level}.csv`
        console.error(`[DataLoader] ${errorMsg}`)
        throw new Error(errorMsg)
      }
      
      if (import.meta.env.DEV) {
        console.log(`[DataLoader] ${level} data file found, size: ${response.headers.get('content-length') || 'unknown'} bytes`)
      }

      const contentLength = response.headers.get('content-length')
      if (contentLength) {
        loadingProgress.value.total = parseInt(contentLength, 10)
      }

      loadingProgress.value.stage = `Downloading ${levelNames[level]}...`
      const text = await response.text()
      
      loadingProgress.value.stage = `Processing ${levelNames[level]}...`
      const levelData = await parseCSV(text, (progress) => {
        loadingProgress.value = { ...progress, stage: progress.stage || `Processing ${levelNames[level]}...` }
        if (onProgress) onProgress(progress)
      })
      
      loadingProgress.value.stage = `Finalizing ${levelNames[level]}...`
      
      if (!levelData?.length) {
        throw new Error(`No data loaded for ${level} level from ${filePath}`)
      }
      
      if (import.meta.env.DEV) {
        console.log(`[DataLoader] ${levelNames[level]} data loaded: ${levelData.length} rows`)
      }

      loadingProgress.value = { loaded: levelData.length, total: levelData.length, percentage: 100, stage: `${levelNames[level]} loaded` }
      
      return levelData
    } catch (error) {
      console.error(`[DataLoader] Failed to load ${level} dataset:`, error)
      loadingProgress.value = { loaded: 0, total: 0, percentage: 0, stage: `Failed to load ${levelNames[level]}` }
      throw error
    }
  }

  return {
    loadingProgress,
    loadCSVFile
  }
}
