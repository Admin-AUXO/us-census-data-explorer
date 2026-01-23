<template>
  <div class="summary-panel">
    <div class="summary-header">
      <div class="summary-title">
        <BarChart3 :size="24" class="header-icon" />
        <h2>Data Summary & Insights</h2>
      </div>
      <button
        class="collapse-btn"
        @click="isExpanded = !isExpanded"
        :aria-expanded="isExpanded"
        aria-label="Toggle summary panel"
      >
        <ChevronDown :size="20" :class="{ rotated: !isExpanded }" />
      </button>
    </div>

    <transition name="expand">
      <div v-show="isExpanded" class="summary-content">
        <div v-if="!store.currentMetric || !store.data.state" class="summary-placeholder">
          <TrendingUp :size="48" class="placeholder-icon" />
          <p>Select a dataset, year, and metric to view comprehensive insights</p>
        </div>

        <div v-else class="summary-grid">
          <div class="summary-card card-primary">
            <div class="card-header">
              <MapPin :size="20" />
              <h3>Geographic Context</h3>
            </div>
            <div class="card-content">
              <div class="metric-row">
                <span class="metric-label">Current Level</span>
                <span class="metric-value highlight">{{ levelLabel }}</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Total Locations</span>
                <span class="metric-value">{{ totalLocations.toLocaleString() }}</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">With Data</span>
                <span class="metric-value">{{ validDataCount.toLocaleString() }}</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Coverage</span>
                <span class="metric-value">{{ coveragePercent }}%</span>
              </div>
              <div v-if="geoInfo.totalPopulation" class="metric-row">
                <span class="metric-label">Total Population</span>
                <span class="metric-value">{{ geoInfo.totalPopulation.toLocaleString() }}</span>
              </div>
              <div v-if="geoInfo.totalArea" class="metric-row">
                <span class="metric-label">Total Area</span>
                <span class="metric-value">{{ geoInfo.totalArea }} km²</span>
              </div>
            </div>
          </div>

          <div class="summary-card card-secondary">
            <div class="card-header">
              <Activity :size="20" />
              <h3>Statistics & Distribution</h3>
            </div>
            <div class="card-content">
              <div class="metric-row">
                <span class="metric-label">Mean</span>
                <span class="metric-value">{{ formatValue(stats.mean) }}</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Median</span>
                <span class="metric-value">{{ formatValue(stats.median) }}</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Min</span>
                <span class="metric-value text-blue">{{ formatValue(stats.min) }}</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Max</span>
                <span class="metric-value text-green">{{ formatValue(stats.max) }}</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Range</span>
                <span class="metric-value">{{ formatValue(stats.range) }}</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Std. Deviation</span>
                <span class="metric-value">{{ formatValue(stats.stdDev) }}</span>
              </div>
            </div>
          </div>

          <div class="summary-card card-trend">
            <div class="card-header">
              <TrendingUp :size="20" />
              <h3>Trend Analysis</h3>
            </div>
            <div class="card-content">
              <div v-if="trendInfo.yoyChange !== null" class="metric-row">
                <span class="metric-label">{{ trendInfo.changeLabel }}</span>
                <span class="metric-value" :class="trendInfo.yoyChangeClass">
                  {{ trendInfo.yoyChange > 0 ? '+' : '' }}{{ trendInfo.yoyChange.toFixed(1) }}%
                </span>
              </div>
              <div v-else class="metric-row">
                <span class="metric-label">Year-over-Year</span>
                <span class="metric-value">N/A</span>
              </div>
              <div v-if="trendInfo.avgAnnualGrowth !== null && trendInfo.showAvgGrowth" class="metric-row">
                <span class="metric-label">{{ trendInfo.avgGrowthLabel }}</span>
                <span class="metric-value" :class="trendInfo.avgGrowthClass">
                  {{ trendInfo.avgAnnualGrowth > 0 ? '+' : '' }}{{ trendInfo.avgAnnualGrowth.toFixed(1) }}%
                </span>
              </div>
              <div v-else class="metric-row">
                <span class="metric-label">Avg. Annual Growth</span>
                <span class="metric-value">N/A</span>
              </div>
              <div v-if="trendInfo.trendDirection" class="metric-row">
                <span class="metric-label">Trend Direction</span>
                <span class="metric-value" :class="trendInfo.trendClass">
                  {{ trendInfo.trendDirection }}
                </span>
              </div>
              <div v-else class="metric-row">
                <span class="metric-label">Trend Direction</span>
                <span class="metric-value">N/A</span>
              </div>
              <div v-if="trendInfo.volatility !== null" class="metric-row">
                <span class="metric-label">Volatility</span>
                <span class="metric-value">{{ trendInfo.volatility.toFixed(2) }}</span>
              </div>
              <div v-else class="metric-row">
                <span class="metric-label">Volatility</span>
                <span class="metric-value">N/A</span>
              </div>
            </div>
          </div>

          <div class="summary-card card-accent">
            <div class="card-header">
              <Activity :size="20" />
              <h3>Aggregates</h3>
            </div>
            <div class="card-content">
              <div class="metric-row">
                <span class="metric-label">Total Sum</span>
                <span class="metric-value bold">{{ formatValue(stats.sum) }}</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">IQR (Q3 - Q1)</span>
                <span class="metric-value">{{ formatValue(stats.iqr) }}</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Coeff. of Variation</span>
                <span class="metric-value">{{ (stats.coefficientOfVariation * 100).toFixed(1) }}%</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Skewness</span>
                <span class="metric-value" :class="skewnessClass">{{ stats.skewness.toFixed(2) }}</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Q1 (25th)</span>
                <span class="metric-value">{{ formatValue(stats.q1) }}</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Q3 (75th)</span>
                <span class="metric-value">{{ formatValue(stats.q3) }}</span>
              </div>
            </div>
          </div>

          <div class="summary-card card-full">
            <div class="card-header">
              <Award :size="20" />
              <h3>Top & Bottom Performers</h3>
            </div>
            <div class="card-content performers">
              <div class="performer-section">
                <div class="performer-label">
                  <TrendingUp :size="16" />
                  <span>Highest</span>
                </div>
                <div class="performer-list">
                  <div v-for="(item, idx) in topPerformers" :key="idx" class="performer-item top">
                    <span class="rank">#{{ idx + 1 }}</span>
                    <span class="name">{{ item.name }}</span>
                    <span class="value">{{ formatValue(item.value) }}</span>
                    <span v-if="item.changePercent !== null" :class="['performer-change', item.changeClass]">
                      {{ item.changePercent > 0 ? '+' : '' }}{{ item.changePercent.toFixed(1) }}%
                    </span>
                  </div>
                </div>
              </div>
              <div class="performer-section">
                <div class="performer-label">
                  <TrendingDown :size="16" />
                  <span>Lowest</span>
                </div>
                <div class="performer-list">
                  <div v-for="(item, idx) in bottomPerformers" :key="idx" class="performer-item bottom">
                    <span class="rank">#{{ idx + 1 }}</span>
                    <span class="name">{{ item.name }}</span>
                    <span class="value">{{ formatValue(item.value) }}</span>
                    <span v-if="item.changePercent !== null" :class="['performer-change', item.changeClass]">
                      {{ item.changePercent > 0 ? '+' : '' }}{{ item.changePercent.toFixed(1) }}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useCensusStore } from '../../stores/census'
