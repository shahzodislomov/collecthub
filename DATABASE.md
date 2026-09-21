# Database Schema: CollectHub

Using **PostgreSQL** with `prisma` as ORM (optional but recommended).

---

## 📊 Core Tables

### **users**
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  passwordHash VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(500),
  bio TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Why:** Store user accounts, authentication.

---

### **collections**
```sql
CREATE TABLE collections (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Why:** Users group items into collections (e.g., "Cyber Security Reading", "2024 Habits", "Want to Watch").

**Index:** `CREATE INDEX idx_collections_user_id ON collections(user_id);`

---

### **items**
```sql
CREATE TABLE items (
  id SERIAL PRIMARY KEY,
  collection_id INT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL,  -- 'link', 'habit', 'movie', 'game'
  url VARCHAR(1000),           -- for links, movies, games (TMDB/IGDB link)
  image_url VARCHAR(1000),     -- auto-fetched or user-uploaded
  metadata JSONB,              -- flexible: { releaseDate, genres, rating, etc }
  status VARCHAR(50),          -- for habits/watchlists: 'active', 'completed', 'dropped'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Why:** Universal container for all content types (links, habits, media).

**Metadata examples:**
```json
// Link
{ "favicon": "https://...", "domain": "example.com" }

// Movie
{ "tmdb_id": 12345, "release_date": "2024-01-15", "genres": ["Action", "Sci-Fi"], "rating": 8.2 }

// Habit
{ "frequency": "daily", "category": "fitness" }

// Game
{ "igdb_id": 54321, "platform": "PC", "rating": 9.1 }
```

**Indexes:**
```sql
CREATE INDEX idx_items_collection_id ON items(collection_id);
CREATE INDEX idx_items_user_id ON items(user_id);
CREATE INDEX idx_items_type ON items(type);
```

---

### **reviews** (comments on any item)
```sql
CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  item_id INT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INT CHECK (rating >= 1 AND rating <= 5),  -- optional 1-5 star rating
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Why:** Users can review/comment on any item (link, habit, movie, game).

**Index:** `CREATE INDEX idx_reviews_item_id ON reviews(item_id);`

---

### **habit_logs** (daily tracking for habits)
```sql
CREATE TABLE habit_logs (
  id SERIAL PRIMARY KEY,
  item_id INT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  note TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(item_id, log_date)  -- one log per habit per day
);
```

**Why:** Track daily habit completion (streak calculation depends on this).

**Index:**
```sql
CREATE INDEX idx_habit_logs_item_id ON habit_logs(item_id);
CREATE INDEX idx_habit_logs_user_id ON habit_logs(user_id);
CREATE INDEX idx_habit_logs_log_date ON habit_logs(log_date);
```

---

### **follows** (social graph)
```sql
CREATE TABLE follows (
  id SERIAL PRIMARY KEY,
  follower_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);
```

**Why:** Users follow each other to see activity feeds.

**Indexes:**
```sql
CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);
```

---

### **shares** (collection permissions)
```sql
CREATE TABLE shares (
  id SERIAL PRIMARY KEY,
  collection_id INT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  shared_with_user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission VARCHAR(50) NOT NULL,  -- 'view', 'edit'
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(collection_id, shared_with_user_id)
);
```

**Why:** Share collections with specific users with read or edit access.

**Index:** `CREATE INDEX idx_shares_collection ON shares(collection_id);`

---

## 🔗 Entity Relationships

```
users
  ├─ collections (1 → many)
  │   └─ items (1 → many)
  │       ├─ reviews (1 → many)
  │       └─ habit_logs (1 → many, only for habits)
  ├─ follows (many → many via follows table)
  ├─ reviews (1 → many)
  └─ habit_logs (1 → many)

shares (permissions bridge)
  └─ collection_id → collections
  └─ shared_with_user_id → users
```

---

## 📈 Example Data Flow

**User Alice adds a link to a collection:**
```
1. Alice (user_id = 1) creates a collection: "Research Papers"
   INSERT INTO collections VALUES (1, 1, "Research Papers", null, true, ...)

2. Alice adds a link to that collection
   INSERT INTO items VALUES (
     1,  -- item_id
     1,  -- collection_id
     1,  -- user_id (Alice)
     'How to Learn Hacking',
     'Great intro guide',
     'link',
     'https://example.com/guide',
     'https://example.com/og-image.jpg',
     { "favicon": "...", "domain": "example.com" },
     null,  -- status only for habits/watchlists
     ...
   )

3. Bob follows Alice
   INSERT INTO follows VALUES (2, 1)  -- Bob (2) follows Alice (1)

4. Bob sees Alice's public collections in activity feed

