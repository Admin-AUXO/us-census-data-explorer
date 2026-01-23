<template>
  <div id="app">
    <HeaderControls @show-help="showHelp = true" @toggle-filters="filtersOpen = !filtersOpen" />
    <HelpPanel v-if="showHelp" @close="showHelp = false" />
    <DimensionFilters :is-open="filtersOpen" @close="filtersOpen = false" />

    <Transition name="fade">
      <div v-if="store.isLevelTransitioning || store.isLoading" class="level-transition-overlay">
        <div class="transition-loader">
          <div class="loader-spinner"></div>
          <div class="loader-content">
            <p class="loader-text">{{ transitionMessage }}</p>
            <p v-if="store.loadingProgress.stage" class="loader-stage">{{ store.loadingProgress.stage }}</p>
            <div v-if="store.loadingProgress.total > 0" class="loader-progress">
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
import HeaderControls from './components/HeaderControls.vue'
import DataTable from './components/DataTable.vue'
import SummaryPanel from './components/SummaryPanel.vue'
import HelpPanel from './components/HelpPanel.vue'
import DimensionFilters from './components/DimensionFilters.vue'
import { Database, MapPin, TrendingUp, BarChart, Info, ExternalLink } from 'lucide-vue-next'
import AuxoLogo from './components/AuxoLogo.vue'

const store = useCensusStore()
const showHelp = ref(false)
const filtersOpen = ref(false)

const transitionMessage = computed(() => {
  if (store.isLevelTransitioning || store.isLoading) {
    if (store.navigationDirection === 'backward') {
      if (store.currentLevel === 'county') return 'Returning to State Level'
      if (store.currentLevel === 'zcta5') return 'Returning to County Level'
      return 'Returning...'
    } else {
      if (store.currentLevel === 'state') return 'Loading County Level...'
      if (store.currentLevel === 'county') return 'Loading ZIP Code Level...'
      return 'Loading Data...'
    }
  }
  return 'Loading...'
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
  } else if (event.key === 'Backspace' && (event.ctrlKey || event.metaKey)) {
    event.preventDefault()
    store.goBack()
  }
}

onMounted(async () => {
  document.addEventListener('keydown', handleKeydown)
  try {
    await store.loadManifest()
  } catch (error) {
    console.error('Failed to load manifest:', error)
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style>
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
}

.main-content {
  flex: 1;
  padding: 1.5rem 0;
  transition: margin-right var(--duration-normal) var(--easing-standard);
}

.main-content.with-sidebar {
  margin-right: 0;
}

.main-content.transitioning {
  opacity: 0.6;
  pointer-events: none;
  transition: opacity 0.2s ease;
}

@media (min-width: 769px) {
  .main-content.with-sidebar {
    margin-right: 420px;
  }
}

.level-transition-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
}

.transition-loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  padding: 2rem 2.5rem;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(163, 230, 53, 0.1);
  animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  min-width: 300px;
  max-width: 420px;
  will-change: transform;
  backface-visibility: hidden;
}

.loader-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid var(--bg-elevated);
  border-top-color: var(--accent-green);
  border-radius: 50%;
  animation: spin 0.8s cubic-bezier(0.5, 0, 0.5, 1) infinite;
  box-shadow: 0 0 20px rgba(163, 230, 53, 0.2);
}

.loader-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
}

.loader-text {
  color: var(--text-primary);
  font-size: 0.9375rem;
  font-weight: 600;
  margin: 0;
  text-align: center;
}

.loader-stage {
  color: var(--text-secondary);
  font-size: 0.8125rem;
  font-weight: 500;
  margin: 0;
  text-align: center;
}

.loader-progress {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: var(--bg-elevated);
  border-radius: var(--radius-full);
  overflow: hidden;
  position: relative;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent-green), rgba(163, 230, 53, 0.85));
  border-radius: var(--radius-full);
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 0 12px rgba(163, 230, 53, 0.5);
  position: relative;
  overflow: hidden;
}

.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  animation: shimmer 2s infinite;
}

.progress-text {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
  color: var(--text-tertiary);
  margin: 0;
}

.progress-percentage {
  font-weight: 600;
  color: var(--accent-green);
}

.container {
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  padding: 0 clamp(1rem, 4vw, 3rem);
}

.data-container {
  background: var(--bg-card);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow);
  border: 1px solid var(--border-color);
  overflow: hidden;
  width: 100%;
}

.table-wrapper {
  padding: clamp(1rem, 2vw, 2rem);
  width: 100%;
  overflow-x: auto;
}

.empty-state {
  text-align: center;
  padding: 3rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
}

