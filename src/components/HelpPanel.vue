<template>
  <div class="help-panel show" @click.self="$emit('close')">
    <div class="help-content">
      <div class="help-header">
        <h2>How to Use</h2>
        <button class="btn-close-help" @click="$emit('close')">×</button>
      </div>
      <div class="help-body">
        <div class="help-section">
          <h3>📊 Getting Started</h3>
          <ol>
            <li><strong>Select Dataset:</strong> Choose a dataset from the dropdown (e.g., Population, Income, Housing)</li>
            <li><strong>Select Year:</strong> Choose the year you want to analyze</li>
            <li><strong>Select Metric:</strong> Choose the specific metric to view</li>
            <li><strong>View Data:</strong> The table automatically loads and displays the data</li>
          </ol>
        </div>
        <div class="help-section">
          <h3>🔍 Exploring Data</h3>
          <ul>
            <li><strong>Drill Down:</strong> Click on any table row to drill down to the next level (State → County → ZIP Code)</li>
            <li><strong>Sort:</strong> Click "Sort by Name" or "Sort by Value" buttons to reorder the table</li>
            <li><strong>Search:</strong> Use the search box to quickly filter and find specific locations</li>
            <li><strong>Compare Years:</strong> Select a comparison year to see changes over time</li>
            <li><strong>Export:</strong> Click the "Export CSV" button to download current view</li>
          </ul>
        </div>
        <div class="help-section">
          <h3>📈 Understanding the Display</h3>
          <ul>
            <li><strong>Heat Map Colors:</strong> Value cells are color-coded - darker green indicates higher values</li>
            <li><strong>Top/Low Indicators:</strong> Highest and lowest values are highlighted with special badges</li>
            <li><strong>Statistics Panel:</strong> View comprehensive statistics (count, average, median, etc.)</li>
            <li><strong>Change Indicators:</strong> Green for positive changes, red for negative changes</li>
          </ul>
        </div>
        <div class="help-section">
          <h3>⌨️ Keyboard Shortcuts</h3>
          <ul>
            <li><strong>Esc:</strong> Close panels / Reset to state view</li>
            <li><strong>Ctrl/Cmd + Backspace:</strong> Go back one level</li>
            <li><strong>? or Shift + /:</strong> Toggle this help panel</li>
            <li><strong>Ctrl/Cmd + S:</strong> Toggle statistics panel</li>
            <li><strong>Ctrl/Cmd + F:</strong> Focus search input</li>
          </ul>
        </div>
        <div class="help-section">
          <h3>💾 Features</h3>
          <ul>
            <li><strong>Auto-save:</strong> Your selections are automatically saved and restored on next visit</li>
            <li><strong>Data Caching:</strong> Previously loaded datasets are cached for instant access</li>
            <li><strong>Real-time Search:</strong> Filter data as you type in the search box</li>
            <li><strong>Responsive Design:</strong> Works seamlessly on desktop, tablet, and mobile</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineEmits(['close'])
</script>