import {
  BarChart3,
  ChevronDown,
  MapPin,
  Activity,
  Award,
  TrendingUp,
  TrendingDown
} from 'lucide-vue-next'

const store = useCensusStore()
const isExpanded = ref(false)

const levelLabel = computed(() => {
  const labels = {
    state: 'State Level',
    county: 'County Level',
    zcta5: 'ZIP Code Level'
  }
  return labels[store.currentLevel] || 'Unknown'
})

const totalLocations = computed(() => {
  return store.filteredData?.length || 0
})

const validDataCount = computed(() => {
  if (!store.currentMetric || !store.filteredData) return 0
  return store.filteredData.filter(row => {
    const val = parseFloat(row[store.currentMetric])
    return !isNaN(val) && val > 0
  }).length
})

const coveragePercent = computed(() => {
  if (totalLocations.value === 0) return 0
  return ((validDataCount.value / totalLocations.value) * 100).toFixed(1)
})

const stats = computed(() => {
  if (!store.currentMetric || !store.filteredData) {
    return {
      mean: 0, median: 0, stdDev: 0, min: 0, max: 0, sum: 0, range: 0,
      q1: 0, q3: 0, iqr: 0, coefficientOfVariation: 0, skewness: 0
    }
  }

  const values = store.filteredData
    .map(row => parseFloat(row[store.currentMetric]))
    .filter(v => !isNaN(v) && v > 0)

  if (values.length === 0) {
    return {
      mean: 0, median: 0, stdDev: 0, min: 0, max: 0, sum: 0, range: 0,
      q1: 0, q3: 0, iqr: 0, coefficientOfVariation: 0, skewness: 0
    }
  }

  const sorted = [...values].sort((a, b) => a - b)
  const sum = values.reduce((a, b) => a + b, 0)
  const mean = sum / values.length

  // Median
  const median = sorted.length % 2 === 0
    ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    : sorted[Math.floor(sorted.length / 2)]

  // Quartiles
  const q1Index = Math.floor(sorted.length * 0.25)
  const q3Index = Math.floor(sorted.length * 0.75)
  const q1 = sorted[q1Index]
  const q3 = sorted[q3Index]
  const iqr = q3 - q1

  // Standard deviation
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
  const stdDev = Math.sqrt(variance)

  // Coefficient of variation
  const coefficientOfVariation = mean !== 0 ? stdDev / mean : 0

  // Skewness
  const skewness = values.reduce((sum, val) => sum + Math.pow((val - mean) / stdDev, 3), 0) / values.length

  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min

  return {
    mean,
    median,
    stdDev,
    min,
    max,
    sum,
    range,
    q1,
    q3,
    iqr,
    coefficientOfVariation,
    skewness
  }
})

