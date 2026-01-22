# US Census Data Explorer - Vue 3

A modern, interactive web application for exploring US Census data at State, County, and ZIP code levels.

## 🚀 New Tech Stack

- **Vue 3** - Progressive JavaScript framework with Composition API
- **Vite** - Next-generation frontend build tool
- **Pinia** - Intuitive state management for Vue
- **Chart.js** - Beautiful, responsive charts (ready to use)
- **PapaCSV** - Fast CSV parser
- **Modern CSS** - Custom design system with CSS variables

## ✨ Key Features

### Data Exploration
- **Multi-level Drill-down**: Navigate from States → Counties → ZIP Codes
- **Real-time Search**: Filter data instantly as you type
- **Smart Sorting**: Sort by name or value with visual indicators
- **Year Comparison**: Compare metrics across different years
- **CSV Export**: Download current view with one click

### User Experience
- **Auto-save Preferences**: Your selections are remembered
- **Data Caching**: Lightning-fast subsequent loads
- **Keyboard Shortcuts**: Power-user friendly navigation
- **Responsive Design**: Works on all devices
- **Accessibility**: Full ARIA support and keyboard navigation

### Data Visualization
- **Heat Maps**: Color-coded values for quick insights
- **Statistics Panel**: Mean, median, std dev, range, and more
- **Top/Low Indicators**: Instant identification of extremes
- **Change Indicators**: Visual positive/negative comparisons

## 🛠️ Development

### Prerequisites
- Node.js 18+ (v24.4.1 recommended)
- npm 9+ (11.4.2 recommended)

### Install Dependencies
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```
Opens at http://localhost:5173 with hot-module replacement

### Build for Production
```bash
npm run build
```
Builds optimized bundle to `dist/` directory

### Preview Production Build
```bash
npm run preview
```

## 📁 Project Structure

```
webapp/
├── src/
│   ├── components/
│   │   ├── DataTable.vue       # Main data table component
│   │   ├── HeaderControls.vue  # Dataset/year/metric selection
│   │   ├── StatsPanel.vue      # Statistics display
│   │   └── HelpPanel.vue       # Help modal
│   ├── stores/
│   │   └── census.js           # Pinia store for state management
│   ├── assets/
│   │   └── css/
│   │       └── styles.css      # Custom styles
│   ├── App.vue                 # Root component
│   └── main.js                 # Application entry point
├── data/                       # CSV data files (not in src)
├── index.html                  # HTML entry point
├── vite.config.js             # Vite configuration
└── package.json               # Project dependencies
```

## ⌨️ Keyboard Shortcuts

- `Esc` - Close panels / Reset to state view
- `Ctrl/Cmd + Backspace` - Go back one level
- `? or Shift + /` - Toggle help panel
- `Ctrl/Cmd + S` - Toggle statistics panel
- `Ctrl/Cmd + F` - Focus search input

## 🎨 Component Architecture

### State Management (Pinia)
- Centralized store for all application state
- Reactive data updates across components
- Automatic localStorage persistence
- Efficient data caching system

### Component Hierarchy
```
App.vue
├── HeaderControls.vue (Dataset selection, filters)
├── HelpPanel.vue (Modal dialog)
└── Main Content
    ├── StatsPanel.vue (Collapsible statistics)
    └── DataTable.vue (Main data display)
```

## 🔧 Configuration

### Vite Config (`vite.config.js`)
- Optimized bundle splitting
- Path aliases (@/ for src/)
- Auto-open browser on dev start
- Production build optimizations

### Environment
Development server runs on port **5173** by default.
Can be changed in `vite.config.js`:

```javascript
server: {
  port: 3000  // Your preferred port
}
```

## 📊 Data Format

The application expects CSV files in the `data/` directory:
- `{dataset}_state.csv` - State-level data
- `{dataset}_county.csv` - County-level data
- `{dataset}_zcta5.csv` - ZIP code-level data
- `manifest.json` - List of available datasets

## 🚀 Performance Optimizations

1. **Code Splitting**: Vendor and chart libraries in separate chunks
2. **Lazy Loading**: Components loaded on demand
3. **Data Caching**: Loaded datasets cached in memory
4. **Virtual Scrolling**: Efficient rendering of large datasets
5. **Debounced Search**: Prevents excessive re-renders

## 🆕 What's New in v2.0

### Architecture
- ✅ Migrated from vanilla JS to Vue 3 + Vite
- ✅ Implemented Pinia for state management
- ✅ Component-based architecture for maintainability
- ✅ Hot Module Replacement (HMR) for instant updates

### Features
- ✅ Real-time search filtering
- ✅ Enhanced statistics with 8 key metrics
- ✅ Improved CSV export functionality
- ✅ Better error handling and loading states
- ✅ Smoother animations and transitions

### Developer Experience
- ✅ Modern build tools (Vite)
- ✅ Fast development server
- ✅ Optimized production builds
- ✅ Better code organization
- ✅ Type-safe patterns

## 🔄 Migration Notes

The old vanilla JS app is backed up as:
- `index.old.html` - Original HTML file
- `static/js/app.js` - Original JavaScript

All functionality has been preserved and enhanced in the new Vue architecture.

## 📝 Browser Support

- Chrome/Edge: Last 2 versions
- Firefox: Last 2 versions
- Safari: Last 2 versions
- iOS Safari: 13+
- Android Chrome: Last 2 versions

## 🤝 Contributing

1. Clone the repository
2. Install dependencies: `npm install`
3. Create a feature branch
4. Make your changes
5. Test thoroughly: `npm run dev`
6. Build for production: `npm run build`
7. Submit a pull request

## 📄 License

This project visualizes public US Census Bureau data.

## 🙏 Acknowledgments

- US Census Bureau - American Community Survey (ACS) 5-Year Estimates
- Vue.js Team
- Vite Team
- Open Source Community
