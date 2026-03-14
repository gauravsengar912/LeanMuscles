# ⚡ FitAI — AI-Powered Fitness & Nutrition PWA

A premium glassmorphic fitness app with AI-powered workout & diet plan generation, food logging, gamification, and social features. Deploy on GitHub Pages or Cloudflare Pages with Supabase backend.

## 🚀 Features

- 🤖 **AI Plans** — Cerebras-powered workout + Indian diet plan generation
- 🏋️ **Workout Tracker** — Day-by-day plans, rest timer, exercise substitutions, video embeds
- 🥗 **Diet Plans** — 7-day Indian cuisine, carb periodisation, meal logging
- 🍛 **Food Log** — 50+ Indian foods DB + OpenFoodFacts + AI estimates, macro tracking
- 💧 **Water Tracker** — Hydration goal from body weight
- 👤 **Profile** — Streak heatmap, personal records, workout stories (24h), friends, leaderboard
- 🔐 **Auth** — Supabase email/password, session persistence
- 📊 **Export** — Food log & diet plan to Excel (.xlsx)
- 📱 **PWA** — Installable, offline app shell, service worker

---

## 🛠️ Setup

### 1. Supabase Setup

1. Go to [supabase.com](https://supabase.com) → New Project
2. Go to **SQL Editor** → paste contents of `schema.sql` → Run
3. Go to **Storage** → Create buckets:
   - `avatars` (Public)
   - `workout-stories` (Public)
4. Get your **Project URL** and **anon key** from Settings → API

### 2. Cerebras AI Key

1. Sign up at [cloud.cerebras.ai](https://cloud.cerebras.ai)
2. Generate an API key

### 3. YouTube API (optional, for exercise videos)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Enable **YouTube Data API v3**
3. Create credentials → API Key

### 4. Configure the App

Edit `js/config.js`:

```js
const CONFIG = {
  SUPABASE_URL: 'https://YOUR_PROJECT_ID.supabase.co',
  SUPABASE_ANON_KEY: 'YOUR_ANON_KEY',
  CEREBRAS_API_KEY: 'YOUR_CEREBRAS_KEY',
  YOUTUBE_API_KEY: 'YOUR_YOUTUBE_KEY', // optional
};
```

### 5. Deploy

#### GitHub Pages
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/fitai.git
git push -u origin main
# Enable Pages in repo Settings → Pages → main branch
```

#### Cloudflare Pages
```bash
# Connect GitHub repo in Cloudflare Dashboard → Pages
# Build command: (leave empty - static site)
# Output directory: /
```

---

## 📂 Project Structure

```
fitai/
├── index.html          # Main app shell
├── manifest.json       # PWA manifest
├── sw.js               # Service worker (offline)
├── schema.sql          # Supabase database schema
├── css/
│   ├── main.css        # Design system + layout
│   ├── components.css  # Reusable components
│   └── animations.css  # Premium animations
├── js/
│   ├── config.js       # 🔑 YOUR KEYS GO HERE
│   ├── supabase.js     # DB operations
│   ├── state.js        # App state + helpers
│   ├── ui.js           # UI utilities, tabs, toasts
│   ├── particles.js    # Canvas particle system
│   ├── auth.js         # Authentication
│   ├── onboarding.js   # 4-step onboarding
│   ├── ai.js           # Cerebras AI integration
│   ├── workout.js      # Workout tab + rest timer
│   ├── diet.js         # Diet tab + meal logging
│   ├── foodlog.js      # Food log + search + water
│   ├── profile.js      # Profile, PRs, friends, stories
│   ├── home.js         # Home dashboard
│   └── app.js          # Bootstrap + service worker
└── icons/
    ├── icon-192.png
    └── icon-512.png
```

---

## 🎨 Design System

- **Font**: Clash Display (headings) + Satoshi (body) + JetBrains Mono (numbers)
- **Theme**: Deep black glassmorphism with purple/pink/teal accents
- **Animations**: Spring physics, count-up, stagger reveal, particle canvas
- **Colors**: `--accent-primary: #6c63ff`, `--accent-secondary: #ff6584`, `--accent-green: #43d9ad`

---

## 🗄️ Database Tables

| Table | Description |
|-------|-------------|
| `profiles` | User profile, stats, gamification |
| `plans` | AI-generated workout & diet plans (JSONB) |
| `food_logs` | Daily food entries by meal slot |
| `workout_logs` | Completed workout sessions |
| `personal_records` | User PRs (exercise, weight, reps) |
| `friendships` | Friend connections + requests |
| `workout_stories` | 24h workout photo stories |
| `meal_templates` | Saved meal template presets |

---

## ⚠️ Notes

- Cerebras API doesn't support CORS on client-side for some plans. If issues arise, proxy through a Cloudflare Worker or Vercel Edge Function.
- For production, consider adding a serverless function to keep your API keys server-side.
- The `delete_user_data` RPC deletes app data but auth user deletion requires Supabase Admin API.

---

## 📄 License

MIT — Free to use, modify, and deploy.