const skewnessClass = computed(() => {
  if (stats.value.skewness > 0.5) return 'text-green'
  if (stats.value.skewness < -0.5) return 'text-blue'
  return ''
})

const topPerformers = computed(() => {
  if (!store.currentMetric || !store.filteredData) return []

  const baseMetric = store.currentMetric.replace(/_\d{4}$/, '')
  const compareYear = store.compareYear

  const data = store.filteredData
    .map(row => {
      const current = parseFloat(row[store.currentMetric])
      let change = null
      let changePercent = null
      let changeClass = 'change-neutral'

      if (compareYear) {
        const compare = parseFloat(row[`${baseMetric}_${compareYear}`])
        if (!isNaN(current) && !isNaN(compare) && compare > 0) {
          change = current - compare
          changePercent = ((current - compare) / compare) * 100
          changeClass = changePercent > 0 ? 'change-positive' : changePercent < 0 ? 'change-negative' : 'change-neutral'
        }
      }

      return {
        name: getPrimaryName(row),
        value: current,
        change,
        changePercent,
        changeClass
      }
    })
    .filter(item => !isNaN(item.value) && item.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 3)

  return data
})

const bottomPerformers = computed(() => {
  if (!store.currentMetric || !store.filteredData) return []

  const baseMetric = store.currentMetric.replace(/_\d{4}$/, '')
  const compareYear = store.compareYear

  const data = store.filteredData
    .map(row => {
      const current = parseFloat(row[store.currentMetric])
      let change = null
      let changePercent = null
      let changeClass = 'change-neutral'

      if (compareYear) {
        const compare = parseFloat(row[`${baseMetric}_${compareYear}`])
        if (!isNaN(current) && !isNaN(compare) && compare > 0) {
          change = current - compare
          changePercent = ((current - compare) / compare) * 100
          changeClass = changePercent > 0 ? 'change-positive' : changePercent < 0 ? 'change-negative' : 'change-neutral'
        }
      }

      return {
        name: getPrimaryName(row),
        value: current,
        change,
        changePercent,
        changeClass
      }
    })
    .filter(item => !isNaN(item.value) && item.value > 0)
    .sort((a, b) => a.value - b.value)
    .slice(0, 3)

  return data
})

