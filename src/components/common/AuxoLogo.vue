<template>
  <div class="auxo-logo-container">
    <svg :width="computedWidth" :height="computedHeight" viewBox="0 0 200 60" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(0, 8)">
        <rect x="0" y="0" width="24" height="24" fill="#A3E635" rx="2"/>
        <text x="12" y="18" text-anchor="middle" font-family="Montserrat, -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif" font-weight="900" font-size="16" fill="#000000">A</text>
        <rect x="28" y="0" width="24" height="24" fill="#A3E635" rx="2"/>
        <text x="40" y="18" text-anchor="middle" font-family="Montserrat, -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif" font-weight="900" font-size="16" fill="#000000">U</text>
        <rect x="0" y="28" width="24" height="24" fill="#A3E635" rx="2"/>
        <text x="12" y="46" text-anchor="middle" font-family="Montserrat, -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif" font-weight="900" font-size="16" fill="#000000">X</text>
        <rect x="28" y="28" width="24" height="24" fill="#A3E635" rx="2"/>
        <text x="40" y="46" text-anchor="middle" font-family="Montserrat, -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif" font-weight="900" font-size="16" fill="#000000">O</text>
      </g>
      <g transform="translate(60, 30)">
        <text x="0" y="0" dominant-baseline="middle" font-family="'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif" font-size="20" font-weight="800" fill="#FFFFFF" letter-spacing="-0.02em">Data Labs</text>
        <text x="0" y="18" dominant-baseline="middle" font-family="'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif" font-size="12" font-weight="600" font-style="italic" fill="#A3E635" letter-spacing="-0.01em">Look Beyond Data</text>
      </g>
    </svg>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  size: {
    type: String,
    default: 'normal',
    validator: (value) => ['small', 'normal', 'large'].includes(value)
  }
})

const computedWidth = computed(() => {
  const sizes = {
    small: 140,
    normal: 180,
    large: 260
  }
  return sizes[props.size] || sizes.normal
})

const computedHeight = computed(() => {
  const sizes = {
    small: 50,
    normal: 60,
    large: 90
  }
  return sizes[props.size] || sizes.normal
})
</script>

<style scoped>
.auxo-logo-container {
  display: inline-flex !important;
  align-items: center !important;
  padding: 0 !important;
  margin: 0 !important;
  margin-right: 0 !important;
  padding-right: 0 !important;
  line-height: 0 !important;
  vertical-align: middle !important;
  flex-shrink: 0 !important;
  width: auto !important;
}

.auxo-logo-container svg {
  max-width: 100% !important;
  height: auto !important;
  display: block !important;
  padding: 0 !important;
  margin: 0 !important;
  margin-right: 0 !important;
  padding-right: 0 !important;
  vertical-align: middle !important;
  flex-shrink: 0 !important;
  width: auto !important;
}

@media (max-width: 768px) {
  .auxo-logo-container svg {
    max-width: 240px;
  }
}

@media (max-width: 480px) {
  .auxo-logo-container svg {
    max-width: 200px;
  }
}
</style>
