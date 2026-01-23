import Papa from 'papaparse'

export const parseCSV = async (text, onProgress) => {
  return new Promise((resolve, reject) => {
    let rowCount = 0
    const estimatedTotal = Math.max(1000, text.split('\n').length - 1)

    Papa.parse(text, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      fastMode: true,
      worker: false,
      step: () => {
        rowCount++
        if (onProgress && rowCount % 5000 === 0) {
          onProgress({ loaded: rowCount, total: estimatedTotal, percentage: Math.min(95, Math.round((rowCount / estimatedTotal) * 100)), stage: 'Parsing data...' })
        }
      },
      chunkSize: 2 * 1024 * 1024,
      complete: (results) => {
        if (onProgress) {
          onProgress({ loaded: results.data.length, total: results.data.length, percentage: 100, stage: 'Processing complete' })
        }
        resolve(results.data)
      },
      error: reject
    })
  })
}
