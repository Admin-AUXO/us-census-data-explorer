<template>
  <div v-if="sortedData && sortedData.length > 0">
    <div class="table-header">
      <h2>
        {{ tableTitle }}
        <span class="count-badge">{{ sortedData.length }}</span>
      </h2>
      <div class="table-actions">
        <button class="btn-sort" @click="handleSort(sortByColumn)">
          <span class="sort-label">Sort by {{ sortByLabel }}</span>
          <span class="sort-icon">{{ getSortIcon(sortByColumn) }}</span>
        </button>
        <button class="btn-sort" @click="handleSort(store.currentMetric)">
          <span class="sort-label">Sort by Value</span>
          <span class="sort-icon">{{ getSortIcon(store.currentMetric) }}</span>
        </button>
        <button class="btn-sort btn-export" @click="exportCSV" title="Export current view as CSV">
          <span>📥</span>
          <span class="sort-label">Export CSV</span>
        </button>
      </div>
    </div>

    <div class="heatmap-legend" v-if="sortedData.length > 0 && minValue !== maxValue">
      <div class="legend-label">Value Range:</div>
      <div class="legend-gradient">
        <div class="legend-gradient-bar" :style="getLegendGradientStyle()"></div>
        <div class="legend-labels">
          <span class="legend-min">{{ formatValue(minValue) }}</span>
          <span class="legend-max">{{ formatValue(maxValue) }}</span>
        </div>
      </div>
      <div class="legend-indicators">
        <span class="legend-indicator">
          <span class="indicator-color" style="background: rgb(30, 40, 60);"></span>
          <span>Low</span>
        </span>
        <span class="legend-indicator">
          <span class="indicator-color" style="background: rgb(163, 230, 53);"></span>
          <span>High</span>
        </span>
      </div>
    </div>

    <div class="table-container" :class="{ 'filtering': store.isFiltering }">
      <Transition name="fade">
        <div v-if="store.isFiltering" class="filtering-overlay">
          <div class="filtering-spinner"></div>
          <span class="filtering-text">Filtering data...</span>
        </div>
      </Transition>
      <table class="data-table">
        <thead>
          <tr>
            <th class="col-state">{{ primaryColumnLabel }}</th>
            <th v-if="store.currentLevel === 'state'" class="col-abbr">Abbr</th>
            <th v-if="store.currentLevel === 'state'" class="col-region">Region</th>
            <th v-if="store.currentLevel === 'county' || store.currentLevel === 'zcta5'" class="col-urban-rural">Urban/Rural</th>
            <th v-if="store.currentLevel === 'county' || store.currentLevel === 'zcta5'" class="col-metro">Metro Area</th>
            <th v-if="store.currentLevel === 'zcta5' && hasAiannh" class="col-aiannh">AIANNH</th>
            <th v-if="store.currentLevel === 'zcta5'" class="col-area">Area (km²)</th>
            <th class="col-value">{{ metricLabel }}</th>
            <th v-if="hasComparison" class="col-change">YoY Change</th>
            <th v-if="store.currentLevel !== 'zcta5'" class="col-count">
              {{ store.currentLevel === 'state' ? 'Counties' : 'ZIP Codes' }}
            </th>
            <th v-if="store.currentLevel === 'state'" class="col-count">ZIP Codes</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, index) in sortedData"
            :key="getRowKey(row, index)"
            :class="getRowClass(row)"
            @click="handleRowClick(row)"
          >
            <td class="primary-col col-state">
              {{ getPrimaryValue(row) }}
              <span v-if="isMaxValue(row)" class="value-badge badge-top">Top</span>
              <span v-if="isMinValue(row)" class="value-badge badge-bottom">Low</span>
            </td>
            <td v-if="store.currentLevel === 'state'" class="col-abbr">
              {{ row.state_abbr || '' }}
            </td>
            <td v-if="store.currentLevel === 'state'" class="col-region">
              {{ getRegionName(row.census_region) }}
            </td>
            <td v-if="store.currentLevel === 'county' || store.currentLevel === 'zcta5'" class="col-urban-rural">
              {{ row.urban_rural || 'N/A' }}
            </td>
            <td v-if="store.currentLevel === 'county' || store.currentLevel === 'zcta5'" class="col-metro">
              {{ row.urban_area_name || (row.cbsa_code ? `CBSA: ${row.cbsa_code}` : 'N/A') }}
            </td>
            <td v-if="store.currentLevel === 'zcta5' && hasAiannh" class="col-aiannh">
              {{ row.aiannh_name || 'N/A' }}
            </td>
            <td v-if="store.currentLevel === 'zcta5'" class="col-area">
              {{ formatArea(row.land_area_sq_km) }}
            </td>
            <td class="value-col col-value" :style="getHeatStyle(row)">
              {{ formatValue(row[store.currentMetric]) }}
            </td>
            <td v-if="hasComparison" class="col-change">
              <div class="change-container">
                <div class="change-absolute">{{ formatChangeAbsolute(row) }}</div>
                <div :class="['change-percent', getChangeClass(row)]">{{ formatChangePercent(row) }}</div>
              </div>
            </td>
            <td v-if="store.currentLevel !== 'zcta5'" class="col-count">
              {{ getChildCount(row) }}
            </td>
            <td v-if="store.currentLevel === 'state'" class="col-count">
              {{ getZipCount(row) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'
import { useCensusStore } from '../stores/census'

const store = useCensusStore()

const sortedData = computed(() => {
  const data = store.filteredData
  return data ? store.sortData(data) : []
})

const tableTitle = computed(() => {
  if (store.currentLevel === 'state') return 'States'
  if (store.currentLevel === 'county') return `Counties in ${store.currentState}`
  return `ZIP Codes in ${store.currentCounty}, ${store.currentState}`
})

const primaryColumnLabel = computed(() => {
  if (store.currentLevel === 'state') return 'State'
  if (store.currentLevel === 'county') return 'County'
  return 'ZIP Code'
})

const sortByColumn = computed(() => {
  if (store.currentLevel === 'state') return 'state_name'
  if (store.currentLevel === 'county') return 'county_name'
  return 'zcta5'
})

const sortByLabel = computed(() => {
  if (store.currentLevel === 'state') return 'Name'
  if (store.currentLevel === 'county') return 'Name'
  return 'ZIP'
})

const metricLabel = computed(() => {
  const metric = store.currentMetric
  if (!metric) return ''
  const base = metric.replace(/_\d{4}$/, '').replace(/_/g, ' ')
  return base.replace(/\b\w/g, l => l.toUpperCase()) + ` (${store.currentYear})`
})

const values = computed(() => {
  return sortedData.value
    .map(row => parseFloat(row[store.currentMetric]))
    .filter(v => !isNaN(v) && v > 0)
})

const minValue = computed(() => values.value.length > 0 ? Math.min(...values.value) : 0)
const maxValue = computed(() => values.value.length > 0 ? Math.max(...values.value) : 0)
const valueRange = computed(() => maxValue.value - minValue.value || 1)

const getPrimaryValue = (row) => {
  if (store.currentLevel === 'state') return row.state_name || 'Unknown'
  if (store.currentLevel === 'county') return row.county_name || 'Unknown'
  return row.zcta5 || 'Unknown'
}

const getRowKey = (row, index) => {
  if (store.currentLevel === 'state') return row.state_name || `state-${index}`
  if (store.currentLevel === 'county') return `${row.state_name}-${row.county_name}` || `county-${index}`
  return row.zcta5 || `zcta5-${index}`
}

const getRowClass = (row) => {
  const classes = []
  if (store.currentLevel !== 'zcta5') classes.push('drillable')

  const value = parseFloat(row[store.currentMetric])
  if (value === maxValue.value && maxValue.value > 0) classes.push('row-max')
  if (value === minValue.value && minValue.value > 0) classes.push('row-min')

  return classes.join(' ')
}

const handleRowClick = (row) => {
  if (store.currentLevel === 'state') {
    store.drillToState(row.state_name)
  } else if (store.currentLevel === 'county') {
    store.drillToCounty(row.county_name)
  }
}

const handleSort = (column) => {
  store.toggleSort(column)
}

const getSortIcon = (column) => {
  if (store.sortColumn !== column) return '↕'
  return store.sortDirection === 'asc' ? '↑' : '↓'
}

const formatValue = (value) => {
  if (value == null || value === '') return 'N/A'
  const num = parseFloat(value)
  if (isNaN(num)) return value
  return num.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

const getColorForIntensity = (intensity) => {
  const lowColor = { r: 30, g: 40, b: 60 }
  const midLowColor = { r: 60, g: 100, b: 150 }
  const midHighColor = { r: 120, g: 180, b: 100 }
  const highColor = { r: 163, g: 230, b: 53 }
  
  let bgColor
  if (intensity < 0.33) {
    const t = intensity / 0.33
    bgColor = {
      r: Math.round(lowColor.r + (midLowColor.r - lowColor.r) * t),
      g: Math.round(lowColor.g + (midLowColor.g - lowColor.g) * t),
      b: Math.round(lowColor.b + (midLowColor.b - lowColor.b) * t)
    }
  } else if (intensity < 0.67) {
    const t = (intensity - 0.33) / 0.34
    bgColor = {
      r: Math.round(midLowColor.r + (midHighColor.r - midLowColor.r) * t),
      g: Math.round(midLowColor.g + (midHighColor.g - midLowColor.g) * t),
      b: Math.round(midLowColor.b + (midHighColor.b - midLowColor.b) * t)
    }
  } else {
    const t = (intensity - 0.67) / 0.33
    bgColor = {
      r: Math.round(midHighColor.r + (highColor.r - midHighColor.r) * t),
      g: Math.round(midHighColor.g + (highColor.g - midHighColor.g) * t),
      b: Math.round(midHighColor.b + (highColor.b - midHighColor.b) * t)
    }
  }
  return bgColor
}

const getHeatStyle = (row) => {
  const value = parseFloat(row[store.currentMetric])
  if (isNaN(value) || value <= 0) {
    return {
      backgroundColor: 'transparent',
      color: 'var(--text-primary)'
    }
  }

  const intensity = (value - minValue.value) / valueRange.value
  const bgColor = getColorForIntensity(intensity)
  
  const brightness = (bgColor.r * 299 + bgColor.g * 587 + bgColor.b * 114) / 1000
  const textColor = brightness > 140 ? '#000000' : '#FFFFFF'
  const textShadow = brightness > 140 
    ? '0 1px 2px rgba(255, 255, 255, 0.3)' 
    : '0 1px 3px rgba(0, 0, 0, 0.5)'
  
  return {
    backgroundColor: `rgb(${bgColor.r}, ${bgColor.g}, ${bgColor.b})`,
    color: textColor,
    textShadow: textShadow,
    fontWeight: '600'
  }
}

const getLegendGradientStyle = () => {
  const lowColor = getColorForIntensity(0)
  const midColor = getColorForIntensity(0.5)
  const highColor = getColorForIntensity(1)
  
  return {
    background: `linear-gradient(to right, 
      rgb(${lowColor.r}, ${lowColor.g}, ${lowColor.b}), 
      rgb(${midColor.r}, ${midColor.g}, ${midColor.b}), 
      rgb(${highColor.r}, ${highColor.g}, ${highColor.b}))`
  }
}

const isMaxValue = (row) => {
  const value = parseFloat(row[store.currentMetric])
  return value === maxValue.value && maxValue.value > 0
}

const isMinValue = (row) => {
  const value = parseFloat(row[store.currentMetric])
  return value === minValue.value && minValue.value > 0
}

const hasComparison = computed(() => {
  return store.compareYear !== null && store.compareYear !== ''
})

const getCompareValue = (row) => {
  if (!hasComparison.value) return null
  const baseMetric = store.currentMetric.replace(/_\d{4}$/, '')
  const compareMetric = `${baseMetric}_${store.compareYear}`
  return row[compareMetric]
}

const formatChangePercent = (row) => {
  const current = parseFloat(row[store.currentMetric])
  const compare = parseFloat(getCompareValue(row))

  if (isNaN(current) || isNaN(compare) || compare === 0) return 'N/A'

  const pct = ((current - compare) / compare) * 100
  const sign = pct >= 0 ? '+' : ''
  return `${sign}${pct.toFixed(1)}%`
}

const formatChangeAbsolute = (row) => {
  const current = parseFloat(row[store.currentMetric])
  const compare = parseFloat(getCompareValue(row))

  if (isNaN(current) || isNaN(compare)) return 'N/A'

  const change = current - compare
  const sign = change >= 0 ? '+' : ''
  return `${sign}${formatValue(change)}`
}

const getChangeClass = (row) => {
  const current = parseFloat(row[store.currentMetric])
  const compare = parseFloat(getCompareValue(row))
  
  if (isNaN(current) || isNaN(compare) || compare === 0) {
    return 'change-neutral'
  }
  
  const pct = ((current - compare) / compare) * 100
  
  if (pct > 0) return 'change-positive'
  if (pct < 0) return 'change-negative'
  return 'change-neutral'
}

const getChildCount = (row) => {
  if (store.currentLevel === 'state') {
    return store.data.county?.filter(c => c.state_name === row.state_name).length || 0
  } else if (store.currentLevel === 'county') {
    return store.data.zcta5?.filter(z =>
      z.state_name === store.currentState && z.county_name === row.county_name
    ).length || 0
  }
  return 0
}

const getZipCount = (row) => {
  if (store.currentLevel === 'state') {
    return store.data.zcta5?.filter(z => z.state_name === row.state_name).length || 0
  }
  return 0
}

const hasAiannh = computed(() => {
  if (!sortedData.value || sortedData.value.length === 0) return false
  return sortedData.value.some(row => row.aiannh_name && row.aiannh_name !== 'N/A' && row.aiannh_name !== '')
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

const formatArea = (area) => {
  if (!area || area === 0) return 'N/A'
  const num = parseFloat(area)
  if (isNaN(num)) return 'N/A'
  if (num < 1) return num.toFixed(3)
  return num.toFixed(2)
}

const exportCSV = () => {
  if (!sortedData.value || sortedData.value.length === 0) {
    alert('No data to export')
    return
  }

  const headers = Object.keys(sortedData.value[0])
  const csvContent = [
    headers.join(','),
    ...sortedData.value.map(row =>
      headers.map(header => {
        const value = row[header]
        return typeof value === 'string' && value.includes(',')
          ? `"${value}"`
          : value
      }).join(',')
    )
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  const filename = `census_${store.currentLevel}_${store.currentMetric}.csv`

  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
</script>

<style scoped>
.table-container {
  position: relative;
  overflow: auto;
}

.table-container.filtering {
  opacity: 0.7;
  pointer-events: none;
}

.filtering-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--overlay-bg-light);
  backdrop-filter: blur(var(--blur-sm));
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  z-index: var(--z-index-overlay);
  border-radius: var(--radius-md);
}

.filtering-spinner {
  width: var(--size-icon-4xl);
  height: var(--size-icon-4xl);
  border: var(--border-width-md) solid var(--border-color);
  border-top-color: var(--accent-green);
  border-radius: var(--radius-full);
  animation: spin var(--duration-slowest) linear infinite;
}

.filtering-text {
  color: var(--text-primary);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  font-family: var(--font-body);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--duration-normal) var(--easing-standard);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}


.heatmap-legend {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1.5rem;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  margin-bottom: 1rem;
  flex-wrap: wrap;
  animation: fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.legend-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.legend-gradient {
  flex: 1;
  min-width: 200px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.legend-gradient-bar {
  width: 100%;
  height: 24px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-color);
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
}

.legend-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: var(--text-tertiary);
  font-weight: 500;
}

.legend-indicators {
  display: flex;
  gap: 1.25rem;
  align-items: center;
}

.legend-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.indicator-color {
  width: 20px;
  height: 20px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-color);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .heatmap-legend {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
  }

  .legend-label {
    text-align: center;
  }

  .legend-gradient {
    min-width: 100%;
  }

  .legend-indicators {
    justify-content: center;
  }
}
</style>