5. Bob reviews the link
   INSERT INTO reviews VALUES (
     1,  -- review_id
     1,  -- item_id
     2,  -- user_id (Bob)
     5,  -- rating
     'Super helpful!',
     ...
   )
```

---

## 🎯 Queries You'll Need

**Get all items in a collection:**
```sql
SELECT * FROM items WHERE collection_id = $1 ORDER BY created_at DESC;
```

**Get activity feed (items from users you follow):**
```sql
SELECT i.*, u.username FROM items i
JOIN users u ON i.user_id = u.id
JOIN follows f ON u.id = f.following_id
WHERE f.follower_id = $1 AND i.collection_id IN (SELECT id FROM collections WHERE is_public = true)
ORDER BY i.created_at DESC;
```

**Calculate habit streak (consecutive days):**
```sql
SELECT COUNT(*) as streak FROM habit_logs
WHERE item_id = $1 AND completed = true
AND log_date >= (CURRENT_DATE - INTERVAL '90 days')
ORDER BY log_date DESC;
```

**Leaderboard (users with longest streaks):**
```sql
SELECT u.id, u.username, MAX(streak) as longest_streak
FROM (
  SELECT item_id, user_id, COUNT(*) as streak
  FROM habit_logs
  WHERE completed = true
  GROUP BY item_id, user_id
) sub
JOIN items i ON sub.item_id = i.id
JOIN users u ON sub.user_id = u.id
WHERE i.type = 'habit'
GROUP BY u.id, u.username
ORDER BY longest_streak DESC LIMIT 10;
```

---

## 🛠️ Setting Up with Prisma (Recommended)

**Install:**
```bash
npm install @prisma/client
npm install -D prisma
npx prisma init
```

**prisma/schema.prisma:**
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id           Int      @id @default(autoincrement())
  username     String   @unique
  email        String   @unique
  passwordHash String
  avatarUrl    String?
  bio          String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  collections Collection[]
  items       Item[]
  reviews     Review[]
  habitLogs   HabitLog[]
  followers   Follow[]  @relation("follower")
  following   Follow[]  @relation("following")
}

model Collection {
  id          Int      @id @default(autoincrement())
  userId      Int
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  name        String
  description String?
  isPublic    Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  items  Item[]
  shares Share[]
}

model Item {
  id           Int      @id @default(autoincrement())
  collectionId Int
  collection   Collection @relation(fields: [collectionId], references: [id], onDelete: Cascade)
  userId       Int
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  title        String
  description  String?
  type         String   -- 'link', 'habit', 'movie', 'game'
  url          String?
  imageUrl     String?
  metadata     Json?
  status       String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  reviews   Review[]
  habitLogs HabitLog[]

  @@index([collectionId])
  @@index([userId])
}

model Review {
  id        Int      @id @default(autoincrement())
  itemId    Int
  item      Item     @relation(fields: [itemId], references: [id], onDelete: Cascade)
  userId    Int
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  rating    Int?
  content   String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([itemId])
}

model HabitLog {
  id        Int      @id @default(autoincrement())
  itemId    Int
  item      Item     @relation(fields: [itemId], references: [id], onDelete: Cascade)
  userId    Int
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  logDate   DateTime
  completed Boolean  @default(false)
  note      String?
  createdAt DateTime @default(now())

  @@unique([itemId, logDate])
  @@index([itemId])
  @@index([userId])
}

model Follow {
  id           Int      @id @default(autoincrement())
  followerId   Int
  follower     User     @relation("follower", fields: [followerId], references: [id], onDelete: Cascade)
  followingId  Int
  following    User     @relation("following", fields: [followingId], references: [id], onDelete: Cascade)
  createdAt    DateTime @default(now())

  @@unique([followerId, followingId])
  @@index([followerId])
  @@index([followingId])
}

model Share {
  id             Int      @id @default(autoincrement())
  collectionId   Int
  collection     Collection @relation(fields: [collectionId], references: [id], onDelete: Cascade)
  sharedWithId   Int
  sharedWith     User     @relation(fields: [sharedWithId], references: [id], onDelete: Cascade)
  permission     String   -- 'view', 'edit'
  createdAt      DateTime @default(now())

  @@unique([collectionId, sharedWithId])
  @@index([collectionId])
}
```

**Run migrations:**
```bash
npx prisma migrate dev --name init
```

---

## 📌 Notes

- **JSONB for metadata** keeps schema flexible for different item types
- **Indexes on foreign keys** speed up queries (critical for performance)
- **CASCADE deletes** ensure data cleanup (if user deleted, their items/reviews gone)
- **UNIQUE constraints** prevent duplicates (one follow per pair, one log per day)

Next: See `ARCHITECTURE.md` for backend/frontend patterns.
