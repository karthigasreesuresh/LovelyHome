# LovelyHome — AI-Powered Elderly Wellness & Safety Companion

LovelyHome is a full-stack assistive technology platform for elderly wellness monitoring, medication adherence tracking, client-side prescription OCR, and real-time emergency safety response.

This repository contains the full monorepo foundation built with **React**, **Vite**, **TypeScript**, **Tailwind CSS**, **Express**, **Prisma**, **SQLite**, **Tesseract.js**, and **Recharts**.

---

## 🚀 Key Features

1. **Elder Assistive Interface (`/elder`)**
   - High-contrast, large-button assistive design (`🎙️ Daily Check-in`, `💊 My Medicines`, `🚨 SOS Emergency`).
   - Dynamic time-appropriate greeting (*"Good Morning, Lakshmi"*) and non-clinical status indicator (`🟢 No new safety concerns`, `🟡 Some attention may be needed`, `🔴 Urgent help signal detected`).
2. **Interactive Check-In & Concern Analysis (`/elder/checkin`)**
   - Voice speech-to-text recognition with instant text fallback.
   - Local rule-based concern keyword analyzer (`NORMAL`, `ATTENTION`, `URGENT`) without external diagnostic claims.
3. **Prescription OCR & Medication Timetable (`/guardian/prescriptions`)**
   - In-browser client-side OCR engine using **Tesseract.js** (supports PNG, JPG, JPEG, WEBP).
   - Candidate fields extraction (Medicine Name, Dosage, Frequency, Schedule Time, Instructions) with mandatory guardian confirmation before saving.
4. **Medication Schedule & Adherence Logging (`/guardian/medicines`)**
   - Scheduled medication reminders and structured adherence history logs (`Reminder Acknowledged`, `Pending`, `Missed`).
5. **Real-time Safety Alert & Emergency SOS (`/guardian/alerts` & `/elder/sos`)**
   - Browser geolocation tracking with location-unavailable fallback (`locationUnavailable: true`).
   - High-priority `CRITICAL SOS` alerts with 5-second live guardian dashboard polling and 1-click status resolution.
