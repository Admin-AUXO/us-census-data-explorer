<template>
  <div class="auxo-logo-container">
    <svg :width="computedWidth" :height="computedHeight" viewBox="0 0 420 140" xmlns="http://www.w3.org/2000/svg">
      <!-- Logo positioned on the left, vertically centered with text -->
      <g transform="translate(10, 40)">
        <rect x="0" y="0" width="24" height="24" fill="#A3E635" rx="2"/>
        <text x="12" y="18" text-anchor="middle" font-family="Montserrat, -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif" font-weight="900" font-size="16" fill="#000000">A</text>
        <rect x="28" y="0" width="24" height="24" fill="#A3E635" rx="2"/>
        <text x="40" y="18" text-anchor="middle" font-family="Montserrat, -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif" font-weight="900" font-size="16" fill="#000000">U</text>
        <rect x="0" y="28" width="24" height="24" fill="#A3E635" rx="2"/>
        <text x="12" y="46" text-anchor="middle" font-family="Montserrat, -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif" font-weight="900" font-size="16" fill="#000000">X</text>
        <rect x="28" y="28" width="24" height="24" fill="#A3E635" rx="2"/>
        <text x="40" y="46" text-anchor="middle" font-family="Montserrat, -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif" font-weight="900" font-size="16" fill="#000000">O</text>
      </g>

      <!-- Text container positioned to the right of logo, vertically centered -->
      <g transform="translate(70, 70)">
        <!-- Data Labs Text -->
        <text x="0" y="-10" dominant-baseline="middle" font-family="'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif" font-size="28" font-weight="800" fill="#FFFFFF" letter-spacing="-0.02em">Data Labs</text>

        <!-- Look Beyond Data Tagline -->
        <text x="0" y="15" dominant-baseline="middle" font-family="'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif" font-size="16" font-weight="600" font-style="italic" fill="#A3E635" letter-spacing="-0.01em">Look Beyond Data</text>
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
    small: 210,
    normal: 280,
    large: 420
  }
  return sizes[props.size] || sizes.normal
})

const computedHeight = computed(() => {
  const sizes = {
    small: 70,
    normal: 93,
    large: 140
  }
  return sizes[props.size] || sizes.normal
})
</script>

<style scoped>
.auxo-logo-container {
  display: inline-flex;
  align-items: center;
}

.auxo-logo-container svg {
  max-width: 100%;
  height: auto;
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
