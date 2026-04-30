# ⚽ FUTOLOGY — THE PROJECT BIBLE
### The Definitive Football Intelligence Platform · Built with Claude Code · Dark Mode Only

> **Mission:** Build the most ambitious, complete, beautifully-engineered football intelligence platform ever made by a solo developer. Every feature works. Every pixel is intentional. Zero placeholders. Zero "TODO later." Production-grade from line one.

> **Tagline:** *Every Goal. Every Emotion. Every Insight.*

---

## 🎯 THE MASTER PROMPT (PASTE THIS INTO CLAUDE CODE TO START)

```
You are a senior staff engineer building FUTOLOGY — a complete football intelligence
platform. This is the project of my life. Quality bar: production-grade.

BEFORE WRITING A SINGLE LINE OF CODE:
1. Read PROJECT_BIBLE.md from top to bottom — every single section, no skimming.
2. Read ARCHITECTURE.md, DESIGN_SYSTEM.md, and DATABASE.md if they exist.
3. List exactly what you understand the project to be in 5 bullets.
4. Confirm the current Phase from PROJECT_BIBLE.md and ask me to confirm before
   building anything.

NON-NEGOTIABLE RULES:
- DARK MODE ONLY. There is no light mode. No theme toggle. Ever.
  Background #0A0A0A · Surface #111111 · Accent #00D563 · Premium #FFD700.
- Every feature in the bible must actually function. No mocked UI without a real
  backend. No "this would call the API" comments — wire it up.
- Mobile-first. Test every page at 375px before considering it done.
- TypeScript strict mode on everything. No `any`. No `@ts-ignore`.
- No API keys ever leak to the client — proxy every external call through Next.js
  API routes that read keys from env on the server.
- Skeleton loaders on every data-fetching state. Empty states designed, not blank.
- Accessibility: keyboard nav works, focus rings visible, ARIA where it matters,
  contrast ratios pass WCAG AA.
- Every commit message follows conventional commits (feat:, fix:, chore:, etc.).

WORKING METHOD:
- Build in the phases defined in PROJECT_BIBLE.md, in order.
- After each Phase: run lint, typecheck, build, and a smoke-test of every new
  page/route. Fix everything red before moving on.
- When I say "next phase", do not ask 14 clarifying questions — you have the
  bible. Read it again, then build.
- When something in the bible is genuinely ambiguous, ask ONE focused question.
  Otherwise proceed and document the decision in DECISIONS.md.

START: Read PROJECT_BIBLE.md now. Then summarize your understanding and confirm
we're starting Phase 0.
```

---

## 📖 TABLE OF CONTENTS

