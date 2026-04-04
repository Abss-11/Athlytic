# Athlytic

Athlytic is a modern performance tracking platform for athletes and coaches. It combines training, nutrition, running performance, goals, community, and coach oversight in a responsive React dashboard with a Node/Express API and Mongo-ready schemas.

## Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS, Chart.js
- Backend: Node.js, Express
- Database: MongoDB with Mongoose models
- Auth: JWT
- UX: route-level code splitting, inline validation, toast feedback

## Product Areas

- Athlete dashboard
- Coach portal
- Nutrition tracking
- Workout logging
- Running performance tracking
- Goal tracking
- Community feed
- Profile management
- Landing, login, and signup flows

## Project Structure

```text
Athlytic/
  README.md
  frontend/
    src/
      api/
      components/
      context/
      data/
      lib/
      pages/
  backend/
    src/
      config/
      data/
      middleware/
      models/
      routes/
      utils/
```

## Local Setup

### 1. Backend

```bash
cd /Users/abhaychaturvedi/Desktop/Athlytic/backend
cp .env.example .env
npm install
npm run start
```

Notes:

- If `MONGODB_URI` is not set, the API starts with seeded in-memory demo data.
- If `MONGODB_URI` is set, auth and tracker reads/writes use MongoDB collections.
- The app keeps the seeded fallback path so the platform still runs locally without a database.

### 2. Frontend

```bash
cd /Users/abhaychaturvedi/Desktop/Athlytic/frontend
cp .env.example .env
npm install
npm run dev
```

Frontend now connects to the backend through Vite proxy by default.

- Browser requests use `/api`
- Vite proxies `/api` to `http://127.0.0.1:5000`
- Override with `VITE_API_URL` if you want a different backend host

You can also run commands from the project root:

```bash
cd /Users/abhaychaturvedi/Desktop/Athlytic
npm run dev:backend
npm run dev:frontend
```

## One Website Mode

If you want Athlytic to run as a single website from one server:

```bash
cd /Users/abhaychaturvedi/Desktop/Athlytic
npm run build:full
npm run start
```

Then open:

```bash
http://127.0.0.1:5000
```

In this mode:

- Express serves the built frontend
- React routes like `/dashboard` work from the same domain
- API routes stay available under `/api/*`

## Demo Credentials

- Athlete: `demo@athlytic.app` / `password123`
- Coach: `coach@athlytic.app` / `password123`

## Important Ports

- Backend API: `http://127.0.0.1:5000`
- Frontend Vite app: usually `http://localhost:5173`

If you open `http://localhost:5001`, that is neither the current backend port nor the default Vite port for this project.

## Main API Routes

- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/dashboard/athlete`
- `GET /api/dashboard/coach`
- `GET/POST /api/nutrition`
- `GET/POST /api/workouts`
- `GET/POST /api/running`
- `GET/POST /api/goals`
- `GET/POST /api/community`

## Important Files

- Frontend app entry: `/Users/abhaychaturvedi/Desktop/Athlytic/frontend/src/App.tsx`
- App shell: `/Users/abhaychaturvedi/Desktop/Athlytic/frontend/src/components/layout/AppShell.tsx`
- Theme system: `/Users/abhaychaturvedi/Desktop/Athlytic/frontend/src/context/ThemeContext.tsx`
- Auth state: `/Users/abhaychaturvedi/Desktop/Athlytic/frontend/src/context/AuthContext.tsx`
- Mock dashboard data: `/Users/abhaychaturvedi/Desktop/Athlytic/frontend/src/data/mockData.ts`
- API entry: `/Users/abhaychaturvedi/Desktop/Athlytic/backend/server.js`
- Express app: `/Users/abhaychaturvedi/Desktop/Athlytic/backend/src/app.js`
- Seed data: `/Users/abhaychaturvedi/Desktop/Athlytic/backend/src/data/sampleData.js`
- Auth routes: `/Users/abhaychaturvedi/Desktop/Athlytic/backend/src/routes/authRoutes.js`
- Dashboard routes: `/Users/abhaychaturvedi/Desktop/Athlytic/backend/src/routes/dashboardRoutes.js`
- Mongo models: `/Users/abhaychaturvedi/Desktop/Athlytic/backend/src/models`

## Verification

- Frontend build: `npm run build`
- Backend syntax check: `npm run check`

## Recent Improvements

- Route-level lazy loading to reduce the main frontend bundle
- JWT session persistence in local storage
- Inline validation for auth and tracker forms
- Toast feedback for login, signup, and tracker actions
- Mongo-backed persistence for auth, workouts, nutrition, running, goals, and community when a database is connected

## Next Good Steps

- Add refresh token flow and password hashing policies
- Add role-based route guards on the frontend
- Add test coverage for auth and tracking flows
