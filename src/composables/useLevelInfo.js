import { computed } from 'vue'
import { Map, Layers, Building } from 'lucide-vue-next'

export const useLevelInfo = (currentLevel) => {
  const levelIcon = computed(() => {
    const icons = {
      state: Map,
      county: Layers,
      zcta5: Building
    }
    return icons[currentLevel.value] || Map
  })
  
  const levelName = computed(() => {
    const names = {
      state: 'State Level',
      county: 'County Level',
      zcta5: 'ZIP Code Level'
    }
    return names[currentLevel.value] || 'Unknown'
  })
  
  return {
    levelIcon,
    levelName
  }
}
