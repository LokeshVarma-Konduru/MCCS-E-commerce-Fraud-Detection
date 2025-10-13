# Repository Guidelines

## Project Structure & Module Organization
- `backend/` houses the Express API; follow the feature-based folders (`controllers/`, `routes/`, `models/`, `utils/`) and keep Jest specs under `tests/`. Load configuration from `.env` (never commit secrets).
- `frontend/` contains the Vite + React dashboard. Place shared UI in `src/components/`, state logic in `src/hooks/`, and static assets in `public/`. Build artifacts land in `dist/`.
- `ML-Models/` stores the data science assets: notebooks for experimentation, `pbl_group1_preprocessing.py` for batch prep, and `ML_Server/predict_service.py` for the Flask inference microservice.

## Build, Test, and Development Commands
```sh
# backend
cd backend && npm install
npm run start    # launches API with nodemon
npm test         # runs Jest with mongodb-memory-server

# frontend
cd frontend && npm install
npm run dev      # Vite dev server on http://localhost:5173
npm run build    # production bundle to dist/
npm run lint     # ESLint per eslint.config.js

# ml service
cd ML-Models && pip install -r requirements.txt
python ML_Server/predict_service.py  # starts Flask predictor on :5000
```

## Coding Style & Naming Conventions
- Use ES modules with double quotes and 2-space indentation across Node and React code. Prefer descriptive, camelCase filenames (e.g., `authController.js`, `useFraudMetrics.tsx`).
- Keep controllers slim and delegate to `utils/` helpers; return JSON with consistent status codes.
- Frontend components follow PascalCase; colocate CSS-in-JS or Tailwind classes within the component file. Run `npm run lint` before pushing.

## Testing Guidelines
- Backend unit and integration tests live in `backend/tests/*.test.js`; name files `<feature>.test.js` and mock external services via the existing `testUtils.js` helpers.
- Ensure new APIs ship with Jest coverage that exercises happy path and failure responses. Use `npm test -- --watch` during development for quicker iteration.

## Commit & Pull Request Guidelines
- Follow concise, imperative-style commit titles (~50 chars). Existing history (`Delete .DS_Store`, `Theme_design_changes`) shows single-scope commits—keep that discipline.
- For PRs, include: purpose summary, linked issue or ticket, test evidence (`npm test`, `npm run lint` output), and screenshots/GIFs for UI changes. Request review from a backend + frontend owner when the change spans both services.

## Security & Configuration Tips
- Keep `.env` values local; use `.env.example` copies when onboarding new contributors.
- Regenerate API keys and JWT secrets if they leak, and never embed credentials inside notebooks—reference environment variables instead.
