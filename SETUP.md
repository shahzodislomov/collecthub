# Setup: CollectHub Project

Getting your project running locally, step by step.

---

## 🔧 Prerequisites

- **Node.js** 18+ ([download](https://nodejs.org/))
- **PostgreSQL** installed and running ([download](https://www.postgresql.org/download/))
- **Code editor** (VS Code recommended)

---

## 📦 Step 1: Create Project Structure

```bash
mkdir collecthub
cd collecthub

# Create backend and frontend directories
mkdir backend frontend
```

---

## 🗄️ Step 2: Set Up PostgreSQL Database

**Create a database:**

```bash
# Open PostgreSQL CLI
psql -U postgres

# Inside psql:
CREATE DATABASE collecthub_db;
\q
```

**Or via GUI (pgAdmin):**
- Open pgAdmin, right-click "Databases" → Create → Database
- Name: `collecthub_db`

---

## 🖥️ Step 3: Backend Setup (Express)

```bash
cd backend

# Initialize Node project
npm init -y

# Install dependencies
npm install express cors dotenv @prisma/client axios cheerio jsonwebtoken bcrypt
npm install --save-dev nodemon

# Initialize Prisma
npx prisma init
```

**Create `.env` file:**

```
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/collecthub_db"
JWT_SECRET="your_super_secret_jwt_key_here_change_this"
PORT=5000
```

**Update `package.json` scripts:**

```json
{
  "scripts": {
    "dev": "nodemon src/index.js",
    "start": "node src/index.js",
    "migrate": "npx prisma migrate dev"
  }
}
```

**Create folder structure:**

```bash
mkdir -p src/routes src/controllers src/services src/middleware config
touch src/index.js config/db.js
```

---

## 🗄️ Step 4: Set Up Prisma Schema

**Update `prisma/schema.prisma`:**

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
  createdAt    DateTime @default(now())

  collections Collection[]
  items       Item[]
  reviews     Review[]
  follows     Follow[]  @relation("follower")
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

  items Item[]
}

model Item {
  id           Int      @id @default(autoincrement())
  collectionId Int
  collection   Collection @relation(fields: [collectionId], references: [id], onDelete: Cascade)
  userId       Int
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  title        String
  description  String?
  type         String
  url          String?
  imageUrl     String?
  metadata     Json?
  status       String?
  createdAt    DateTime @default(now())

  reviews Review[]
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
}

model Follow {
  id          Int @id @default(autoincrement())
  followerId  Int
  follower    User @relation("follower", fields: [followerId], references: [id], onDelete: Cascade)
  followingId Int
  following   User @relation("following", fields: [followingId], references: [id], onDelete: Cascade)

  @@unique([followerId, followingId])
}
```

**Run migrations:**

```bash
npx prisma migrate dev --name init
```

This creates the database tables. You'll be prompted to name the migration (e.g., "init").

---

## 🚀 Step 5: Backend Entry Point

**Create `src/index.js`:**

```javascript
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes (we'll add these next)
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
```

**Start backend:**

```bash
npm run dev
```

Visit `http://localhost:5000/api/health` — should see `{ "status": "OK" }`

---

## 🎨 Step 6: Frontend Setup (Next.js)

```bash
cd ../frontend

# Create Next.js project
npx create-next-app@latest . --tailwind --typescript

# Install dependencies
npm install @tanstack/react-query
```

When prompted:
- Use TypeScript? **Yes**
- Use ESLint? **Yes**
- Use Tailwind CSS? **Yes**
- Use App Router? **Yes**

**Create `.env.local`:**

```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

**Create folder structure:**

```bash
mkdir -p lib hooks components/{auth,items,collections}
```

---

## 🔗 Step 7: Setup React Query Provider

**Create `app/providers.tsx`:**

```typescript
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

**Update `app/layout.tsx`:**

```typescript
import { Providers } from './providers';
import './globals.css';

export const metadata = {
  title: 'CollectHub',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

---

## 🔗 Step 8: API Client (`lib/api.ts`)

**Create `lib/api.ts`:**

```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const getToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
};

export const apiClient = async (
  endpoint: string,
  options: RequestInit = {}
) => {
  const token = getToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'API Error');
  }

  return response.json();
};

// Helper methods
export const api = {
  health: () => apiClient('/health'),
  
  items: {
    get: (id: number) => apiClient(`/items/${id}`),
    create: (data: any) => apiClient('/items', { method: 'POST', body: JSON.stringify(data) }),
    getByCollection: (collectionId: number) => apiClient(`/items/collection/${collectionId}`),
  },

  collections: {
    list: () => apiClient('/collections'),
    get: (id: number) => apiClient(`/collections/${id}`),
    create: (data: any) => apiClient('/collections', { method: 'POST', body: JSON.stringify(data) }),
  },

  auth: {
    login: (email: string, password: string) => 
      apiClient('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    signup: (username: string, email: string, password: string) => 
      apiClient('/auth/signup', { method: 'POST', body: JSON.stringify({ username, email, password }) }),
  },
};
```

**Test it: Create `app/page.tsx`:**

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export default function Home() {
  const { data: health, isLoading, error } = useQuery({
    queryKey: ['health'],
    queryFn: () => api.health(),
  });

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">CollectHub</h1>
        
        {isLoading && <p className="text-xl">Checking backend...</p>}
        
        {error && (
          <p className="text-xl text-red-500">
            Error: Backend not responding
          </p>
        )}
        
        {health && (
          <p className="text-xl text-green-600">
            ✅ Backend Status: {health.status}
          </p>
        )}
      </div>
    </div>
  );
}
```

**Create folder structure for hooks:**

```bash
mkdir -p lib hooks/useAuth hooks/useItems hooks/useCollections
```

**Start frontend:**

```bash
npm run dev
```

Visit `http://localhost:3000` — should see "✅ Backend Status: OK"

---

## ✅ Step 9: Verify Everything Works

**Checklist:**

- [ ] Backend running on `http://localhost:5000`
- [ ] Frontend running on `http://localhost:3000`
- [ ] Database created in PostgreSQL
- [ ] API client connects (see status on page)
- [ ] JWT_SECRET set in `.env`

---

## 🎯 Next Steps (What to Build First)

### **Priority 1: Auth Routes (Week 1)**

Create `src/routes/auth.js` and `src/controllers/authController.js`:

```javascript
// Create signup & login endpoints
// Hash passwords with bcrypt
// Return JWT token on successful login
// Store JWT in localStorage on frontend
```

**Steps:**
1. Create signup endpoint (POST `/api/auth/signup`)
2. Create login endpoint (POST `/api/auth/login`)
3. Create frontend auth pages (Login, Signup)
4. Add useAuth hook for state

### **Priority 2: Collections & Items (Week 2)**

```javascript
// Create collection CRUD
// Create item CRUD (with type: 'link', 'habit', 'movie', 'game')
// Test with Postman or Thunder Client
```

### **Priority 3: Dashboard (Week 3)**

```
// List user's collections
// List items in collection
// Show collections on homepage
```

---

## 🧪 Testing with Postman

Download [Postman](https://www.postman.com/downloads/) to test API endpoints manually.

**Example request:**

```
POST http://localhost:5000/api/auth/signup
Content-Type: application/json

{
  "username": "alice",
  "email": "alice@example.com",
  "password": "password123"
}
```

---

## 📝 Useful Commands

```bash
# Backend
cd backend
npm run dev          # Start development server
npm run migrate      # Run Prisma migrations
npx prisma studio   # Open Prisma GUI (see database)

# Frontend
cd frontend
npm run dev          # Start dev server
npm run build        # Build for production
```

---

## 🐛 Common Issues

**"Cannot find module"**
- Run `npm install` in the relevant folder

**"Connection refused" on database**
- Check PostgreSQL is running
- Check `DATABASE_URL` in `.env` matches your setup
- Try `psql -U postgres` to verify connection

**"Port 3000/5000 already in use"**
- Kill process: `lsof -ti :3000 | xargs kill -9`
- Or change PORT in `.env`

**CORS error in browser console**
- Check backend `.env` has correct `DATABASE_URL`
- Restart backend server

---

## 📚 Next Documents

- **DATABASE.md** — Full schema explanation
- **ARCHITECTURE.md** — Code patterns and structure
- **PROJECT_ROADMAP.md** — Phases and features

Start with Priority 1, then read ARCHITECTURE.md for how to structure your code.

Good luck! 🚀
