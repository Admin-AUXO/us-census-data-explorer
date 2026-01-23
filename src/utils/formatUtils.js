export const formatValue = (value) => {
  if (value == null || value === '') return 'N/A'
  const num = parseFloat(value)
  return isNaN(num) ? value : num.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

export const formatPercent = (value, decimals = 1) => {
  if (value == null || value === '') return 'N/A'
  const num = parseFloat(value)
  return isNaN(num) ? 'N/A' : `${num.toFixed(decimals)}%`
}

export const formatChange = (current, previous, showPercent = true) => {
  const curr = parseFloat(current)
  const prev = parseFloat(previous)
  
  if (isNaN(curr) || isNaN(prev) || prev === 0) return { absolute: 'N/A', percent: 'N/A', class: 'change-neutral' }
  
  const absolute = curr - prev
  const percent = ((absolute / prev) * 100)
  const sign = absolute >= 0 ? '+' : ''
  
  return {
    absolute: `${sign}${formatValue(absolute)}`,
    percent: showPercent ? `${sign}${percent.toFixed(1)}%` : '',
    class: absolute > 0 ? 'change-positive' : absolute < 0 ? 'change-negative' : 'change-neutral'
  }
}

export const formatDatasetName = (filename) => {
  return filename
    .replace('.csv', '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
}

export const formatArea = (area) => {
  if (!area || area === 0) return 'N/A'
  const num = parseFloat(area)
  if (isNaN(num)) return 'N/A'
  if (num < 1) return num.toFixed(3)
  return num.toFixed(2)
}
