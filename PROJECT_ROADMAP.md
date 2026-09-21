# CollectHub: Unified Tracking Platform
> Bookmarks + Habits + Watchlist + Reviews = One Dashboard

---

## 🎯 Project Overview

**Single platform** where users can organize any type of content:
- **Links** (research, articles, resources)
- **Habits** (daily tracking, streaks)
- **Media** (movies, games — watch/play lists)
- **Reviews** (written on any content)
- **Social** (follow users, see feeds, leaderboards)

---

## 📋 Implementation Phases

### **Phase 1: Core Foundation (Weeks 1-2)**
*Bare-bones working app. No fancy integrations yet.*

**Backend:**
- User auth (signup/login, JWT)
- Database schema (users, collections, items, reviews)
- Basic CRUD routes (create/read/update/delete)
- Simple search (database query)

**Frontend:**
- Auth pages (login/signup)
- Dashboard skeleton (navigation)
- Add new item form (universal)
- Item list view
- User profile page

**No integrations yet. No WebSockets. No cron jobs.**

---

### **Phase 2: Core Features (Weeks 3-4)**
*Make it actually useful.*

**Backend:**
- Collections (grouping items)
- Sharing & permissions (read/edit/admin)
- Comments on items
- Tags for search/filtering
- User following system

**Frontend:**
- Collection creation/management
- Share links (shareable URLs)
- Comment threads
- Follow button + user profiles
- Activity feed (simple: "User X added item Y")

**Still no external APIs.**

---

### **Phase 3: Smart Features (Weeks 5-6)**
*Integrations + real-time stuff.*

**Backend:**
- **Open Graph scraping** (when user saves a link, auto-fetch title/image)
- **Email notifications** (nodemailer) — someone commented, user followed
- **Cron job for streaks** — daily task to check habit completion
- **Leaderboards** (habit streaks, most reviewed, etc.)
- **Search upgrade** (full-text search or basic Algolia integration)

**Frontend:**
- Real-time feed updates (WebSocket for live comments)
- Better habit dashboard (charts with chart.js)
- Leaderboard page
- Notifications dropdown

---

### **Phase 4: Third-Party APIs (Week 7)**
*Optional: Make bookmarks/watchlist smarter.*

**Backend:**
- **TMDB API** (when user adds a movie, auto-fetch poster/synopsis)
- **IGDB API** (when user adds a game, auto-fetch cover/details)
- **Maybe Spoonacular** (if expanding to recipes)

**Frontend:**
- Movie/game picker (search TMDB/IGDB, click to add)
- Auto-populated details

---

### **Phase 5: Polish + Deploy (Week 8)**
- Error handling
- Rate limiting
- Performance optimizations
- Deploy (Vercel for Next.js, Railway/Render for Express)
- Browser extension (optional, save current page as bookmark)

---

## 🗂️ Project Structure

```
collecthub/
│
├── backend/                 (Express)
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.js          (signup, login)
│   │   │   ├── items.js         (create, read, update, delete)
│   │   │   ├── collections.js   (create, manage, share)
│   │   │   ├── reviews.js       (comments on items)
│   │   │   ├── users.js         (profiles, following)
│   │   │   └── search.js        (search items by tag/text)
│   │   ├── middleware/
│   │   │   ├── auth.js          (JWT verification)
│   │   │   └── errorHandler.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Collection.js
│   │   │   ├── Item.js
│   │   │   ├── Review.js
│   │   │   └── Share.js
│   │   ├── services/
│   │   │   ├── ogScraper.js     (Open Graph)
│   │   │   ├── emailService.js  (nodemailer)
│   │   │   ├── streakJob.js     (cron job)
│   │   │   └── apiService.js    (TMDB, IGDB)
│   │   ├── config/
│   │   │   └── db.js            (Postgres connection)
│   │   └── index.js
│   ├── .env
│   └── package.json
│
├── frontend/                (Next.js)
│   ├── app/
│   │   ├── page.tsx             (landing/dashboard)
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   └── signup/
│   │   ├── collections/
│   │   │   ├── [id]/
│   │   │   └── new/
│   │   ├── items/
│   │   │   ├── [id]/
│   │   │   └── new/
│   │   ├── profile/
│   │   │   └── [userId]/
│   │   ├── feed/
│   │   └── leaderboard/
│   ├── components/
│   │   ├── ItemCard.tsx
│   │   ├── CollectionList.tsx
│   │   ├── ReviewThread.tsx
│   │   ├── Navbar.tsx
│   │   └── ...
│   ├── lib/
│   │   ├── api.ts               (fetch wrapper for backend)
│   │   ├── auth.ts              (JWT handling)
│   │   └── socket.ts            (WebSocket client)
│   ├── .env.local
│   └── package.json
│
└── docs/
    ├── ARCHITECTURE.md
    ├── DATABASE.md
    ├── API_SPEC.md
    └── SETUP.md
```

---

## 🔄 Content Types Strategy

All content is unified under **Items**:

```
Item {
  id
  type: "link" | "habit" | "movie" | "game"
  collectionId
  userId
  title
  description
  url? (for links)
  image? (auto-fetched or user-uploaded)
  metadata? (JSON: release date, genres, rating, etc.)
  createdAt
  updatedAt
}

Review {
  id
  itemId
  userId
  rating? (1-5)
  text
  createdAt
}

// Habits track daily progress
HabitLog {
  id
  habitId (item with type: "habit")
  userId
  date
  completed: boolean
  note?
}
```

This design means you can:
- Save a link and review it
- Add a movie and write a review
- Track a habit daily and comment on it
- Share any collection of mixed content types

---

## 🛠️ Tech Stack

**Backend:**
- Node.js + Express
- PostgreSQL (Postgres)
- JWT for auth
- node-cron for scheduled jobs
- axios (HTTP requests for APIs)
- open-graph-scraper (fetch link metadata)
- ws (WebSocket)

**Frontend:**
- Next.js 14+ (App Router)
- React
- **React Query (TanStack Query)** — Data fetching & caching
- TailwindCSS (styling)
- recharts (habit progress charts)
- socket.io-client (WebSocket)

**External APIs:**
- OpenGraph (auto-fetch)
- TMDB (movies)
- IGDB (games)
- Nodemailer (email)

---

## ✅ What You'll Learn

- **Express fundamentals**: Routing, middleware, error handling
- **Database design**: Relationships (users → collections → items)
- **Auth**: JWT tokens, password hashing
- **Integrations**: Third-party APIs, scraping
- **Real-time**: WebSockets for live updates
- **Background jobs**: Cron tasks (habit streak checks)
- **Permissions**: Sharing, access control
- **React Query**: Data fetching, caching, mutations, query invalidation (modern React)
- **Frontend**: Forms, state management with hooks, custom hooks

---

## 🚀 Getting Started

Start with **Phase 1**. Don't touch integrations until core CRUD works.

Next: Read `ARCHITECTURE.md` for detailed breakdown.