1. [What We're Building](#1-what-were-building)
2. [Complete Feature Set](#2-complete-feature-set)
3. [Tech Stack](#3-tech-stack)
4. [Design System (Dark Mode Only)](#4-design-system-dark-mode-only)
5. [File Structure](#5-file-structure)
6. [Database Schema](#6-database-schema)
7. [Environment Variables](#7-environment-variables)
8. [Data Sources & APIs](#8-data-sources--apis)
9. [ML Models & Pipelines](#9-ml-models--pipelines)
10. [API Routes Reference](#10-api-routes-reference)
11. [Phased Build Plan](#11-phased-build-plan)
12. [Quality Bar & Definition of Done](#12-quality-bar--definition-of-done)
13. [Deployment](#13-deployment)
14. [Anti-Patterns (Never Do These)](#14-anti-patterns-never-do-these)

---

## 1. WHAT WE'RE BUILDING

**FUTOLOGY** is one unified web platform — one URL, one login, one cohesive experience — that fuses every great football product idea into a single home:

A personalized hub where you follow the leagues, clubs and players you love, see live scores update in real time, get ML-powered match predictions explained in human language, dive into player playing-style clusters, watch live community sentiment swing during matches, compete in prediction leagues, study tactical breakdowns with xG maps and pass networks, predict transfer values, and optimize fantasy squads — all wrapped in a single sleek dark interface that feels like a broadcast studio designed by Apple.

**Three-line elevator pitch:**
- It's your personalized football feed (scores, news, fixtures, transfers).
- It's a data scientist's playground (match prediction, player clustering, sentiment, tactics, transfer values, fantasy optimization).
- It's a community (prediction leagues, polls, leaderboards) — all in one app.

---

## 2. COMPLETE FEATURE SET

Every feature below must be built and functioning. Nothing is "nice to have." This is the spec.

### 2.1 Core Platform Features

**Authentication & Onboarding**
- Email OTP login (passwordless via Supabase Auth + Resend)
- 3-step onboarding wizard: choose leagues → pick clubs → follow players & tournaments
- Profile auto-created on signup, redirect logic for new vs returning users
- Confetti success animation on onboarding completion

**Personalized Home Feed**
- Live Now horizontal scroll strip (auto-refreshes every 30s)
- Two-column layout (desktop): main feed (news/transfers/analysis tabs) + sidebar (upcoming for you, quick standings)
- "AI Prediction of the Day" sidebar card
- Infinite scroll for news
- Personalized to user's followed leagues/clubs/players

**Live Scores & Fixtures**
- 5-day-back / 7-day-ahead horizontal date selector
- Filter tabs: All / Live / Finished / Scheduled
- Matches grouped by league with section headers
- Live matches auto-poll every 30 seconds
- Live indicator: pulsing red dot animation

**Match Detail Sheet** (slide-up on mobile, side-sheet on desktop)
- Tab 1 — Overview: scoreline, venue, referee, attendance, goalscorers
- Tab 2 — Stats: bidirectional bar charts (possession, shots, xG, corners, fouls, cards)
- Tab 3 — Lineups: SVG football pitch with players plotted by formation, subs below
- Tab 4 — Events: timeline (goals, cards, subs) with minute badges
- Tab 5 — H2H: last 5 meetings + win/draw/loss summary

**Clubs**
- Followed clubs grid with form indicators
- Club detail page: 6 tabs (Overview, Squad, Fixtures, Results, Transfers, Stats)
- Form chart (Recharts), recent transfers, position badges

**Leagues**
- Followed leagues grid
- League detail page: full standings table with European spots / relegation color bands, position change arrows, top scorers, top assists, upcoming fixtures
- Season selector dropdown

**Tournaments**
- Major tournaments view (UCL, Europa, World Cup, Euros, Copa America, AFCON, Asian Cup, FA Cup, Copa del Rey, etc.)
- Filter: Ongoing / Upcoming / Completed
- Bracket / group standings view

**Players**
- Player detail page with photo, stats, form, transfer history
- Followed players quick-access in profile

**Global Search (Cmd+K)**
- Full-screen overlay, keyboard navigable (↑↓ arrows, Enter, Esc)
- Tabs: All / Teams / Players / Leagues
- Recent searches stored in localStorage (max 5)
- 300ms debounced

**Notifications**
- Bell icon with unread count badge
- Popover with last 10 notifications
- Supabase Realtime subscription for live updates
- Mark all as read, individual mark as read
- Empty state: "You're all caught up! 🎉"

**Profile & Settings**
- Editable: avatar (uploaded to Supabase Storage), display name, username, bio, country
- Stats row: total predictions, accuracy %, leagues joined, clubs/players followed
- Followed items management (4 tabs: Leagues / Clubs / Players / Tournaments)
- Notification preferences toggles
- Sign out, delete account (with confirmation)

### 2.2 Intelligence Features (The Magic)

**Intelligence Hub Landing Page**
- 6 feature cards leading to sub-pages: Match Predictor, Player Pulse, Sentiment Storm, TacticBoard, Transfer Oracle, Fantasy IQ
- Quick Match Prediction widget on the page itself
- Model performance section (accuracy chart, confusion matrix, last-trained date)

**Match Predictor (ML)**
- Predict Any Match section: two team search inputs + competition selector + Generate button
- Animated football loader during prediction
- Results: animated win-probability bars (home/draw/away), predicted score, confidence badge, form comparison, H2H record, key factors (SHAP explanations in plain English)
- Upcoming Predictions for Your Teams: next 7 days fixtures with ML predictions, sorted by confidence
- Model Insights section: feature importance bar chart + precision/recall table
- "Use this prediction" button copies ML suggestion into user's prediction form
- "Save this prediction" adds to user's predictions tab

**Player Pulse / Player Intelligence Dashboard**
- Playing Style Clusters scatter plot (Recharts/Plotly): X = Creative Output, Y = Defensive Activity, dot size = minutes played, color = cluster, hover tooltip with player name + cluster + top 3 stats
- 6 named clusters: Target Striker, Creative Playmaker, Box-to-Box Midfielder, Ball-Playing Defender, High Press Forward, Deep-Lying Playmaker (each with color, description, defining stats)
- Player Comparison: two search inputs → side-by-side radar chart (Goals, Assists, Creativity, Pressing, Defending, Passing) + cluster badges + "Similar players" top 3
- Team Style Analysis: bar chart of cluster distribution within a team + balance score insight
- Click any dot in the cluster chart → opens player detail sidebar

**Sentiment Storm / Live Match Sentiment Tracker**
- Match selector showing live matches (countdown to next live if none)
- Sentiment Timeline (Recharts AreaChart): X = match minutes 0-90, two area lines (home/away color), Y = sentiment -1 to +1, vertical dashed lines at goal events with ⚽ tooltips
- Live Sentiment Gauges (circular) for both teams with color (green positive, red negative, yellow neutral)
- Excitement Meter: horizontal bar showing how heated the discussion is
- Live Feed: last 5 community reactions with green/red background, slide-in animation on new ones
- Community Reaction Cards for major events: "Reaction to [Player] goal — Minute 35" with before/after sentiment comparison
- Post-match replay mode with scrubber to replay sentiment at any minute
- Stats summary: peak tweet/comment volume moment, biggest sentiment swing, most-mentioned player
- Data source: Reddit API (free) for r/soccer, r/PremierLeague, r/LaLiga, r/bundesliga match threads — Twitter optional via env flag
- Updates every 60 seconds while a match is selected and live

**TacticBoard** (uses StatsBomb open data)
- Football pitch SVG (accurate dimensions, dark green, white lines)
- xG Shot Map: every shot plotted, circle size = xG value, color = scored (gold) / missed (red) / saved (grey)
- Pass Network overlay: nodes at average player positions, edge thickness = pass frequency
- Player Heatmap: click player → opacity-grid heatmap of touches
- Team Stats sidebar: xG, PPDA (passes per defensive action — pressing intensity), possession %, shots on target, pass accuracy, field tilt %, final third entries

**Transfer Oracle**
- ML model predicting player market value (XGBoost Regressor on log-transformed target)
- Inputs: player stats (age, position, nationality, goals/90, assists/90, xG/90, xA/90, league level, club reputation, minutes, contract years left, recent form, national team caps)
- Outputs: predicted value (with low/high confidence interval), SHAP explanations in plain English ("Age bonus +€12M, Goals per 90 +€8M"), comparable players list
- Compare to Transfermarkt actual value to highlight under/overvalued players

**Fantasy IQ**
- Fantasy team optimizer using Linear Programming (PuLP / scipy.optimize)
- Constraints: £100M budget, 15 players (2 GK / 5 DEF / 5 MID / 3 FWD), max 3 from same club, starting XI from squad
- Inputs: budget slider (£80M–£105M), formation selector (4-4-2, 4-3-3, 3-5-2, etc.), risk tolerance (Safe / Balanced / Bold)
- Optimization target: maximize predicted fantasy points (form + fixture difficulty + injury risk + price-to-points ratio)
- Output: visual pitch with 11 players in formation, captain has gold armband, full squad list, predicted total points, total cost
- Differential picks: low ownership + high upside recommendations
- Export Squad: copy to clipboard in FPL format

### 2.3 Predictions & Community

**Predictions Hub** (4 tabs)

*Tab 1 — AI Predictions:* upcoming fixtures of followed teams (next 7 days) with PredictionCard (animated win-probability bars, ML badge, predicted score, key factors expandable, "Use this prediction" + "Save" buttons)

*Tab 2 — My Predictions:*
- Stats row: total predictions, correct %, points total, current streak
- Upcoming predictions (editable until kickoff, side-by-side with ML for comparison)
- Past predictions (result vs prediction, points earned: 3 = exact / 1 = correct winner / 0 = wrong, running total chart)
- Make Prediction Form: match selector, score picker (large +/- buttons mobile-friendly), winner auto-computed, ML hint, success confetti

*Tab 3 — Prediction Leagues:*
- My Leagues cards (name, member count, your rank + points)
- League detail with leaderboard table (rank, avatar, username, points, predictions, accuracy %), current user row highlighted, rank change arrows
- Create League modal (name, public/private, invite code with copy button)
- Join League modal (invite code input)
- Public Leagues to join (top 5 by member count)

*Tab 4 — Community:*
- Active Polls: "Who will win [League] this season?" bar polls, vote once, real-time updates via Supabase Realtime
- Trending Predictions: "Most predicted scoreline for [Match]: X-Y (N users predicted)"
- Community Accuracy Leaders: top 10 anonymous users by accuracy

### 2.4 Bonus / Wishlist Features (Build After Core)

These ship in Phase 6 once the core is bulletproof:

- **Match Momentum Tracker** — rolling 5-min xG momentum chart, updates live during matches
- **Referee Bias Analyzer** — does this ref give more cards in big games? ML on historical ref data
- **Weather Impact Model** — does rain/heat affect home win rates? Open-Meteo API integration
- **Press Intensity Heatmap** — which teams press highest? StatsBomb PPDA visualization
- **Tournament Simulator** — Monte Carlo (10,000 simulations) of bracket outcomes
- **Injury Intelligence** — scrape injury data, model impact on team performance
- **Odds Movement Alert** — flag matches where bookmaker odds moved suspiciously (odds-api.com)

---

## 3. TECH STACK

### Frontend
- **Next.js 14** (App Router, TypeScript strict mode)
- **Tailwind CSS** with custom dark-only theme tokens
- **shadcn/ui** for component primitives (Button, Card, Sheet, Tabs, Dialog, Dropdown, Input, Avatar, Skeleton, Toast, ScrollArea, Separator, Progress, Popover, Slider)
- **Framer Motion** for all transitions and micro-interactions
- **TanStack Query v5** for data fetching, caching, polling
- **Recharts** for standard charts (bars, areas, lines, scatter)
- **Plotly.js** for advanced visualizations (3D scatter, complex interactivity)
- **D3.js** for custom SVG (pitch formations, brackets, pass networks)
- **Lucide React** for icons
- **canvas-confetti** for celebration moments
- **date-fns** for all timestamps (always in user's local timezone)
- **Zustand** for ephemeral client state (search modal open, filters)

### Backend (Next.js API Routes — TypeScript)
- All external API calls proxied through these routes — keys never reach the browser
- Cache-Control headers tuned per endpoint (live: no-store, fixtures: 5min, players: 1hr)
- Auth via Supabase SSR helpers, middleware for route protection

### ML Microservice (Python — FastAPI)
- **Python 3.11**, **FastAPI**, **Uvicorn**
- **Pandas + NumPy** for data wrangling
- **Scikit-learn** for KMeans clustering, StandardScaler, PCA
- **XGBoost** for match prediction + transfer value regression
- **SHAP** for ML explainability ("why did the model predict this?")
- **HuggingFace Transformers** for sentiment (`cardiffnlp/twitter-roberta-base-sentiment-latest` primary, `distilbert-base-uncased-finetuned-sst-2-english` fallback)
- **PuLP** for fantasy team linear programming
- **statsbombpy** for tactical event data
- **soccerdata** for FBref player stats (xG, xA, progressive passes)
- **BeautifulSoup4** for Transfermarkt scraping
- **PRAW** for Reddit API (sentiment data source)
- **Joblib** for model serialization (.pkl)

### Database & Auth
- **Supabase** — PostgreSQL + Auth (email OTP) + Realtime (notifications, polls, sentiment) + Storage (avatars)
- **Row Level Security** enabled on every table with explicit policies

### Caching & Background Work
- **Redis** (Upstash free tier) — sentiment pub/sub, ML prediction cache, rate limiting
- **Celery** (optional, only if heavy background jobs needed) — Reddit comment processing

### Deployment
- **Vercel** — Next.js frontend + API routes
- **Railway** — Python ML FastAPI service (Dockerized)
- **Supabase** — DB + Auth + Realtime + Storage
- **Upstash** — Redis (free tier)
- **Hugging Face Spaces** (optional) — host sentiment model separately if Railway memory is tight

### Tooling
- **TypeScript strict mode** (no `any`, no `@ts-ignore`)
- **ESLint** with Next.js config + `eslint-plugin-tailwindcss`
- **Prettier** with `prettier-plugin-tailwindcss` for class sorting
- **Husky** + **lint-staged** for pre-commit hooks
- **GitHub Actions** — CI: lint, typecheck, build on every PR
- **Vitest** for unit tests, **Playwright** for E2E smoke tests
- **Conventional Commits** for git history

---

## 4. DESIGN SYSTEM (DARK MODE ONLY)

There is no light mode. There is no theme toggle. Anyone who suggests adding one is wrong. The platform is a single, deliberate, premium dark interface — like a broadcast studio designed by Apple.

### 4.1 Colors (Tailwind tokens)

```ts
// tailwind.config.ts
colors: {
  bg: {
    primary: '#0A0A0A',     // page background — pure black (true OLED)
    surface: '#111111',     // cards, panels
    elevated: '#161616',    // modals, dropdowns, floating sheets
    raised: '#1C1C1C',      // hover states on elevated, deep stacks
  },
  border: {
    DEFAULT: '#1F1F1F',     // hairline, default
    strong: '#2A2A2A',      // emphasized
    accent: '#00D56340',    // accent glow (green at 25% alpha)
  },
  accent: {
    DEFAULT: '#00D563',     // signature green — primary CTAs, active states, success
    hover: '#00F070',
    muted: '#00D56320',     // 12.5% alpha for subtle fills
    glow: '#00D56340',      // 25% alpha for ring/shadow
  },
  premium: {
    DEFAULT: '#FFD700',     // gold — captain armband, MVP, achievements, awards
    muted: '#FFD70020',
  },
  live: {
    DEFAULT: '#FF3B3B',     // ONLY for live indicators
    glow: '#FF3B3B40',
  },
  warning: '#F5A623',
  info: '#3B82F6',
  text: {
    primary: '#FAFAFA',
    secondary: '#A1A1A1',
    muted: '#525252',
    disabled: '#3A3A3A',
  },
}
```

### 4.2 Typography

- **Font**: Inter (variable), self-hosted via `next/font/google` for zero CLS
- **Display sizes**: 48 / 36 / 28 / 24 (page titles, hero numbers)
- **Body**: 16 default, 14 secondary, 12 captions
- **Tabular numerals** on every score, stat, percentage, and time (`font-feature-settings: "tnum"`)
- **Tracking**: -0.02em on display sizes, default elsewhere
- **Line height**: 1.5 body, 1.2 display

### 4.3 Spacing & Layout

- 4px base unit (Tailwind default)
- Container: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`
- Card padding: `p-4` mobile, `p-6` desktop
- Section gap: `gap-6` mobile, `gap-8` desktop
- Mobile breakpoint: 640px. Test everything at 375px first.

### 4.4 Radius, Shadows, Borders

- Radius: `rounded-xl` (12px) for cards, `rounded-lg` (8px) for inputs/buttons, `rounded-full` for avatars/pills
- Shadows: avoid heavy drop shadows in dark mode — use border + accent glow for elevation
- Border weight: 1px hairlines, never 2px+
- Hover elevation: border color shifts to `accent.glow`, optional `box-shadow: 0 0 0 1px var(--accent-glow)`

### 4.5 Motion

- Page transitions: 200ms ease-out
- Element transitions: 150ms ease-out
- Number counters: animate up from 0 on mount (Framer Motion)
- Probability bars: layout animation from 0 to final width
- Live dot: 1.5s infinite scale + opacity pulse
- Slide sheets: spring physics (`stiffness: 300, damping: 30`)
- Reduce motion respected: `prefers-reduced-motion` disables non-essential animations

### 4.6 Component Patterns

- **MatchCard** has 3 variants: live (pulsing red badge), upcoming (kickoff time), finished (greyed score + FT badge)
- **LiveBadge** has 2 variants: full (`pulsing dot + LIVE text`) and dot-only
- **SkeletonCard** has 4 variants: match, news, player, stat
- **EmptyState** is always centered: emoji/illustration + heading + description + CTA button
- **ApiError** shows tailored messages by status: 429 → "We're updating data, try again in a few seconds ⏱"; 404 → "This [team/player/league] wasn't found"; 500 → "Our servers are taking a break ⚽"
- Every interactive element has visible focus ring (`focus-visible:ring-2 ring-accent ring-offset-2 ring-offset-bg-primary`)

### 4.7 Mobile-First Rules

- Bottom tab nav (5 tabs: Home, Scores, Predict, Intel, Profile) with safe-area inset padding
- Active tab: filled icon + accent green label
- Haptic-feel: scale 0.95 on press
- Sheets slide from bottom, not from right
- Touch targets minimum 44×44px
- No hover-only affordances — every hover state has an equivalent tap state

---

## 5. FILE STRUCTURE

```
futology/
├── app/                                    # Next.js App Router
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── onboarding/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx                        # Home feed
│   │   ├── scores/page.tsx
│   │   ├── fixtures/page.tsx
│   │   ├── clubs/
│   │   │   ├── page.tsx
│   │   │   └── [clubId]/page.tsx
│   │   ├── leagues/
│   │   │   ├── page.tsx
│   │   │   └── [leagueId]/page.tsx
│   │   ├── tournaments/
│   │   │   ├── page.tsx
│   │   │   └── [tournamentId]/page.tsx
│   │   ├── players/
│   │   │   └── [playerId]/page.tsx
│   │   ├── predictions/
│   │   │   ├── page.tsx                    # 4-tab hub
│   │   │   ├── ai/page.tsx
│   │   │   ├── mine/page.tsx
│   │   │   ├── leagues/page.tsx
│   │   │   └── leagues/[leagueId]/page.tsx
│   │   ├── intelligence/
│   │   │   ├── page.tsx                    # Hub landing
│   │   │   ├── match/page.tsx              # Match Predictor
│   │   │   ├── players/page.tsx            # Player Pulse
│   │   │   ├── sentiment/page.tsx          # Sentiment Storm
│   │   │   ├── tactics/page.tsx            # TacticBoard
│   │   │   ├── transfer/page.tsx           # Transfer Oracle
│   │   │   └── fantasy/page.tsx            # Fantasy IQ
│   │   └── profile/page.tsx
│   ├── api/
│   │   ├── football/
│   │   │   ├── live-scores/route.ts
│   │   │   ├── fixtures/route.ts
│   │   │   ├── standings/route.ts
│   │   │   ├── team/[teamId]/route.ts
│   │   │   ├── player/[playerId]/route.ts
│   │   │   ├── match/[fixtureId]/route.ts
│   │   │   └── search/route.ts
│   │   ├── news/route.ts
│   │   ├── ml/
│   │   │   ├── predict-match/route.ts
│   │   │   ├── player-cluster/route.ts
│   │   │   ├── sentiment/route.ts
│   │   │   ├── tactics/[matchId]/route.ts
│   │   │   ├── transfer-value/route.ts
│   │   │   └── fantasy-optimize/route.ts
│   │   └── notifications/route.ts
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── ui/                                 # shadcn primitives
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   ├── Sidebar.tsx
│   │   ├── MobileNav.tsx
│   │   └── NotificationBell.tsx
│   ├── cards/
│   │   ├── MatchCard.tsx
│   │   ├── MatchDetailSheet.tsx
│   │   ├── NewsCard.tsx
│   │   ├── ClubCard.tsx
│   │   ├── PlayerCard.tsx
│   │   ├── StandingsTable.tsx
│   │   └── TransferCard.tsx
│   ├── predictions/
│   │   ├── PredictionCard.tsx
│   │   ├── PredictionForm.tsx
│   │   ├── WinProbabilityBar.tsx
│   │   ├── PredictionLeaderboard.tsx
│   │   └── ScoresPicker.tsx
│   ├── intelligence/
│   │   ├── MatchPredictionWidget.tsx
│   │   ├── PlayerClusterChart.tsx
│   │   ├── PlayerComparisonRadar.tsx
│   │   ├── SentimentGauge.tsx
│   │   ├── SentimentTimeline.tsx
│   │   ├── ExcitementMeter.tsx
│   │   ├── MLExplainer.tsx
│   │   ├── PitchSVG.tsx
│   │   ├── XGShotMap.tsx
│   │   ├── PassNetwork.tsx
│   │   ├── PlayerHeatmap.tsx
│   │   ├── TransferValueWidget.tsx
│   │   └── FantasyPitch.tsx
│   └── shared/
│       ├── LiveBadge.tsx
│       ├── SkeletonCard.tsx
│       ├── EmptyState.tsx
│       ├── ApiError.tsx
│       ├── ErrorBoundary.tsx
│       ├── SearchModal.tsx
│       ├── ConfettiBurst.tsx
│       └── NumberCounter.tsx
├── ml-service/                             # Python FastAPI
│   ├── api/
│   │   ├── main.py
│   │   ├── routes/
│   │   │   ├── predictions.py
│   │   │   ├── players.py
│   │   │   ├── sentiment.py
│   │   │   ├── tactics.py
│   │   │   ├── transfer.py
│   │   │   └── fantasy.py
│   │   └── middleware/
│   ├── models/
│   │   ├── match_predictor.py              # XGBoost
│   │   ├── player_clusterer.py             # KMeans + PCA
│   │   ├── sentiment_analyzer.py           # HuggingFace
│   │   ├── transfer_value.py               # XGBoost regressor
│   │   └── fantasy_optimizer.py            # PuLP linear programming
│   ├── data/
│   │   ├── fetch_historical.py
│   │   ├── fetch_player_stats.py           # FBref + API-Football
│   │   ├── reddit_fetcher.py
│   │   ├── transfermarkt_scraper.py
│   │   ├── statsbomb_loader.py
│   │   ├── preprocess.py
│   │   ├── elo_engine.py
│   │   ├── raw/                            # downloaded CSVs
│   │   ├── processed/
│   │   └── trained_models/                 # .pkl files
│   ├── pipelines/
│   │   ├── fifa_pipeline.py                # Kaggle international match data
│   │   └── generate_charts.py
│   ├── train.py                            # one-shot training entrypoint
│   ├── seed_demo_data.py                   # demo mode data
│   ├── requirements.txt
│   └── Dockerfile
├── lib/
│   ├── supabase/
│   │   ├── client.ts                       # browser client
│   │   ├── server.ts                       # server client (SSR)
│   │   └── middleware.ts                   # session refresh
│   ├── api/
│   │   ├── football.ts                     # API-Football helpers
│   │   ├── news.ts                         # NewsAPI helpers
│   │   └── ml.ts                           # ML service proxy helpers
│   ├── utils/
│   │   ├── format.ts                       # date, number, score formatters
│   │   ├── season.ts                       # current season resolver
│   │   └── cn.ts                           # className merger
│   └── constants/
│       ├── leagues.ts                      # league IDs and metadata
│       ├── tournaments.ts
│       └── clusters.ts                     # cluster profile metadata
├── hooks/
│   ├── useUser.ts
│   ├── useUserPreferences.ts
│   ├── useLiveScores.ts
│   ├── useSentiment.ts
│   ├── useMLPrediction.ts
│   ├── useNotifications.ts
│   ├── useWebSocket.ts                     # for realtime sentiment
│   └── useDebounce.ts
├── types/
│   ├── football.ts
│   ├── ml.ts
│   ├── database.ts                         # auto-generated from Supabase
│   └── api.ts
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/                                # Playwright smoke tests
├── public/
│   ├── manifest.json
│   ├── icons/
│   └── og.png
├── docs/
│   ├── ARCHITECTURE.md
│   ├── DESIGN_SYSTEM.md
│   ├── DATABASE.md
│   ├── DECISIONS.md                        # ADRs
│   └── DEPLOYMENT.md
├── scripts/
│   ├── seed_demo.ts
│   ├── check_env.ts
│   └── pre_deploy_check.ts
├── .github/workflows/ci.yml
├── middleware.ts
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── .env.local                              # gitignored
├── .env.example
└── PROJECT_BIBLE.md                        # this file
```

---

## 6. DATABASE SCHEMA

Run all of this in the Supabase SQL editor. RLS is mandatory.

```sql
-- ====================
-- PROFILES
-- ====================
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  country TEXT,
  notifications_enabled BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT true,
  match_start_alerts BOOLEAN DEFAULT true,
  goal_alerts BOOLEAN DEFAULT true,
  transfer_alerts BOOLEAN DEFAULT true,
  weekly_digest BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================
-- USER PREFERENCES
-- ====================
CREATE TABLE user_followed_leagues (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  league_id INTEGER NOT NULL,
  league_name TEXT NOT NULL,
  league_logo TEXT,
  country TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, league_id)
);

CREATE TABLE user_followed_clubs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  team_id INTEGER NOT NULL,
  team_name TEXT NOT NULL,
  team_logo TEXT,
  league_id INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, team_id)
);

CREATE TABLE user_followed_players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  player_id INTEGER NOT NULL,
  player_name TEXT NOT NULL,
  player_photo TEXT,
  team_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, player_id)
);

CREATE TABLE user_followed_tournaments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  tournament_id INTEGER NOT NULL,
  tournament_name TEXT NOT NULL,
  tournament_logo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, tournament_id)
);

-- ====================
-- USER PREDICTIONS
-- ====================
CREATE TABLE predictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  fixture_id INTEGER NOT NULL,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  match_date TIMESTAMPTZ NOT NULL,
  predicted_home_score INTEGER,
  predicted_away_score INTEGER,
  predicted_winner TEXT,        -- 'home' | 'draw' | 'away'
  actual_home_score INTEGER,
  actual_away_score INTEGER,
  points_earned INTEGER DEFAULT 0,
  ml_suggested_winner TEXT,
  ml_confidence DECIMAL(5,2),
  is_settled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, fixture_id)
);

-- ====================
-- PREDICTION LEAGUES
-- ====================
CREATE TABLE prediction_leagues (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  invite_code TEXT UNIQUE DEFAULT substring(gen_random_uuid()::text, 1, 8),
  created_by UUID REFERENCES profiles(id),
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE prediction_league_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  league_id UUID REFERENCES prediction_leagues(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  total_points INTEGER DEFAULT 0,
  total_predictions INTEGER DEFAULT 0,
  correct_predictions INTEGER DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(league_id, user_id)
);

-- ====================
-- COMMUNITY POLLS
-- ====================
CREATE TABLE community_polls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  league_id INTEGER,
  season INTEGER,
  question TEXT NOT NULL,
  options JSONB NOT NULL,         -- [{ id: 'team_33', label: 'Man Utd', team_logo: '...' }]
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE poll_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID REFERENCES community_polls(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  option_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(poll_id, user_id)
);

-- ====================
-- ML CACHES
-- ====================
CREATE TABLE ml_match_predictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fixture_id INTEGER NOT NULL UNIQUE,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  match_date TIMESTAMPTZ NOT NULL,
  home_win_prob DECIMAL(5,2),
  draw_prob DECIMAL(5,2),
  away_win_prob DECIMAL(5,2),
  predicted_winner TEXT,
  confidence DECIMAL(5,2),
  predicted_score TEXT,
  key_factors JSONB,
  model_version TEXT DEFAULT 'v1',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ml_transfer_values (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id INTEGER NOT NULL UNIQUE,
  predicted_value_eur BIGINT,
  low_estimate BIGINT,
  high_estimate BIGINT,
  shap_explanations JSONB,
  comparable_players JSONB,
  computed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================
-- SENTIMENT
-- ====================
CREATE TABLE match_sentiment_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fixture_id INTEGER NOT NULL,
  match_minute INTEGER,
  home_sentiment DECIMAL(5,2),
  away_sentiment DECIMAL(5,2),
  neutral_pct DECIMAL(5,2),
  excitement_score DECIMAL(5,2),
  total_posts INTEGER,
  dominant_emotion TEXT,
  trending_words JSONB,
  sample_comments JSONB,
  snapshot_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sentiment_fixture ON match_sentiment_snapshots(fixture_id, snapshot_at DESC);

-- ====================
-- NOTIFICATIONS
-- ====================
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,             -- 'match_start' | 'goal' | 'transfer' | 'prediction_settled' | 'league_invite'
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);

-- ====================
-- ROW LEVEL SECURITY
-- ====================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_followed_leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_followed_clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_followed_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_followed_tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_league_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_match_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_transfer_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_sentiment_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profile policies
CREATE POLICY "Users view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Followed-* policies (own data only)
CREATE POLICY "Own leagues" ON user_followed_leagues FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own clubs" ON user_followed_clubs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own players" ON user_followed_players FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own tournaments" ON user_followed_tournaments FOR ALL USING (auth.uid() = user_id);

-- Predictions
CREATE POLICY "Own predictions" ON predictions FOR ALL USING (auth.uid() = user_id);

-- Prediction leagues
CREATE POLICY "View public or own leagues" ON prediction_leagues FOR SELECT
  USING (is_public OR created_by = auth.uid() OR id IN (
    SELECT league_id FROM prediction_league_members WHERE user_id = auth.uid()
  ));
CREATE POLICY "Create league" ON prediction_leagues FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Own league members" ON prediction_league_members FOR ALL USING (auth.uid() = user_id);

-- Polls (public read, vote = own)
CREATE POLICY "Anyone reads polls" ON community_polls FOR SELECT USING (true);
CREATE POLICY "Own votes" ON poll_votes FOR ALL USING (auth.uid() = user_id);

-- ML caches: anyone reads
CREATE POLICY "Anyone reads ML predictions" ON ml_match_predictions FOR SELECT USING (true);
CREATE POLICY "Anyone reads transfer values" ON ml_transfer_values FOR SELECT USING (true);
CREATE POLICY "Anyone reads sentiment" ON match_sentiment_snapshots FOR SELECT USING (true);

-- Notifications
CREATE POLICY "Own notifications" ON notifications FOR ALL USING (auth.uid() = user_id);

-- ====================
-- TRIGGERS
-- ====================
-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-update updated_at on profiles
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_timestamp BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ====================
-- REALTIME PUBLICATIONS
-- ====================
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE poll_votes;
ALTER PUBLICATION supabase_realtime ADD TABLE match_sentiment_snapshots;
```

---

## 7. ENVIRONMENT VARIABLES

Copy `.env.example` → `.env.local`. Never commit `.env.local`.

```env
# === Supabase ===
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# === API-Football (RapidAPI) ===
RAPIDAPI_KEY=
RAPIDAPI_HOST=api-football-v1.p.rapidapi.com

# === football-data.org (live World Cup, free) ===
FOOTBALL_DATA_API_KEY=

# === NewsAPI ===
NEWS_API_KEY=

# === Resend (email OTP + notifications) ===
RESEND_API_KEY=
RESEND_FROM_EMAIL=

# === ML Service ===
ML_SERVICE_URL=http://localhost:8000
ML_SERVICE_TOKEN=                    # shared secret between Next.js and FastAPI

# === Reddit (free sentiment source) ===
REDDIT_CLIENT_ID=
REDDIT_CLIENT_SECRET=
REDDIT_USER_AGENT=Futology/1.0

# === Twitter (optional, paid) ===
TWITTER_BEARER_TOKEN=

# === Redis (Upstash) ===
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# === Demo / Feature Flags ===
DEMO_MODE=false                       # when true, ML routes return seeded data
ENABLE_TWITTER_SENTIMENT=false        # default to Reddit-only

# === App ===
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=FUTOLOGY
```

---

## 8. DATA SOURCES & APIs

| Source | Use | Cost | Notes |
|---|---|---|---|
| API-Football (RapidAPI) | Live scores, fixtures, standings, players, teams, search | Free 100 req/day | Primary live data source |
| football-data.org | World Cup live, lineups, events | Free (10 req/min) | Backup + tournament data |
| NewsAPI | Football news articles | Free 100 req/day | Filter by followed clubs/leagues |
| Resend | Email OTP + notifications | Free 3,000/month | Transactional email |
| Reddit API (PRAW) | Match thread comments for sentiment | Free 60 req/min | r/soccer, r/PremierLeague, r/LaLiga, r/bundesliga |
| Twitter/X API v2 | Optional sentiment source | Paid $100/mo | Off by default |
| football-data.co.uk | Historical match CSVs (5 leagues, multiple seasons) | Free | For ML training |
| Kaggle FIFA dataset | International match results 1872–present | Free | World Cup predictions |
| FBref (via soccerdata) | Player advanced stats (xG, xA, progressive carries, pressures) | Free | Clustering features |
| Transfermarkt | Player market values, transfer history | Free (scraped, respect rate limit) | Transfer Oracle target |
| StatsBomb Open Data | Detailed event data for select competitions | Free | TacticBoard xG, pass networks |
| Understat | xG by match | Free | Backup xG source |
| Open-Meteo | Weather data (Bonus: weather impact model) | Free | For wishlist features |
| Supabase | DB + Auth + Realtime + Storage | Free 500MB | Core infra |
| Vercel | Frontend hosting | Free 100GB/mo | Next.js |
| Railway | ML service hosting | $5 credit free, ~$5/mo after | Python container |
| Upstash | Redis | Free 10K req/day | Caching + pub/sub |

---

## 9. ML MODELS & PIPELINES

### 9.1 Match Predictor (XGBoost Classifier)

**Training data:** football-data.co.uk CSVs for EPL (E0), La Liga (SP1), Serie A (I1), Bundesliga (D1), Ligue 1 (F1), seasons 2019–20 through 2024–25 (~9,000 matches). Plus Kaggle international results dataset for World Cup predictions.

**Features (per match):**
- Home/away form: wins, draws, losses, goals scored avg, goals conceded avg (last 5 matches)
- Home/away shots avg, shots on target avg (last 5)
- H2H record: home wins, draws, away wins (last 10 meetings)
- Clean sheets last 5 (home, away)
- Days since last match (fatigue proxy)
- ELO rating differential (computed via 400-point ELO across full history)
- Tournament importance weight (World Cup > Continental > League > Friendly)
- Neutral ground flag

**Model:**
- `XGBClassifier(n_estimators=300, max_depth=6, learning_rate=0.05, subsample=0.8, colsample_bytree=0.8, eval_metric='mlogloss')`
- Probability calibration via `CalibratedClassifierCV(method='isotonic')`
- Temporal train/test split (last 20% of matches by date is test)
- Class weights to handle draw imbalance

**Output:**
```json
{
  "home_win_prob": 52.3,
  "draw_prob": 23.1,
  "away_win_prob": 24.6,
  "predicted_winner": "home",
  "confidence": 52.3,
  "predicted_score": "2-1",
  "key_factors": [
    "Home team won 4 of last 5 matches",
    "Away team missing top scorer",
    "H2H favors home (3W 1D 1L)"
  ],
  "model_accuracy": 65.2
}
```

**SHAP integration:** `TreeExplainer` produces top-3 features per prediction, mapped to plain-English strings via a templated translator.

### 9.2 Player Clusterer (KMeans + PCA)

**Features (per 90 min normalized):** goals, assists, xG, xA, key passes, progressive passes, progressive carries, pressures, tackles, interceptions, shots, pass accuracy.

**Pipeline:** `StandardScaler` → `KMeans(n_clusters=6, random_state=42, n_init=10)` → `PCA(n_components=2)` for 2D visualization. Elbow method validation. Silhouette score reported.

**6 cluster profiles** (named via centroid inspection):
1. **Target Striker** `#FF6B6B` — high shots, aerial duels
2. **Creative Playmaker** `#4ECDC4` — high key passes, xA
3. **Box-to-Box Midfielder** `#45B7D1` — high pressures, progressive carries
4. **Ball-Playing Defender** `#96CEB4` — high pass accuracy, progressive passes
5. **High Press Forward** `#FFEAA7` — high pressures, off-ball movement
6. **Deep-Lying Playmaker** `#DDA0DD` — high pass volume, low shots

**Output:** for each player, cluster ID + name + color + PCA (x, y) + nearest 3 neighbors by Euclidean distance.

### 9.3 Sentiment Analyzer

**Primary model:** `cardiffnlp/twitter-roberta-base-sentiment-latest` (best for social text)
**Fallback:** `distilbert-base-uncased-finetuned-sst-2-english`

**Source:** Reddit match threads (free) via PRAW. Twitter optional via `ENABLE_TWITTER_SENTIMENT=true`.

**Pipeline:**
1. Find match thread on r/soccer / r/PremierLeague / etc. by searching "Match Thread: {home} vs {away}"
2. Pull last N comments (filter: ≥5 chars, no pure URLs, no pure emoji)
3. Batch infer sentiment (batch_size=32)
4. Bucket comments by team mention (home / away / neutral) using fuzzy team name matching
5. Compute weighted average sentiment per team (-1 to +1)
6. Excitement score = mean absolute sentiment
7. Save snapshot to `match_sentiment_snapshots` every 60s during live matches
8. Detect sentiment shifts >0.3 = emit "sentiment swing" event

**Football-emotion mapping** post-classification: `celebrating | frustrated | anxious | shocked | neutral` based on keyword boost (GOAAL, penalty, red card, VAR, offside) + score.

### 9.4 Transfer Value Regressor

**Model:** XGBoost Regressor on `log(market_value_eur)` (skewed target).

**Features:** age, position (one-hot), continent (one-hot), goals/90, assists/90, xG/90, xA/90, league_level (1–5), club_reputation_score (computed from UEFA coefficients), minutes_played_last_season, appearances, years_left_on_contract, recent_form (goals in last 10), national_team_caps.

**Output:** `{ predicted_value_eur, low (10th percentile), high (90th percentile), shap_explanations: [{ factor, contribution_eur }], comparable_players: [...] }`. Confidence interval via quantile regression or bootstrapped predictions.

### 9.5 Fantasy Optimizer

**Library:** PuLP (linear programming). Fallback: `scipy.optimize`.

**Constraints:**
- Total cost ≤ budget (£80–£105M)
- Squad size = 15 (2 GK, 5 DEF, 5 MID, 3 FWD)
- Max 3 players from same club
- Starting XI = 11 from squad with valid formation (e.g., 4-3-3 = 1 GK, 4 DEF, 3 MID, 3 FWD)

**Objective:** maximize `Σ predicted_fantasy_points` where points = f(form, fixture_difficulty, injury_risk, price_to_points).

**Output:** full 15-player squad, starting XI, captain (highest predicted points), bench order, total cost, predicted total points, alternative differential picks.

### 9.6 TacticBoard

Reads StatsBomb open data via `statsbombpy`. Computes:
- xG per shot (StatsBomb's built-in model)
- Pass network: nodes = avg player position, edges = pass count between pairs
- PPDA (Passes Per Defensive Action) for pressing intensity
- Field tilt % (share of touches in opposition third)
- Player heatmap (grid of touch counts on a 12×8 pitch grid)

---

## 10. API ROUTES REFERENCE

### Next.js API Routes (frontend-facing)

| Route | Method | Purpose | Cache |
|---|---|---|---|
| `/api/football/live-scores` | GET | All live matches, optional `?league=` filter | no-store |
| `/api/football/fixtures` | GET | `?date=&team=&league=&next=&last=` | s-maxage=300 |
| `/api/football/standings` | GET | `?league=&season=` | s-maxage=300 |
| `/api/football/team/[teamId]` | GET | Team info + season stats | s-maxage=3600 |
| `/api/football/player/[playerId]` | GET | Player info + stats `?season=` | s-maxage=3600 |
| `/api/football/match/[fixtureId]` | GET | Fixture details + events + stats + lineups + H2H | live: s-maxage=30, finished: 3600 |
| `/api/football/search` | GET | `?q=&type=team\|player\|league` | s-maxage=3600 |
| `/api/news` | GET | `?teams=&players=` filtered NewsAPI | s-maxage=900 |
| `/api/ml/predict-match` | GET | `?fixture_id=` (caches in `ml_match_predictions`) | s-maxage=3600 |
| `/api/ml/player-cluster` | POST | `{ player_ids: [], season }` | s-maxage=3600 |
| `/api/ml/sentiment` | GET | `?fixture_id=` polls Reddit + ML | no-store |
| `/api/ml/tactics/[matchId]` | GET | xG map + pass network + heatmaps | s-maxage=86400 |
| `/api/ml/transfer-value` | POST | `{ player_id }` or full feature set | s-maxage=86400 |
| `/api/ml/fantasy-optimize` | POST | `{ budget, formation, risk_tolerance }` | no-store |
| `/api/notifications` | GET/POST | List user's notifications / create one | no-store |

### FastAPI ML Routes (internal, behind `ML_SERVICE_TOKEN` auth)

| Route | Method | Purpose |
|---|---|---|
| `/health` | GET | `{ status, models_loaded }` |
| `/predict/match` | POST | Match outcome prediction |
| `/predict/batch` | GET | Multiple fixture predictions `?fixture_ids=` |
| `/cluster/players` | POST | Player clustering |
| `/sentiment/analyze` | POST | Run sentiment on text batch |
| `/sentiment/match/{fixture_id}` | GET | Pull Reddit + analyze + persist snapshot |
| `/tactics/{match_id}/xg-map` | GET | StatsBomb xG shots |
| `/tactics/{match_id}/pass-network` | GET | Pass network nodes/edges |
| `/tactics/{match_id}/heatmap/{player_id}` | GET | Player heatmap grid |
| `/transfer-value` | POST | Predict market value with SHAP |
| `/fantasy/optimize` | POST | Run linear program |
| `/model/stats` | GET | Accuracy, features, training data size, last trained |

WebSocket: `ws://ml-service/ws/sentiment/{fixture_id}` emits sentiment updates every 10s while active.

---

## 11. PHASED BUILD PLAN

Each phase ends with: lint clean, typecheck clean, build successful, every new page/route smoke-tested. Do not advance until green.

### Phase 0 — Repo & Environment Setup
- `npx create-next-app@latest futology --typescript --tailwind --app --import-alias="@/*"`
- Install all deps (see Tech Stack)
- `npx shadcn@latest init` (slate base, CSS vars)
- Add all shadcn components from the list
- Configure `tailwind.config.ts` with the dark-only color tokens from §4
- Configure `app/globals.css` with custom properties, live-dot animation, glassmorphism util, scrollbar styling, `html { color-scheme: dark }` and `<html className="dark">`
- Set up `app/layout.tsx`: Inter font via `next/font`, QueryClient provider, Toaster, dark-only meta
- Create `.env.example` with all keys from §7
- Initialize git, set up Husky + lint-staged + Conventional Commits
- Push to GitHub, set up GitHub Actions CI (lint + typecheck + build)
- Initialize Supabase project, run schema from §6, generate `types/database.ts` via Supabase CLI

**Acceptance:** `pnpm dev` runs, dark theme visible, CI green on first push.

### Phase 1 — Auth, Onboarding, Shell
- `lib/supabase/{client,server,middleware}.ts`
- `middleware.ts` for route protection (dashboard requires session, login redirects logged-in users)
- `app/(auth)/login/page.tsx` — email OTP flow with 3 states (initial / sent / loading) + Framer transitions
- `app/(auth)/onboarding/page.tsx` — 3-step wizard with progress bar:
  - Step 1: 20-league grid (Premier League 39, La Liga 140, Serie A 135, Bundesliga 78, Ligue 1 61, UCL 2, Europa 3, Conference 848, MLS 253, Liga MX 262, Eredivisie 88, Primeira 94, Süper Lig 203, Saudi Pro 307, ISL 323, A-League 188, J-League 98, K-League 292, Brasileirão 71, Argentine Primera 128)
  - Step 2: club search with quick picks (Man Utd, Real Madrid, Barça, Liverpool, Bayern, PSG)
  - Step 3: player search + tournaments (WC 1, Euros 4, Copa America 9, AFCON 6, Asian Cup 17, CWC 15, FA Cup 45, Copa del Rey 143, DFB-Pokal 81, Coupe de France 16)
- Confetti on completion → save all selections → redirect to `/`
- `components/layout/Navbar.tsx` (desktop top, mobile bottom tabs)
- `components/layout/MobileNav.tsx` with safe-area insets
- `app/(dashboard)/layout.tsx`
- `components/shared/SearchModal.tsx` (Cmd+K, debounced, recent searches in localStorage)
- `components/shared/{LiveBadge,SkeletonCard,EmptyState,ApiError,ErrorBoundary}.tsx`
- `hooks/{useUser,useUserPreferences}.ts`

**Acceptance:** sign in via email → onboarding → home shell renders. Mobile bottom nav works. Cmd+K opens search.

### Phase 2 — Live Data Layer & Core Pages
- All `app/api/football/*` routes (proxy API-Football, never expose key)
- `app/api/news/route.ts`
- `lib/api/football.ts` helpers: `getCurrentSeason()`, `formatFixture()`, `formatStandings()`, `formatPlayer()`
- `types/football.ts` complete interfaces
- `hooks/useLiveScores.ts` (30s polling)
- `components/cards/MatchCard.tsx` (3 variants: live / upcoming / finished)
- `components/cards/MatchDetailSheet.tsx` (5 tabs: Overview / Stats / Lineups / Events / H2H)
- `app/(dashboard)/page.tsx` — Home Feed (Live Now strip + 2-column layout)
- `app/(dashboard)/scores/page.tsx` — date selector + filter tabs + grouped matches
- `app/(dashboard)/clubs/page.tsx` + `[clubId]/page.tsx` (6 tabs)
- `app/(dashboard)/leagues/page.tsx` + `[leagueId]/page.tsx` (StandingsTable with bands, top scorers, top assists)
- `app/(dashboard)/tournaments/page.tsx` + `[tournamentId]/page.tsx`
- `app/(dashboard)/players/[playerId]/page.tsx`

**Acceptance:** every page loads with real data, skeleton loaders show during fetch, empty states designed, mobile usable at 375px.

### Phase 3 — ML Service (Python FastAPI)
- `ml-service/requirements.txt` complete
- `ml-service/data/elo_engine.py` — pure-Python ELO over historical matches
- `ml-service/data/fetch_historical.py` — football-data.co.uk CSV downloader
- `ml-service/pipelines/fifa_pipeline.py` — Kaggle international data ETL with engineered features
- `ml-service/data/fetch_player_stats.py` — FBref via soccerdata + API-Football fallback
- `ml-service/data/reddit_fetcher.py` — PRAW match thread + comment puller
- `ml-service/data/transfermarkt_scraper.py` — rate-limited, rotating UA
- `ml-service/data/statsbomb_loader.py` — uses `statsbombpy`
- `ml-service/models/match_predictor.py` — XGBoost + calibration + SHAP
- `ml-service/models/player_clusterer.py` — KMeans + PCA + cluster profiles
- `ml-service/models/sentiment_analyzer.py` — HuggingFace pipeline + football emotions
- `ml-service/models/transfer_value.py` — XGBoost Regressor + SHAP
- `ml-service/models/fantasy_optimizer.py` — PuLP linear program
- `ml-service/api/main.py` — FastAPI app, CORS, auth middleware (`ML_SERVICE_TOKEN`), startup loads all models
- `ml-service/api/routes/{predictions,players,sentiment,tactics,transfer,fantasy}.py`
- `ml-service/train.py` — one-shot training entrypoint that produces all `.pkl` files
- `ml-service/Dockerfile` (Python 3.11 slim, copy → install → uvicorn on 8000)
- `railway.json` for deployment

**Acceptance:** `python train.py` produces all `.pkl` files. `uvicorn` serves `/health` returning `{models_loaded: true}`. Every documented route works against curl.

### Phase 4 — Intelligence Hub & ML-Powered Pages
- Next.js proxy routes: `app/api/ml/*` (read `ML_SERVICE_TOKEN`, never expose)
- `hooks/{useMLPrediction,useSentiment,useWebSocket}.ts`
- `app/(dashboard)/intelligence/page.tsx` — hub landing with 6 cards, quick-prediction widget, model performance section
- `app/(dashboard)/intelligence/match/page.tsx` — full match predictor
- `app/(dashboard)/intelligence/players/page.tsx` — cluster scatter + comparison radar + team analysis
- `app/(dashboard)/intelligence/sentiment/page.tsx` — timeline + gauges + excitement + live feed + reaction cards + post-match replay
- `app/(dashboard)/intelligence/tactics/page.tsx` — pitch SVG + xG map + pass network + heatmap
- `app/(dashboard)/intelligence/transfer/page.tsx` — transfer value lookup with SHAP + comparables
- `app/(dashboard)/intelligence/fantasy/page.tsx` — squad optimizer with formation pitch view
- All `components/intelligence/*` components

**Acceptance:** every intelligence page works end-to-end with real ML responses. Sentiment updates every 60s during live matches. SHAP explanations render in plain English.

### Phase 5 — Predictions, Profile, Notifications
- `app/(dashboard)/predictions/page.tsx` — 4 tabs (AI / Mine / Leagues / Community)
- `components/predictions/{PredictionCard,PredictionForm,WinProbabilityBar,PredictionLeaderboard,ScoresPicker}.tsx`
- Prediction settlement job: cron-style edge function that polls finished fixtures, computes points, updates `predictions` and `prediction_league_members`, fires notifications
- `app/(dashboard)/profile/page.tsx` — full profile management
- `hooks/useNotifications.ts` (Supabase Realtime subscription)
- `components/layout/NotificationBell.tsx`
- Community polls realtime via Supabase channel
- Resend integration for email notifications (match start, prediction settled, weekly digest)

**Acceptance:** create league → invite → join → predict → settle → leaderboard updates in realtime. Notifications arrive both in-app (realtime) and email.

### Phase 6 — Bonus / Wishlist Features
- Match Momentum (rolling xG)
- Referee Bias Analyzer (model on referee historical bookings)
- Weather Impact Model (Open-Meteo integration)
- Press Intensity Heatmap
- Tournament Simulator (Monte Carlo)
- Injury Intelligence
- Odds Movement Alerts (odds-api.com)

**Acceptance:** each feature lives in `/intelligence/extras/[feature]` and is linked from the hub. All optional; gated by feature flags.

### Phase 7 — Polish, Performance, Deploy
- Mobile polish pass on every page (test at 375px)
- PWA: `public/manifest.json`, theme color `#00D563`, installable
- Service worker via `next-pwa` for offline caching of read-only data
- Skeleton loader audit (every fetching state has one)
- Empty state audit (every empty case is designed)
- Error boundaries on every page
- Bundle analysis (`@next/bundle-analyzer`), code-split heavy charts
- TanStack Query config: `staleTime: 30000, gcTime: 300000, retry: 1, refetchOnWindowFocus: false, refetchOnMount: false`
- E2E smoke tests via Playwright (login → onboarding → home → scores → predictions → intelligence)
- Lighthouse: aim ≥90 on Performance, Accessibility, Best Practices, SEO
- Demo mode: `DEMO_MODE=true` returns seeded data so the app works without external API keys (for portfolio demos)
- Pre-deploy script: `scripts/check_env.ts` validates every required env var
- Deploy ML service to Railway, frontend to Vercel
- Configure Supabase redirect URLs to production

**Acceptance:** Lighthouse green, all E2E green, production URL works end-to-end without dev shortcuts.

---

## 12. QUALITY BAR & DEFINITION OF DONE

A feature is "done" when **all** of these are true:

**Functional**
- Works against real backend, not mocked
- Handles loading state (skeleton, not spinner-on-blank)
- Handles error state (ApiError component with retry)
- Handles empty state (designed with CTA)
- Mobile usable at 375px
- Keyboard accessible (Tab, Enter, Esc, arrow keys where relevant)
- Focus rings visible on every interactive element

**Code**
- TypeScript strict (no `any`, no `@ts-ignore`)
- ESLint clean
- Prettier formatted
- No `console.log` left in (use a logger or remove)
- No `TODO` / `FIXME` without an owner + issue link
- Functions < 50 lines where possible; extract helpers
- Components < 200 lines where possible; extract sub-components

**UI**
- Matches design system (colors, spacing, typography from §4)
- Dark mode only verified (no light backgrounds slipped in)
- Animations respect `prefers-reduced-motion`
- Tabular numerals on all stats / scores / percentages
- Timestamps in user's local timezone via `date-fns`

**Data**
- API keys server-side only
- Cache-Control header set per endpoint
- RLS policies in place for any new table
- Optimistic updates for user actions where it makes sense

**Testing**
- At minimum: smoke test the page loads + key interaction works (Playwright)
- Critical logic (prediction settlement, fantasy optimizer, sentiment aggregation) has unit tests

---

## 13. DEPLOYMENT

### One-time setup
1. **Supabase**: create project, paste schema from §6, enable email OTP (disable email confirmation), set Site URL after first Vercel deploy.
2. **API Keys**: register for RapidAPI (API-Football), NewsAPI, Resend, Reddit (`reddit.com/prefs/apps` → script), football-data.org.
3. **Upstash Redis**: create database, copy REST URL + token.
4. **Train ML models**: `cd ml-service && python train.py` — produces all `.pkl` files in `trained_models/`.

### Deploy ML service to Railway
- `railway init` from `ml-service/` directory
- Add env vars (RAPIDAPI_KEY, REDDIT creds, ML_SERVICE_TOKEN, etc.)
- `railway up` — note the public URL

### Deploy frontend to Vercel
- `npm i -g vercel && vercel`
- In Vercel dashboard, add every env var from `.env.local` (set ML_SERVICE_URL to Railway URL)
- Update Supabase Site URL + Redirect URLs to Vercel domain

### Post-deploy verification checklist
- [ ] Email OTP login works
- [ ] Onboarding saves to Supabase (verify in table editor)
- [ ] Home feed shows news for followed teams
- [ ] Live scores update every 30s
- [ ] Match detail sheet opens with all 5 tabs
- [ ] Clubs / Leagues / Tournaments pages load
- [ ] ML match predictor returns a prediction
- [ ] Player cluster chart renders with real data
- [ ] Sentiment tracker pulls from Reddit during a live match
- [ ] TacticBoard pitch SVG renders xG map
- [ ] Transfer Oracle returns a value
- [ ] Fantasy IQ optimizer returns a valid squad
- [ ] Prediction → settlement → leaderboard flow works end-to-end
- [ ] Notifications bell shows realtime updates
- [ ] Cmd+K search returns teams / players / leagues
- [ ] Mobile bottom nav works on a real phone
- [ ] PWA installable on iOS + Android

### Common deploy issues
- **CORS** between Vercel and Railway → add Vercel origin to FastAPI CORS middleware allowlist
- **Supabase RLS blocking reads** → check policies match the queried table
- **API-Football rate limit** → cache aggressively, add fallback in `/api/ml/predict-match`
- **ML model not loading** → confirm `.pkl` files are inside Docker image (check `.dockerignore`)
- **Redis connection** → use Upstash REST URLs, not native Redis URL, on serverless

---

## 14. ANTI-PATTERNS (NEVER DO THESE)

- ❌ Adding a light mode or theme toggle
- ❌ Mocking UI without wiring real backend
- ❌ Leaving `// TODO: hook this up` in shipped code
- ❌ Exposing API keys in `NEXT_PUBLIC_*` vars (only Supabase URL + anon key are public)
- ❌ Using `any` or `@ts-ignore` to silence TypeScript
- ❌ Skipping skeleton loaders ("it'll be fast enough")
- ❌ Skipping empty states ("nobody will hit it")
- ❌ Building a feature without RLS on its tables
- ❌ Polling an API more often than necessary (live: 30s, sentiment: 60s, standings: 5min)
- ❌ Inline styles or magic hex codes (use Tailwind tokens from §4)
- ❌ Hover-only affordances (must have tap equivalents)
- ❌ 2px+ borders or heavy drop shadows (use border + accent glow)
- ❌ Mixing fonts (Inter only, with optional Bebas Neue if user later wants display variant)
- ❌ Pushing without `pnpm lint && pnpm typecheck && pnpm build` passing locally
- ❌ Reaching for a UI library other than shadcn/ui for primitives
- ❌ Building a chart from scratch when Recharts has it
- ❌ Letting a component exceed 300 lines — split it
- ❌ Coupling Next.js code to Python ML internals — go through the FastAPI contract

---

## 🎬 GO TIME

Read this entire file. Confirm you understand. Then start Phase 0.

When in doubt, default to: **dark mode only, mobile first, functioning over fancy, ship vertical slices.**

This is the project of my life. Build it like it.

— FUTOLOGY · Built with passion. Powered by data. Fueled by football. ⚽