const getPrimaryName = (row) => {
  if (store.currentLevel === 'state') {
    return row.state_name || row.NAME || 'Unknown'
  } else if (store.currentLevel === 'county') {
    return row.county_name || row.NAME || 'Unknown'
  } else {
    return row.zcta5 || row.NAME || 'Unknown'
  }
}

const geoInfo = computed(() => {
  if (!store.filteredData || store.filteredData.length === 0) {
    return { totalPopulation: null, totalArea: null, urbanCount: null, ruralCount: null }
  }

  let totalPop = 0
  let totalArea = 0
  let urbanCount = 0
  let ruralCount = 0

  const firstRow = store.filteredData && store.filteredData.length > 0 ? store.filteredData[0] : null
  const popCol = firstRow?.total_population_2024 || 
                 firstRow?.total_population_2023 ||
                 firstRow?.total_population_2022 ||
                 (firstRow && typeof firstRow === 'object' ? Object.keys(firstRow).find(k => k.includes('total_population')) : null)

  store.filteredData.forEach(row => {
    if (popCol && row[popCol]) {
      totalPop += parseFloat(row[popCol]) || 0
    }
    if (row.land_area_sq_km) {
      totalArea += parseFloat(row.land_area_sq_km) || 0
    }
    if (row.urban_rural === 'Urban') urbanCount++
    else if (row.urban_rural === 'Rural') ruralCount++
  })

  return {
    totalPopulation: totalPop > 0 ? totalPop : null,
    totalArea: totalArea > 0 ? totalArea.toFixed(2) : null,
    urbanCount: urbanCount > 0 ? urbanCount : null,
    ruralCount: ruralCount > 0 ? ruralCount : null
  }
})

