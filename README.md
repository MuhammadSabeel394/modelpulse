# ModelPulse — AI Model Intelligence Tracker

> Bloomberg-style intelligence for the AI model lifecycle. ModelPulse ingests, classifies, and summarizes real-world updates about frontier AI models — launches, version upgrades, deprecations, access restrictions, and pricing changes — across major providers, all in one analyst-grade dashboard.

🔗 **Live Demo:** [Add your deployed link here once hosted]
📂 **Repository:** https://github.com/MuhammadSabeel394/modelpulse

---

## 📸 Screenshots

| Landing Page | Dashboard |
|---|---|
| ![Landing Page](./docs/screenshots/landing.png) | ![Dashboard](./docs/screenshots/dashboard.png) |

| Model Profile (Timeline) | Comparison View |
|---|---|
| ![Model Profile](./docs/screenshots/model-profile.png) | ![Comparison](./docs/screenshots/comparison.png) |

> *Add your own screenshots to `docs/screenshots/` and update the paths above — see [Adding Screenshots](#adding-screenshots) below.*

---

## ✨ What It Does

ModelPulse tracks the lifecycle of frontier AI models the way a financial terminal tracks markets:

- **Classifies events automatically** — Launch, Update, Deprecation, Restriction/Suspension, or Pricing Change — using an LLM-powered NLP service with a deterministic rule-based fallback
- **Summarizes raw articles** into concise, neutral 2–3 sentence summaries
- **Visualizes model history** with per-model timelines showing every event from launch to present status
- **Compares models side-by-side** across pricing, capabilities, and lifecycle status
- **Surfaces trends** via an analytics dashboard (release frequency, event-type distribution, average model lifespan)
- **Supports human-in-the-loop review** through a role-gated admin panel for correcting AI-generated classifications

## 🛠️ Tech Stack

**Frontend**
- React + TypeScript
- Vite
- Tailwind CSS
- Recharts (analytics charts)
- Lucide React (icons)

**Backend**
- Node.js + Express
- SQLite (local development) with a JSON-file fallback adapter
- Supabase / PostgreSQL-ready schema for production deployment

**AI / NLP**
- Google Gemini API for live classification and summarization
- Deterministic keyword-based fallback classifier (ensures the app runs even without an API key)

## 🧠 How the NLP Pipeline Works

1. Raw article/changelog text is passed to `classifyAndSummarize()`
2. If a `GEMINI_API_KEY` is configured, the service calls the Gemini API to extract structured data: event type, provider, model name, date, region affected, and a neutral summary
3. If no key is available (or the call fails), a rule-based keyword parser takes over — scanning for terms like *deprecate*, *restrict*, *pricing* — so the app degrades gracefully rather than breaking
4. Results are stored as structured events and rendered across the Dashboard, Model Profile, and Analytics views

See [`/methodology`](http://localhost:5173/#/methodology) in the running app for the full write-up, including evaluation approach and known limitations.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm
- A free [Google Gemini API key](https://aistudio.google.com/apikey) (optional — app works without it via the fallback classifier)

### Installation

```bash
# Clone the repository
git clone https://github.com/MuhammadSabeel394/modelpulse.git
cd modelpulse

# Install all dependencies (root, client, and server)
npm run install:all
```

### Environment Setup

Create a `.env` file inside the `server/` directory:

```bash
GEMINI_API_KEY=your_key_here
```

> Without a key, the app automatically falls back to the rule-based classifier — no setup required to run it.

### Running Locally

```bash
npm run dev
```

This starts both servers concurrently:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001

## 📁 Project Structure

```
modelpulse/
├── client/                 # React + TypeScript frontend
│   └── src/
│       ├── pages/          # Landing, Dashboard, ModelProfile, Comparison, Analytics, AdminPanel, Methodology
│       └── App.tsx         # Routing and layout shell
├── server/                 # Express backend
│   ├── nlp.js               # classifyAndSummarize() service
│   ├── db.js                 # Database adapter (SQLite/JSON)
│   └── server.js            # API endpoints
├── supabase/
│   └── schema.sql           # Production-ready PostgreSQL schema
└── docs/
    └── screenshots/         # README screenshots
```

## 🗺️ Roadmap

- [x] **Phase 1** — Project scaffold, database schema, seed data, landing page, dashboard with filters/search
- [x] **Phase 2** — NLP classification service, model profile timelines, comparison view
- [ ] **Phase 3** — Analytics dashboard, role-gated admin panel, live data ingestion
- [ ] **Phase 4** — Methodology documentation, classification accuracy evaluation, final polish

## 📄 Data Model

| Table | Description |
|---|---|
| `providers` | AI companies tracked (OpenAI, Anthropic, Google DeepMind, Meta, Mistral) |
| `models` | Individual models with release date and current lifecycle status |
| `events` | Lifecycle events per model — classified type, summary, source, impact score |

Full schema: [`supabase/schema.sql`](./supabase/schema.sql)

## 🤝 About This Project

This is a self-driven, full-stack AI/Data Science project built to demonstrate practical skills in data engineering, NLP, and product design — built independently as part of an ongoing portfolio for future internship and job applications.

## 📜 License

This project is open for learning and reference purposes. Feel free to fork and adapt it.

---

### Adding Screenshots

1. Take screenshots of your running app (Landing page, Dashboard, Model Profile, Comparison view)
2. Create a folder: `docs/screenshots/` inside your project
3. Save the images there as `landing.png`, `dashboard.png`, `model-profile.png`, `comparison.png`
4. Commit and push:
   ```bash
   git add docs/screenshots/
   git commit -m "Add README screenshots"
   git push
   ```
