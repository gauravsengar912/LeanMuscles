# SweatItOut ⚡

**AI-powered personal fitness PWA** — your trainer, dietician, and coach in one app.

---

## 🚀 Quick Start

### 1. Clone / download

```bash
git clone https://github.com/your-username/sweatitout.git
cd sweatitout
```

### 2. Configure credentials

```bash
cp config.example.js config.js
# Edit config.js and fill in your Supabase URL, anon key, and Cerebras API key
```

### 3. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Open **SQL Editor** → paste the contents of `supabase-setup.sql` → Run
3. (Optional) Add your Cerebras API key to the `app_config` table — uncomment the last INSERT in the SQL file

### 4. Serve locally

Any static file server works:

```bash
# Python
python3 -m http.server 8080

# Node
npx serve .

# VS Code Live Server extension also works great
```

Open `http://localhost:8080` in your browser.

---

## 📁 File Structure

```
sweatitout/
├── index.html          ← Entire app (single file, ~7800 lines)
├── manifest.json       ← PWA manifest
├── sw.js               ← Service worker (offline support)
├── icon-192.png        ← App icon 192×192
├── icon-512.png        ← App icon 512×512
├── config.example.js   ← Credential template (safe to commit)
├── config.js           ← YOUR credentials (⚠️ gitignored)
├── supabase-setup.sql  ← Full DB schema + RLS + storage setup
├── .gitignore
└── README.md
```

---

## 🛠 Tech Stack

| Layer       | Tech                          |
|-------------|-------------------------------|
| Frontend    | Vanilla HTML/CSS/JS (no build step) |
| Auth + DB   | [Supabase](https://supabase.com) |
| AI          | [Cerebras](https://cloud.cerebras.ai) (`gpt-oss-120b`) |
| Food Data   | Open Food Facts API + AI fallback |
| Export      | SheetJS (XLSX) |
| Fonts       | Barlow Condensed + Manrope (Google Fonts) |

---

## ✨ Features

- **AI Workout Plan** — 7-day personalised plan generated in seconds
- **AI Diet Plan** — training-day vs rest-day macros, 4 meals/day
- **Food Log** — search 3 sources, log meals, track macros vs budget
- **Biweekly Follow-up** — AI analyses progress and regenerates plan
- **BMI Tracker** — visual sliding marker
- **Water Tracker** — animated bottle, cup icons
- **12-Week Streak Heatmap** — GitHub-style consistency view
- **Rest Timer** — SVG ring countdown with presets
- **Progress Photos** — gallery with lightbox
- **Personal Records** — PR tracking per exercise
- **PWA** — installable, works offline (cached shell)

---

## 🔐 Security Notes

- `config.js` is gitignored — never commit real credentials
- Supabase Row Level Security (RLS) is enabled on all tables
- The Cerebras API key can be stored in Supabase `app_config` instead of `config.js` for extra security — the app fetches it after login
- `delete_my_account()` RPC uses `SECURITY DEFINER` to cascade-delete all user data

---

## 📱 Installing as PWA

- **iOS**: Safari → Share → "Add to Home Screen"
- **Android**: Chrome → menu → "Add to Home Screen" / "Install app"
- **Desktop Chrome/Edge**: Install icon in address bar

---

## 🗄 Supabase Tables

| Table              | Purpose                          |
|--------------------|----------------------------------|
| `profiles`         | Display name, avatar URL         |
| `user_data`        | Fitness plan, goals, metrics     |
| `food_logs`        | Daily meal entries               |
| `workout_logs`     | Completed workout entries        |
| `progress_photos`  | Uploaded progress photos         |
| `personal_records` | PR per exercise                  |
| `app_config`       | AI key + app-wide settings       |

---

## 📄 License

MIT — do whatever you want, just don't sell it without the sweat. 💪