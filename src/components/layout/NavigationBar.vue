<template>
  <div class="navigation-bar">
    <div class="nav-container">
      <div class="breadcrumb-section">
        <button
          v-if="store.currentLevel !== 'state'"
          class="back-button"
          @click="store.goBack()"
          aria-label="Go back to previous level"
        >
          <ChevronLeft :size="20" />
          <span>Back</span>
        </button>

        <div class="breadcrumb-trail">
          <button
            class="breadcrumb-item root"
            @click="store.reset()"
            :class="{ active: store.currentLevel === 'state' }"
          >
            <Globe :size="18" />
            <span>United States</span>
          </button>

          <ChevronRight v-if="store.currentState" :size="16" class="separator" />

          <button
            v-if="store.currentState"
            class="breadcrumb-item"
            @click="navigateToState"
            :class="{ active: store.currentLevel === 'county' }"
          >
            <MapPin :size="18" />
            <span>{{ store.currentState }}</span>
          </button>

          <ChevronRight v-if="store.currentCounty" :size="16" class="separator" />

          <button
            v-if="store.currentCounty"
            class="breadcrumb-item"
            :class="{ active: store.currentLevel === 'zcta5' }"
            disabled
          >
            <Building :size="18" />
            <span>{{ store.currentCounty }}</span>
          </button>
        </div>
      </div>

      <div class="level-indicator">
        <div class="indicator-icon">
          <component :is="levelIcon" :size="20" />
        </div>
        <div class="indicator-text">
          <span class="level-label">Current View</span>
          <span class="level-value">{{ levelName }}</span>
        </div>
      </div>
    </div>

    <div v-if="store.isLoading" class="loading-bar">
      <div class="loading-progress"></div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useCensusStore } from '../../stores/census'
import { ChevronLeft, ChevronRight, Globe, MapPin, Building, Map, Layers } from 'lucide-vue-next'

const store = useCensusStore()

const levelIcon = computed(() => {
  const icons = {
    state: Map,
    county: Layers,
    zcta5: Building
  }
  return icons[store.currentLevel] || Map
})

const levelName = computed(() => {
  const names = {
    state: 'State Level',
    county: 'County Level',
    zcta5: 'ZIP Code Level'
  }
  return names[store.currentLevel] || 'Unknown'
})

const navigateToState = () => {
  if (store.currentLevel === 'zcta5' || store.currentLevel === 'county') {
    store.goBack()
  }
}
</script>

<style scoped>
.navigation-bar {
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  box-shadow: var(--shadow);
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1.25rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
}

.breadcrumb-section {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  min-width: 0;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: var(--accent-green);
  color: var(--text-on-accent);
  border: none;
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--duration-fast) var(--easing-standard);
  box-shadow: var(--shadow-md);
  font-size: 0.95rem;
}

.back-button:hover {
  background: rgba(var(--accent-green-rgb), 0.85);
  transform: translateX(-4px);
  box-shadow: var(--shadow-lg);
}

.back-button:active {
  transform: translateX(-2px);
}

.breadcrumb-trail {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  min-width: 0;
}

.breadcrumb-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--duration-fast) var(--easing-standard);
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

.breadcrumb-item:not(:disabled):hover {
  background: var(--bg-surface);
  border-color: var(--accent-green);
  color: var(--accent-green);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.breadcrumb-item.root {
  background: var(--accent-green-opacity-15);
  border-color: var(--accent-green);
  color: var(--accent-green);
  font-weight: 600;
}

.breadcrumb-item.active {
  background: var(--accent-green);
  border-color: var(--accent-green);
  color: var(--text-on-accent);
  cursor: default;
}

.breadcrumb-item:disabled {
  background: var(--bg-card);
  color: var(--text-tertiary);
  cursor: default;
}

.separator {
  color: var(--text-tertiary);
  flex-shrink: 0;
}

.level-indicator {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.25rem;
  background: var(--bg-elevated);
  border: 1px solid var(--accent-green);
  border-radius: var(--radius-lg);
  min-width: 180px;
}

.indicator-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: var(--accent-green-opacity-20);
  border-radius: var(--radius-md);
  color: var(--accent-green);
  box-shadow: var(--shadow-sm);
}

.indicator-text {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.level-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.level-value {
  font-size: 0.95rem;
  color: var(--accent-green);
  font-weight: 700;
}

.loading-bar {
  height: 3px;
  background: var(--bg-secondary);
  overflow: hidden;
}

.loading-progress {
  height: 100%;
  background: var(--accent-green);
  animation: loading 1.5s ease-in-out infinite;
}

@keyframes loading {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

@media (max-width: 1024px) {
  .nav-container {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .breadcrumb-section {
    flex-direction: column;
    align-items: stretch;
  }

  .level-indicator {
    width: 100%;
  }
}

@media (max-width: 640px) {
  .nav-container {
    padding: 1rem;
  }

  .breadcrumb-item span {
    max-width: 120px;
  }

  .back-button {
    width: 100%;
    justify-content: center;
  }
}
</style>