.empty-state-icon {
  color: var(--text-tertiary);
  animation: float 3s ease-in-out infinite;
}

.empty-state h3 {
  color: var(--text-primary);
  font-size: 1.5rem;
  margin: 0;
  font-weight: 700;
}

.empty-state p {
  color: var(--text-secondary);
  font-size: 1rem;
  max-width: 600px;
  line-height: 1.6;
  margin: 0;
}

.empty-state-features {
  display: flex;
  gap: 2rem;
  margin-top: 1rem;
  flex-wrap: wrap;
  justify-content: center;
}

.feature-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: var(--bg-surface);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  min-width: 180px;
  transition: all var(--duration-fast) var(--easing-standard);
}

.feature-item:hover {
  background: var(--bg-elevated);
  border-color: var(--accent-green);
  transform: translateY(-2px);
}

.feature-item svg {
  color: var(--accent-green);
}

.feature-item span {
  font-size: 0.9rem;
  color: var(--text-primary);
  font-weight: 500;
  text-align: center;
}

.footer {
  background: var(--bg-card);
  color: var(--text-primary);
  padding: 2.5rem 0 1.25rem;
  margin-top: auto;
  border-top: 1px solid var(--border-color);
}

.footer-container {
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  padding: 0 clamp(1rem, 4vw, 3rem);
}

.footer-main {
  display: grid;
  grid-template-columns: 1.2fr 2.8fr;
  gap: 4rem;
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid var(--border-color);
  align-items: start;
}

.footer-brand {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.footer-brand > :deep(.auxo-logo-container) {
  margin: 0;
  padding: 0;
}

.brand-info {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.brand-site {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
  font-weight: 500;
}

.footer-sections {
  display: grid;
  grid-template-columns: 1.3fr 1fr 1fr;
  gap: 3rem;
  align-items: start;
}

.footer-section h4 {
  color: var(--accent-green);
  font-size: 0.8125rem;
  margin: 0 0 0.875rem 0;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.footer-section p {
  color: var(--text-secondary);
  line-height: 1.7;
  font-size: 0.875rem;
  margin: 0;
  max-width: 100%;
}

.footer-links {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.footer-links a {
  color: var(--text-secondary);
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.625rem;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 0.875rem;
  padding: 0.375rem 0.5rem;
  margin: 0 -0.5rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.footer-links a:hover {
  color: var(--accent-green);
  transform: translateX(4px);
  background: var(--accent-green-opacity-10);
}

.footer-links a:focus {
  outline: 2px solid var(--accent-green);
  outline-offset: 2px;
  color: var(--accent-green);
  background: var(--accent-green-opacity-05);
}

.footer-links a:active {
  transform: translateX(2px);
  background: var(--accent-green-opacity-15);
}

.footer-links a svg {
  flex-shrink: 0;
  color: var(--accent-green);
  opacity: 0.8;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.footer-links a:hover svg,
.footer-links a:focus svg {
  opacity: 1;
  transform: scale(1.05);
}

.footer-bottom {
  padding-top: 1.5rem;
  text-align: center;
}

.footer-bottom p {
  color: var(--text-tertiary);
  font-size: 0.8125rem;
  margin: 0;
}

@media (min-width: 1920px) {
  .container {
    padding: 0 clamp(2rem, 5vw, 4rem);
  }

  .header-top,
  .header-nav,
  .header-filters-bar {
    padding-left: clamp(2rem, 5vw, 4rem);
    padding-right: clamp(2rem, 5vw, 4rem);
  }

  .footer-container {
    padding: 0 clamp(2rem, 5vw, 4rem);
  }
}

@media (min-width: 2560px) {
  .container {
    padding: 0 clamp(3rem, 6vw, 6rem);
  }

  .header-top,
  .header-nav,
  .header-filters-bar {
    padding-left: clamp(3rem, 6vw, 6rem);
    padding-right: clamp(3rem, 6vw, 6rem);
  }

  .footer-container {
    padding: 0 clamp(3rem, 6vw, 6rem);
  }
}

@media (max-width: 768px) {
  .container {
    padding: 0 1rem;
  }

  .main-content {
    padding: 1rem 0;
  }

  .table-wrapper {
    padding: 1rem;
  }

  .footer-container {
    padding: 0 1rem;
  }

  .footer-main {
    grid-template-columns: 1fr;
    gap: 2rem;
    padding-bottom: 1.5rem;
  }

  .footer-sections {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .footer {
    padding: 2rem 0 1rem;
  }

  .footer-bottom {
    padding-top: 1.25rem;
  }
}
</style>