const formatValue = (num) => {
  if (num === 0) return '0'
  return num.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

const trendInfo = computed(() => {
  if (!store.currentMetric || !store.filteredData || !store.compareYear) {
    return {
      yoyChange: null,
      yoyChangeClass: '',
      changeLabel: '',
      avgAnnualGrowth: null,
      avgGrowthClass: '',
      avgGrowthLabel: '',
      showAvgGrowth: false,
      trendDirection: null,
      trendClass: '',
      volatility: null
    }
  }

  const baseMetric = store.currentMetric.replace(/_\d{4}$/, '')
  const currentYear = parseInt(store.currentMetric.match(/_(\d{4})$/)?.[1] || '0')
  const compareYear = parseInt(store.compareYear)
  const previousYear = store.getPreviousYear(store.currentYear)
  const isPreviousYear = previousYear && compareYear.toString() === previousYear
  const isPastYear = compareYear < currentYear
  const isFutureYear = compareYear > currentYear
  const yearsDiff = Math.abs(currentYear - compareYear)
  
  const values = store.filteredData
    .map(row => {
      const current = parseFloat(row[store.currentMetric])
      const compare = parseFloat(row[`${baseMetric}_${store.compareYear}`])
      if (isNaN(current) || isNaN(compare) || compare === 0) return null
      return { current, compare, change: ((current - compare) / compare) * 100 }
    })
    .filter(v => v !== null)

  if (values.length === 0) {
    return {
      yoyChange: null,
      yoyChangeClass: '',
      changeLabel: '',
      avgAnnualGrowth: null,
      avgGrowthClass: '',
      avgGrowthLabel: '',
      showAvgGrowth: false,
      trendDirection: null,
      trendClass: '',
      volatility: null
    }
  }

  const avgChange = values.reduce((sum, v) => sum + v.change, 0) / values.length
  const avgAnnualGrowth = yearsDiff > 0 ? avgChange / yearsDiff : avgChange

  const yearValues = []
  for (let year = Math.min(compareYear, currentYear); year <= Math.max(compareYear, currentYear); year++) {
    const yearMetric = `${baseMetric}_${year}`
    const yearAvg = store.filteredData
      .map(row => parseFloat(row[yearMetric]))
      .filter(v => !isNaN(v) && v > 0)
    if (yearAvg.length > 0) {
      yearValues.push(yearAvg.reduce((a, b) => a + b, 0) / yearAvg.length)
    }
  }

  let volatility = 0
  if (yearValues.length > 1) {
    const mean = yearValues.reduce((a, b) => a + b, 0) / yearValues.length
    const variance = yearValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / yearValues.length
    volatility = Math.sqrt(variance) / mean
  }

  let trendDirection = 'Stable'
  let trendClass = 'change-neutral'
  if (avgChange > 2) {
    trendDirection = 'Rising'
    trendClass = 'change-positive'
  } else if (avgChange < -2) {
    trendDirection = 'Declining'
    trendClass = 'change-negative'
  }

  let changeLabel = 'Change'
  if (isPreviousYear) {
    changeLabel = 'YoY Change'
  } else if (isPastYear) {
    changeLabel = `Change vs ${compareYear}`
  } else if (isFutureYear) {
    changeLabel = `Change vs ${compareYear} (Future)`
  } else {
    changeLabel = `Change vs ${compareYear}`
  }
  
  let avgGrowthLabel = 'Growth Rate'
  if (yearsDiff === 1) {
    avgGrowthLabel = isPastYear ? 'Annual Growth' : 'Annual Change'
  } else if (yearsDiff > 1) {
    avgGrowthLabel = isPastYear 
      ? `Avg Growth (${yearsDiff} yrs)` 
      : `Avg Change (${yearsDiff} yrs)`
  }

  return {
    yoyChange: avgChange,
    yoyChangeClass: avgChange > 0 ? 'change-positive' : avgChange < 0 ? 'change-negative' : 'change-neutral',
    changeLabel,
    avgAnnualGrowth,
    avgGrowthClass: avgAnnualGrowth > 0 ? 'change-positive' : avgAnnualGrowth < 0 ? 'change-negative' : 'change-neutral',
    avgGrowthLabel,
    showAvgGrowth: yearsDiff > 1,
    trendDirection,
    trendClass,
    volatility
  }
})
</script>

<style scoped>
.summary-panel {
  background: var(--bg-card);
  border-radius: var(--radius-xl);
  padding: 0;
  margin-bottom: 2rem;
  box-shadow: var(--shadow);
  border: 1px solid var(--border-color);
  overflow: hidden;
}

.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  background: var(--bg-elevated);
  border-bottom: 1px solid var(--border-color);
}

.summary-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--text-primary);
}

.header-icon {
  color: var(--accent-green);
}

.summary-title h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
}

.collapse-btn {
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  padding: 0.5rem;
  border-radius: var(--radius-md);
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: all var(--duration-fast) var(--easing-standard);
}

.collapse-btn:hover {
  background: var(--bg-elevated);
  border-color: var(--accent-green);
  color: var(--accent-green);
  transform: scale(1.05);
}

.collapse-btn svg.rotated {
  transform: rotate(-90deg);
}

.summary-content {
  padding: 2rem;
  background: var(--bg-card);
}

.summary-placeholder {
  text-align: center;
  padding: 3rem 2rem;
  color: var(--text-secondary);
}

.placeholder-icon {
  color: var(--text-tertiary);
  margin-bottom: 1rem;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--spacing-xl);
}

