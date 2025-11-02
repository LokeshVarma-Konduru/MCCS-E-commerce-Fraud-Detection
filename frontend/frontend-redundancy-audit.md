# Frontend Redundancy Audit

## Authentication & Role Checks
- `src/App.jsx:51`, `src/App.jsx:87`, `src/App.jsx:125`, `src/App.jsx:180` each call `getUserInfo` to gate routes, while `src/components/Navbar.jsx:20` repeats the same fetch/redirect logic. Centralizing auth state in a context or hook would cut duplicate API calls and conditional branches.

## Developer Navigation & Layout
- The developer top-navigation markup is duplicated verbatim in `src/pages/Developer.jsx:422`, `src/pages/APIIntegration.jsx:254`, `src/pages/TransactionMonitoring.jsx:384`, and `src/pages/ModelPerformance.jsx:469`. Extracting a shared `DeveloperNav` (or layout wrapper) would keep menu changes in one place.

## Reporting & PDF Generation
- `src/components/Report.jsx:5` and `src/components/StoreManagerReport.jsx:5` both register identical Chart.js modules and define parallel chart configs.
- The html2canvas/jsPDF export workflow is copied line-for-line between `src/components/Report.jsx:117` and `src/components/StoreManagerReport.jsx:58`. A shared `usePdfExport` utility (or higher-order component) would remove hundreds of repeated lines.

## Styling Overlap
- `.status-badge` is defined twice in `src/styles/AdminPanel.css:203` and `src/styles/AdminPanel.css:774` with different color palettes, creating conflicting duplicates.

## Dependencies & Assets
- `frontend/package.json:14-32` lists several dependencies that have no references under `src` (`@tailwindcss/forms`, `@tremor/react`, `html2pdf.js`, `lucide-react`, `react-tabs`, `recharts`). Leaving them installed adds bundle size and maintenance surface.
- `src/assets/react.svg` is never imported; it can be removed or swapped in where appropriate.

## Data & Content Duplication
- Static fixtures in `src/data/dashboardData.js:1` and `src/data/apiData.js:1` are unused, while `src/pages/Developer.jsx:351` inlines comparable sample data. Consolidating sample datasets into one module would avoid drift.
- The `frontend/dist/` directory (e.g., `frontend/dist/index.html`) holds built assets alongside source, duplicating output that can be regenerated during deployment.

