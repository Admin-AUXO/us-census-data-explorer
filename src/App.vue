<template>
  <div id="app">
    <HeaderControls @show-help="showHelp = true" @toggle-filters="filtersOpen = !filtersOpen" />
    <HelpPanel v-if="showHelp" @close="showHelp = false" />
    <DimensionFilters :is-open="filtersOpen" @close="filtersOpen = false" />

    <Transition name="fade">
      <div v-if="store.isLevelTransitioning" class="level-transition-overlay">
        <div class="transition-loader">
          <div class="loader-spinner"></div>
          <p class="loader-text">Loading {{ nextLevelName }}...</p>
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
      <div class="container">
        <div class="footer-content">
          <div class="footer-section">
            <h4>About This Project</h4>
            <p>Interactive visualization of US Census ACS data at multiple geographic levels with comprehensive statistical analysis and insights.</p>
          </div>
          <div class="footer-section">
            <h4>Data Source</h4>
            <p>US Census Bureau - American Community Survey (ACS) 5-Year Estimates (2022)</p>
          </div>
          <div class="footer-section">
            <h4>Quick Links</h4>
            <div class="footer-links">
              <a href="#" @click.prevent="showHelp = true">
                <Info :size="16" />
                Help Guide
              </a>
              <a href="https://www.census.gov/data/developers/data-sets/acs-5year.html" target="_blank">
                <ExternalLink :size="16" />
                API Documentation
              </a>
              <a href="https://data.census.gov" target="_blank">
                <ExternalLink :size="16" />
                Census Data Portal
              </a>
            </div>
          </div>
        </div>
        <div class="footer-bottom">
          <p>&copy; 2024 US Census Data Explorer | Built with Vue 3 & Modern Web Technologies</p>
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

const store = useCensusStore()
const showHelp = ref(false)
const filtersOpen = ref(false)

const nextLevelName = computed(() => {
  if (store.currentLevel === 'state') return 'County Level'
  if (store.currentLevel === 'county') return 'ZIP Code Level'
  return 'Data'
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
  await store.loadManifest()
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
  padding: 2rem;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.loader-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid var(--border-color);
  border-top-color: var(--accent-green);
  border-radius: 50%;
  animation: spin 0.6s cubic-bezier(0.5, 0, 0.5, 1) infinite;
}

.loader-text {
  color: var(--text-primary);
  font-size: 0.9375rem;
  font-weight: 600;
  margin: 0;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
}

.data-container {
  background: var(--bg-card);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow);
  border: 1px solid var(--border-color);
  overflow: hidden;
}

.table-wrapper {
  padding: 1.5rem;
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

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
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
  background: var(--bg-secondary);
  color: var(--text-primary);
  padding: 2.5rem 0 1.25rem;
  margin-top: auto;
  border-top: 1px solid var(--border-color);
}

.footer-content {
  display: grid;
  grid-template-columns: 2fr 1.5fr 1.5fr;
  gap: 3rem;
  margin-bottom: 2rem;
}

.footer-section h4 {
  color: var(--accent-green);
  font-size: 0.875rem;
  margin-bottom: 0.875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.footer-section p {
  color: var(--text-secondary);
  line-height: 1.6;
  font-size: 0.875rem;
  margin: 0;
}

.footer-links {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.footer-links a {
  color: var(--text-secondary);
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all var(--duration-fast) var(--easing-standard);
  font-size: 0.875rem;
  padding: 0.25rem 0;
}

.footer-links a:hover {
  color: var(--accent-green);
  transform: translateX(2px);
}

.footer-links a svg {
  flex-shrink: 0;
  opacity: 0.7;
}

.footer-links a:hover svg {
  opacity: 1;
}

.footer-bottom {
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-color);
  text-align: center;
}

.footer-bottom p {
  color: var(--text-tertiary);
  font-size: 0.8125rem;
  margin: 0;
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

  .footer-content {
    gap: 1.5rem;
  }

  .empty-state-features {
    flex-direction: column;
    gap: 1rem;
  }

  .footer {
    padding: 2rem 0 1rem;
  }

  .footer-content {
    grid-template-columns: 1fr;
    gap: 2rem;
    margin-bottom: 1.5rem;
  }

  .footer-bottom {
    padding-top: 1.25rem;
  }
}
</style>