@media (min-width: 1200px) {
  .summary-grid {
    grid-template-columns: repeat(4, 1fr);
  }
  
  .summary-card:not(.card-full) {
    min-width: 0;
    width: 100%;
  }
  
  .card-full {
    grid-column: 1 / -1;
  }
}

.summary-card {
  background: var(--bg-surface);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  box-shadow: var(--shadow-sm);
  transition: all var(--duration-normal) var(--easing-standard);
  border: 1px solid var(--border-color);
}

.summary-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
  border-color: var(--accent-green-opacity-30);
}

.card-primary {
  border-left: 3px solid var(--accent-green);
}

.card-secondary {
  border-left: 3px solid var(--accent-green);
}

.card-tertiary {
  border-left: 3px solid var(--accent-green);
}

.card-accent {
  border-left: 3px solid var(--accent-green);
}

.card-trend {
  border-left: 3px solid var(--accent-green);
}

.card-full {
  grid-column: 1 / -1;
  border-left: 3px solid var(--accent-green);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--border-color);
}

.card-header svg {
  color: var(--accent-green);
}

.card-primary .card-header {
  color: var(--text-primary);
}

.card-secondary .card-header {
  color: var(--text-primary);
}

.card-tertiary .card-header {
  color: var(--text-primary);
}

.card-accent .card-header {
  color: var(--text-primary);
}

.card-full .card-header {
  color: var(--text-primary);
}

.card-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.metric-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
}

.metric-label {
  font-size: 0.9rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.metric-value {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.metric-value.highlight {
  color: var(--accent-green);
  font-size: 1.1rem;
}

.metric-value.accent {
  color: var(--accent-green);
  font-size: 1.1rem;
}

.metric-value.bold {
  font-size: 1.2rem;
  color: var(--accent-green);
}

.metric-value.text-blue {
  color: var(--text-secondary);
}

.metric-value.text-green {
  color: var(--accent-green);
}

.metric-value.text-blue {
  color: #3b82f6;
}

.metric-sublabel {
  font-size: 0.75rem;
  color: var(--text-tertiary);
  margin-left: 0.5rem;
  font-weight: 400;
}

.metric-value.change-positive {
  color: #10b981;
}

.metric-value.change-negative {
  color: #ef4444;
}

.metric-value.change-neutral {
  color: #3b82f6;
}

.performers {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
}

.performer-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.performer-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: var(--text-primary);
  font-size: 1rem;
}

.performer-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.performer-item {
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  gap: 0.875rem;
  align-items: center;
  padding: 0.875rem 1rem;
  border-radius: var(--radius-md);
  background: var(--bg-elevated);
  border: 1px solid var(--border-color);
  transition: all var(--duration-fast) var(--easing-standard);
}

.performer-item:hover {
  background: var(--bg-surface);
  border-color: var(--accent-green);
  transform: translateX(4px);
}

.performer-item.top {
  border-left: 3px solid var(--accent-green);
}

.performer-item.bottom {
  border-left: 3px solid var(--text-secondary);
}

.performer-item .rank {
  font-weight: 700;
  color: var(--text-secondary);
  font-size: 0.85rem;
  flex-shrink: 0;
}

.performer-item .name {
  font-weight: 600;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.9rem;
  min-width: 0;
}

.performer-item .value {
  font-weight: 700;
  color: var(--accent-green);
  font-size: 0.95rem;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.performer-change {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-sm);
  white-space: nowrap;
  flex-shrink: 0;
}

.performer-change.change-positive {
  color: #10b981;
  background-color: rgba(16, 185, 129, 0.1);
}

.performer-change.change-negative {
  color: #ef4444;
  background-color: rgba(239, 68, 68, 0.1);
}

.performer-change.change-neutral {
  color: #3b82f6;
  background-color: rgba(59, 130, 246, 0.1);
}

.expand-enter-active,
.expand-leave-active {
  transition: all var(--duration-slow) var(--easing-standard);
  max-height: 2000px;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
}

@media (max-width: 768px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }

  .performers {
    grid-template-columns: 1fr;
  }
}
</style>
