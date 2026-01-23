<template>
  <div id="app">
    <div class="scroll-tracker" :style="{ width: `${scrollPercentage}%` }"></div>
    <HeaderControls @show-help="showHelp = true" @toggle-filters="filtersOpen = !filtersOpen" />
    <HelpPanel v-if="showHelp" @close="showHelp = false" />
    <DimensionFilters :is-open="filtersOpen" @close="filtersOpen = false" />

    <Transition name="fade">
      <div v-if="store.isLoading && store.loadingProgress.stage" class="level-transition-overlay">
        <div class="transition-loader">
          <div class="loader-spinner"></div>
          <div class="loader-content">
            <p class="loader-text">{{ transitionMessage }}</p>
            <div v-if="store.loadingProgress.total > 0 && store.loadingProgress.percentage > 0" class="loader-progress">
              <div class="progress-bar">
                <div 
                  class="progress-fill" 
                  :style="{ width: `${store.loadingProgress.percentage}%` }"
                ></div>
              </div>
              <p class="progress-text">
                <span v-if="store.loadingProgress.loaded > 0">
                  {{ store.loadingProgress.loaded.toLocaleString() }} 
                  <span v-if="store.loadingProgress.total > 0">/ {{ store.loadingProgress.total.toLocaleString() }}</span>
                </span>
                <span v-if="store.loadingProgress.percentage > 0" class="progress-percentage">
                  {{ store.loadingProgress.percentage }}%
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <main class="main-content" :class="{ 'with-sidebar': filtersOpen, 'transitioning': store.isLevelTransitioning }">
      <div class="container">
        <SummaryPanel />

        <div class="data-container">
          <div class="table-wrapper">
            <DataTable v-if="store.currentMetric && store.data.state" />
            <div v-else class="empty-state">
              <div class="empty-state-icon">
                <Database :size="64" />
              </div>
              <h3>Get Started with Census Data Explorer</h3>
              <p>Select a dataset, year, and metric from the controls above to begin exploring comprehensive US Census data across states, counties, and ZIP codes.</p>
              <div class="empty-state-features">
                <div class="feature-item">
                  <MapPin :size="24" />
                  <span>Multi-level Geographic Analysis</span>
                </div>
                <div class="feature-item">
                  <TrendingUp :size="24" />
                  <span>Rich Statistical Insights</span>
                </div>
                <div class="feature-item">
                  <BarChart :size="24" />
                  <span>Interactive Data Visualization</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <footer class="footer">
      <div class="footer-container">
        <div class="footer-main">
          <div class="footer-brand">
            <AuxoLogo size="small" />
            <div class="brand-info">
              <p class="brand-site">auxodata.com</p>
            </div>
          </div>
          <div class="footer-sections">
            <div class="footer-section">
              <h4>About</h4>
              <p>Explore comprehensive US Census data through interactive visualizations across states, counties, and ZIP codes. Analyze demographic, economic, and housing trends with advanced filtering and statistical insights.</p>
            </div>
            <div class="footer-section">
              <h4>Data Source</h4>
              <p>US Census Bureau - American Community Survey (ACS) 5-Year Estimates</p>
            </div>
            <div class="footer-section">
              <h4>Resources</h4>
              <div class="footer-links">
                <a href="#" @click.prevent="showHelp = true">
                  <Info :size="16" />
                  <span>Help Guide</span>
                </a>
                <a href="https://www.census.gov/data/developers/data-sets/acs-5year.html" target="_blank" rel="noopener noreferrer">
                  <ExternalLink :size="16" />
                  <span>API Docs</span>
                </a>
                <a href="https://data.census.gov" target="_blank" rel="noopener noreferrer">
                  <ExternalLink :size="16" />
                  <span>Data Portal</span>
                </a>
              </div>
            </div>
          </div>
        </div>
        <div class="footer-bottom">
          <p>&copy; 2026 AUXO Data Labs</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useCensusStore } from './stores/census'
import HeaderControls from './components/layout/HeaderControls.vue'
import DataTable from './components/data/DataTable.vue'
import SummaryPanel from './components/data/SummaryPanel.vue'
import HelpPanel from './components/common/HelpPanel.vue'
import DimensionFilters from './components/filters/DimensionFilters.vue'
import { Database, MapPin, TrendingUp, BarChart, Info, ExternalLink } from 'lucide-vue-next'
import AuxoLogo from './components/common/AuxoLogo.vue'

const store = useCensusStore()
const showHelp = ref(false)
const filtersOpen = ref(false)
const scrollPercentage = ref(0)

const updateScrollTracker = () => {
  const windowHeight = window.innerHeight
  const documentHeight = document.documentElement.scrollHeight
  const scrollTop = window.scrollY || document.documentElement.scrollTop
  const scrollableHeight = documentHeight - windowHeight
  
  if (scrollableHeight > 0) {
    scrollPercentage.value = (scrollTop / scrollableHeight) * 100
  } else {
    scrollPercentage.value = 0
  }
}

const transitionMessage = computed(() => {
  if (!store.isLoading) return ''
  if (store.loadingProgress.stage) {
    return store.loadingProgress.stage
  }
  return 'Loading Data...'
})

const handleKeydown = (event) => {
  if (event.target.tagName === 'INPUT' || event.target.tagName === 'SELECT') {
    return
  }

  if (event.key === 'Escape') {
    if (showHelp.value) {
      showHelp.value = false
    } else {
      store.reset()
    }
  } else if (event.key === '?' || (event.key === '/' && event.shiftKey)) {
    event.preventDefault()
    showHelp.value = !showHelp.value
  }
}

onMounted(async () => {
  document.addEventListener('keydown', handleKeydown)
  window.addEventListener('scroll', updateScrollTracker, { passive: true })
  window.addEventListener('resize', updateScrollTracker, { passive: true })
  updateScrollTracker()
  
  try {
    if (!store.manifest) {
      await store.loadManifest()
    }
  } catch (error) {
    console.error('Failed to load manifest:', error)
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('scroll', updateScrollTracker)
  window.removeEventListener('resize', updateScrollTracker)
})
</script>

<style scoped>
</style>
