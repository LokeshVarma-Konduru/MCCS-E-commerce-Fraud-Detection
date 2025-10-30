Design a FRONTEND-ONLY Admin Dashboard UI for a retail fraud-detection application. Do not connect to any backend; use mocked placeholder data and clear TODO notes where backend integration will happen later.

Context:
- The app already has Store Manager and Developer dashboards.
- The Admin Dashboard should combine key transactional insights from the Store Manager dashboard and ONLY the normal, report-style outputs from the Developer dashboard (exclude deep technical/dev-ops features). 
- Role-based login exists; visually indicate this page is restricted to admins (a simple frontend notice/gate is fine).

Goals:
1) Present a high-level overview for admins that merges:
   - Organization-wide transactional insights (from Store Manager view).
   - Report-generated analytics from the Developer dashboard (e.g., model performance summaries, error trends, drift snapshots) WITHOUT advanced technical tooling or system controls.

2) Include these UI sections, fed by placeholder data:
   - Header with title and short description.
   - KPI summary cards (Total Transactions, Flagged, Fraud Rate, Approval Rate) for Today / 7d / 30d.
   - Global Filters bar (date range, store/region, payment type, risk level) with local state only and callback stubs.
   - Transactions table (org-wide): Time, Store, Transaction ID, Amount, Payment Type, Risk Score, Status, Actions.
     * Include loading skeletons, empty state, and simple client-side pagination with mock rows.
   - Reports area (from Developer dashboard, simplified): small widgets/charts with non-technical summaries (e.g., “Model Accuracy (last 30d)”, “Flagging Rate Trend”, “Estimated Drift Level”, “Error Rate Trend”), all using dummy values.
   - Interactive Heatmap showing fraud density across Store × Time or Region × Day.
     * Accept rows, columns, and a values matrix.
     * Show tooltips and a simple min→max legend.
     * Provide a local toggle for time grain (Hour vs Day) and basic filter interop.

3) UX requirements:
   - Clean, responsive layout for desktop/tablet.
   - Consistent visual style with existing dashboards.
   - Clear placeholder states (skeletons, “—” values, mock charts).
   - Graceful “Admins only” message if a non-admin state is simulated.
   - Accessible labels, keyboard focus states, and adequate color contrast.

4) Interaction behavior (frontend only):
   - All data comes from local mocks; no network calls.
   - Expose lightweight callbacks (onFilterChange, onPaginate, onCellClick for heatmap, onViewTransaction) as stubs for future wiring.
   - Keep components presentation-focused and easy to swap when real data arrives.

5) Deliverables (conceptual, not code-specific):
   - A cohesive Admin Dashboard screen composed of the sections above, with placeholder data and TODO notes where backend connections will be added.
   - Brief inline documentation indicating what each section expects (e.g., “expects aggregated KPIs,” “expects heatmap matrix,” “expects report metrics”).
   - Acceptance criteria: all sections render with mock data; filters update local state; pagination is client-side; heatmap responds to hover and toggles; the page is responsive and accessible; and non-admin state shows an “Admins only” notice.

Emphasize that only report-style, non-technical features from the Developer dashboard are included; exclude deep technical controls, logs, or infrastructure views.