6. **Polished Guardian Dashboard & Wellness History (`/guardian`)**
   - DB-driven real-time metric cards (Today's Check-in, Medicine Adherence, Recent Activity, Unresolved Alerts, Recent SOS).
   - **Recharts** wellness activity trend visualizer labeled strictly as non-diagnostic caregiver awareness.
7. **Progressive Web App (PWA) Capabilities**
   - Web App Manifest (`manifest.json`), service worker static asset caching (`sw.js`), and strict network-only API boundary.
8. **Interactive Simulation Demo Portal (`/demo`)**
   - Evaluator portal providing 5 real-database simulation scenarios (`Normal Check-in`, `Attention Check-in`, `Missed Medicine`, `Missed Check-in`, `Demo Emergency SOS`) and safe 1-click demo data reset (`POST /api/demo/reset`).

---

## 🏗️ Architecture Overview

```text
LovelyHome_Kalam Awards/
├── package.json               # Monorepo root workspace runner
├── .env.example               # Shared environment variables template
├── README.md                  # Project documentation
├── server/                    # Express + TypeScript REST API Server
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env                   # Server environment variables (PORT, DATABASE_URL, JWT_SECRET)
│   ├── prisma/
│   │   ├── schema.prisma      # Prisma SQLite schema definition
│   │   ├── seed.ts            # Seed data script for demo mode
│   │   └── dev.db             # SQLite local database
│   └── src/
│       ├── index.ts           # Express server entry point
│       ├── config/            # Server configuration
│       ├── middleware/        # Auth & role security middlewares
│       ├── controllers/       # REST API controllers
│       ├── routes/            # Express endpoint definitions
│       └── utils/             # Prisma client, JWT, bcrypt helpers
└── client/                    # React + Vite + TypeScript Frontend
    ├── package.json
    ├── vite.config.ts
    ├── index.html
    ├── public/
    │   ├── manifest.json      # PWA Web App Manifest
    │   ├── sw.js              # PWA Service Worker script
    │   └── pwa-icon-*.svg     # App icons
    └── src/
        ├── App.tsx            # App router & protected layout wrappers
        ├── main.tsx           # React DOM root & SW registration
        ├── components/        # UI component library (Navbar, Sidebar, Modal, Card, Button, Badge, Loading, Alert)
        ├── pages/             # Portal pages (Guardian, Elder, Auth, Demo Evaluator)
        ├── services/          # Axios HTTP API client & error interceptors
        └── context/           # Authentication state context
```

---

## 📦 Tech Stack

- **Frontend**: React 18, TypeScript, Vite 5, Tailwind CSS, Lucide Icons, Recharts, Tesseract.js
- **Backend**: Node.js, Express, TypeScript, Prisma ORM, SQLite Database
- **Authentication**: JWT Tokens, Bcrypt password hashing
- **PWA**: Service Worker static caching, Web Manifest, Standalone display

---

## 🛠️ Quick Setup & Execution

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### 2. Environment Variables Setup
Create `.env` in `server/`:
```env
PORT=5000
DATABASE_URL="file:./dev.db"
JWT_SECRET="lovelyhome_award_mvp_jwt_secret_2026"
```

Create `.env` in `client/`:
```env
VITE_API_URL="http://localhost:5000/api"
```

### 3. Installation & Database Setup

```bash
# Install dependencies across monorepo workspace
npm run install:all

# Setup database (Generate Prisma client, apply migrations, seed initial data)
npm run db:setup
```

### 4. Running Development Mode

```bash
npm run dev
```

- **Frontend Client**: [http://localhost:5173](http://localhost:5173)
- **Backend Server API**: [http://localhost:5000/api](http://localhost:5000/api)

---

## 🔑 Demo Quick-Fill Credentials

The database comes pre-seeded with baseline demo accounts:

| Role | Email | Password | Access & Purpose |
| :--- | :--- | :--- | :--- |
| **Guardian** | `guardian@lovelyhome.demo` | `Demo@123` | Guardian Portal (`/guardian`) — Telemetry, Alerts, SOS, Prescriptions, History |
| **Elder** | `lakshmi@lovelyhome.demo` | `Demo@123` | Elder Interface (`/elder`) — Accessible assistive UI for Lakshmi (Age 72) |

---

## 🔌 Core REST API Endpoints

- `POST /api/auth/login` — Authenticate user & return JWT token
- `POST /api/auth/register` — Register new user account
- `GET /api/auth/me` — Fetch authenticated user profile
- `GET /api/dashboard/:elderId` — Guardian dashboard telemetry & status calculation
- `GET /api/dashboard/elder` — Elder interface home screen payload
- `GET /api/checkins` & `POST /api/checkins` — Daily wellness check-in logging & analysis
- `GET /api/medicines/:elderId` & `POST /api/medicines` — Medication schedules
- `PUT /api/medicines/logs/:logId/acknowledge` — Acknowledge medication reminder
- `GET /api/alerts` & `POST /api/alerts/:id/resolve` — Safety alerts feed & resolution
- `POST /api/sos/trigger` & `POST /api/sos/resolve` — Emergency panic SOS & status resolution
- `POST /api/demo/simulate` — Execute simulated database scenario (`NORMAL`, `ATTENTION`, `MISSED_MEDICINE`, `MISSED_CHECKIN`, `DEMO_SOS`)
- `POST /api/demo/reset` — Safe reset deleting `[DEMO SIMULATION]` records while preserving baseline data

---

## ⚠️ Non-Clinical Safety & Medical Disclaimer

> **LovelyHome is a wellness and safety support tool. It does not diagnose medical conditions, prescribe medicines, or replace professional medical care. For emergencies, contact appropriate emergency or healthcare services.**

---

## 📋 Known Limitations & Future Roadmap

- **Known Limitations**:
  - Voice recognition relies on browser Web Speech API support (Chrome/Edge recommended; text fallback provided).
  - Client-side Tesseract.js OCR processing time varies depending on image resolution and host device CPU performance.
- **Future Roadmap**:
  - WebRTC video call integration for guardian-elder check-ins.
  - Integration with IoT wearable fall-detection sensors.
  - Multi-language voice synthesis support (Tamil, Hindi).
