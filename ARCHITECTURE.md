# Architecture: CollectHub Backend & Frontend

---

## 🏗️ Backend Architecture (Express)

### **Layered Pattern**

```
Request → Middleware (auth, validation) → Route → Controller → Service → Database
Response ←
```

---

## 📂 Backend Structure Explained

### **1. Entry Point: `src/index.js`**

```javascript
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const itemRoutes = require('./routes/items');
const collectionRoutes = require('./routes/collections');
const userRoutes = require('./routes/users');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/users', userRoutes);

// Error handler (always last)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

**Why this structure?**
- Separates concerns (each route file handles one domain)
- Middleware centralized at top
- Error handler at bottom catches everything

---

### **2. Auth Middleware: `src/middleware/auth.js`**

```javascript
const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user; // { id: 1, username: 'alice' }
    next();
  });
};

module.exports = { authenticateToken };
```

**Usage in routes:**
```javascript
const { authenticateToken } = require('../middleware/auth');

router.get('/me', authenticateToken, getUserProfile);
```

Now every protected route has `req.user` available.

---

### **3. Routes: `src/routes/items.js`**

```javascript
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  createItem,
  getItem,
  updateItem,
  deleteItem,
  getCollectionItems,
} = require('../controllers/itemController');

// POST /api/items (create)
router.post('/', authenticateToken, createItem);

// GET /api/items/:id (read one)
router.get('/:id', authenticateToken, getItem);

// PUT /api/items/:id (update)
router.put('/:id', authenticateToken, updateItem);

// DELETE /api/items/:id (delete)
router.delete('/:id', authenticateToken, deleteItem);

// GET /api/items/collection/:collectionId (read all in collection)
router.get('/collection/:collectionId', getCollectionItems);

module.exports = router;
```

**Why this structure?**
- Routes define endpoints but don't do business logic
- Logic lives in controllers
- Middleware protects routes that need auth

---

### **4. Controllers: `src/controllers/itemController.js`**

Controllers handle **request validation** and **call services**:

```javascript
const itemService = require('../services/itemService');
const ogScraper = require('../services/ogScraper');

const createItem = async (req, res, next) => {
  try {
    const { collectionId, title, type, url, description } = req.body;
    const userId = req.user.id;

    // Validate
    if (!title || !type) {
      return res.status(400).json({ error: 'Missing title or type' });
    }

    let metadata = {};
    if (type === 'link' && url) {
      // Auto-fetch metadata
      metadata = await ogScraper.fetchMetadata(url);
    }

    const item = await itemService.createItem({
      collectionId,
      userId,
      title,
      type,
      url,
      description,
      metadata,
    });

    res.status(201).json(item);
  } catch (error) {
    next(error); // Pass to error handler middleware
  }
};

const getItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = await itemService.getItem(id);
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json(item);
  } catch (error) {
    next(error);
  }
};

const updateItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { title, description, status } = req.body;

    const item = await itemService.updateItem(id, userId, {
      title,
      description,
      status,
    });

    res.json(item);
  } catch (error) {
    next(error);
  }
};

const deleteItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await itemService.deleteItem(id, userId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

const getCollectionItems = async (req, res, next) => {
  try {
    const { collectionId } = req.params;
    const { type, tag } = req.query; // filtering

    const items = await itemService.getCollectionItems(collectionId, {
      type,
      tag,
    });

    res.json(items);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createItem,
  getItem,
  updateItem,
  deleteItem,
  getCollectionItems,
};
```

**What controllers do:**
- Extract request data
- Validate input
- Call service layer
- Return response or pass error to middleware

---

### **5. Services: `src/services/itemService.js`**

Services handle **business logic** and **database queries**:

```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const createItem = async (data) => {
  const { collectionId, userId, title, type, url, description, metadata } = data;

  // Check collection exists and belongs to user
  const collection = await prisma.collection.findUnique({
    where: { id: collectionId },
  });

  if (!collection) {
    throw { status: 404, message: 'Collection not found' };
  }

  if (collection.userId !== userId) {
    throw { status: 403, message: 'Unauthorized' };
  }

  const item = await prisma.item.create({
    data: {
      collectionId,
      userId,
      title,
      type,
      url,
      description,
      metadata,
      status: type === 'habit' ? 'active' : null, // habits default to active
    },
  });

  return item;
};

const getItem = async (id) => {
  return prisma.item.findUnique({
    where: { id },
    include: {
      reviews: true,
      habitLogs: true, // if it's a habit
    },
  });
};

const updateItem = async (id, userId, data) => {
  const item = await prisma.item.findUnique({ where: { id } });

  if (!item) {
    throw { status: 404, message: 'Item not found' };
  }

  // Only owner can edit
  if (item.userId !== userId) {
    throw { status: 403, message: 'Unauthorized' };
  }

  return prisma.item.update({
    where: { id },
    data,
  });
};

const deleteItem = async (id, userId) => {
  const item = await prisma.item.findUnique({ where: { id } });

  if (!item) {
    throw { status: 404, message: 'Item not found' };
  }

  if (item.userId !== userId) {
    throw { status: 403, message: 'Unauthorized' };
  }

  return prisma.item.delete({ where: { id } });
};

const getCollectionItems = async (collectionId, filters = {}) => {
  let whereClause = { collectionId };

  if (filters.type) {
    whereClause.type = filters.type;
  }

  return prisma.item.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    include: {
      reviews: true,
    },
  });
};

module.exports = {
  createItem,
  getItem,
  updateItem,
  deleteItem,
  getCollectionItems,
};
```

**What services do:**
- Query database
- Apply business logic
- Handle permissions/authorization
- Return data or throw errors (with status)

---

### **6. OG Scraper Service: `src/services/ogScraper.js`**

```javascript
const axios = require('axios');
const cheerio = require('cheerio');

const fetchMetadata = async (url) => {
  try {
    const { data } = await axios.get(url, { timeout: 5000 });
    const $ = cheerio.load(data);

    const title = $('meta[property="og:title"]').attr('content') || $('title').text();
    const image = $('meta[property="og:image"]').attr('content');
    const description = $('meta[property="og:description"]').attr('content') || 
                       $('meta[name="description"]').attr('content');

    // Extract domain
    const urlObj = new URL(url);
    const domain = urlObj.hostname;

    return {
      title,
      image,
      description,
      domain,
      url,
    };
  } catch (error) {
    console.error(`Failed to scrape ${url}:`, error.message);
    return { domain: new URL(url).hostname }; // Fallback
  }
};

module.exports = { fetchMetadata };
```

**When to use:** Controller calls this when user adds a link.

---

## 🎨 Frontend Architecture (Next.js)

### **Structure**

```
frontend/
├── app/                  (Pages)
│   ├── page.tsx          (Dashboard)
│   ├── auth/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── items/
│   │   ├── [id]/page.tsx
│   │   └── new/page.tsx
│   └── ...
├── components/           (Reusable UI)
│   ├── ItemCard.tsx
│   ├── CollectionList.tsx
│   └── ...
├── lib/
│   ├── api.ts            (API client)
│   └── auth.ts           (JWT handling)
└── hooks/                (Custom hooks)
    ├── useAuth.ts
    └── useItems.ts
```

---

### **API Client: `lib/api.ts`**

This is now just the raw HTTP layer. React Query handles caching and state.

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
  items: {
    get: (id: number) => apiClient(`/items/${id}`),
    create: (data: any) => apiClient('/items', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: any) => apiClient(`/items/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => apiClient(`/items/${id}`, { method: 'DELETE' }),
    getByCollection: (collectionId: number) => apiClient(`/items/collection/${collectionId}`),
  },

  collections: {
    list: () => apiClient('/collections'),
    get: (id: number) => apiClient(`/collections/${id}`),
    create: (data: any) => apiClient('/collections', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: any) => apiClient(`/collections/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => apiClient(`/collections/${id}`, { method: 'DELETE' }),
  },

  auth: {
    login: (email: string, password: string) => 
      apiClient('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    signup: (username: string, email: string, password: string) => 
      apiClient('/auth/signup', { method: 'POST', body: JSON.stringify({ username, email, password }) }),
  },

  users: {
    getProfile: (userId: number) => apiClient(`/users/${userId}`),
    follow: (userId: number) => apiClient(`/users/${userId}/follow`, { method: 'POST' }),
  },
};
```

---

### **Query Provider Setup: `app/providers.tsx`**

Wrap your app with QueryClientProvider:

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

**In `app/layout.tsx`:**

```typescript
import { Providers } from './providers';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

---

### **Hooks with React Query**

#### **`hooks/useItems.ts`**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export const useItems = (collectionId: number) => {
  return useQuery({
    queryKey: ['items', collectionId],
    queryFn: () => api.items.getByCollection(collectionId),
  });
};

export const useItem = (itemId: number) => {
  return useQuery({
    queryKey: ['items', itemId],
    queryFn: () => api.items.get(itemId),
  });
};

export const useCreateItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => api.items.create(data),
    onSuccess: (newItem) => {
      // Invalidate collection items query so it refetches
      queryClient.invalidateQueries({
        queryKey: ['items', newItem.collectionId],
      });
      // Also add to cache directly
      queryClient.setQueryData(['items', newItem.id], newItem);
    },
  });
};

export const useUpdateItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      api.items.update(id, data),
    onSuccess: (updatedItem) => {
      queryClient.setQueryData(['items', updatedItem.id], updatedItem);
      queryClient.invalidateQueries({
        queryKey: ['items', updatedItem.collectionId],
      });
    },
  });
};

export const useDeleteItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: number) => api.items.delete(itemId),
    onSuccess: (_, itemId) => {
      queryClient.removeQueries({
        queryKey: ['items', itemId],
      });
      queryClient.invalidateQueries({
        queryKey: ['items'],
      });
    },
  });
};
```

#### **`hooks/useCollections.ts`**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export const useCollections = () => {
  return useQuery({
    queryKey: ['collections'],
    queryFn: () => api.collections.list(),
  });
};

export const useCollection = (collectionId: number) => {
  return useQuery({
    queryKey: ['collections', collectionId],
    queryFn: () => api.collections.get(collectionId),
  });
};

export const useCreateCollection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => api.collections.create(data),
    onSuccess: (newCollection) => {
      queryClient.invalidateQueries({
        queryKey: ['collections'],
      });
    },
  });
};

export const useUpdateCollection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      api.collections.update(id, data),
    onSuccess: (updatedCollection) => {
      queryClient.setQueryData(
        ['collections', updatedCollection.id],
        updatedCollection
      );
      queryClient.invalidateQueries({
        queryKey: ['collections'],
      });
    },
  });
};

export const useDeleteCollection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (collectionId: number) => api.collections.delete(collectionId),
    onSuccess: (_, collectionId) => {
      queryClient.removeQueries({
        queryKey: ['collections', collectionId],
      });
      queryClient.invalidateQueries({
        queryKey: ['collections'],
      });
    },
  });
};
```

#### **`hooks/useAuth.ts`**

```typescript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

// Atom-like state for current user (or use localStorage)
const getAuthUser = () => {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem('authUser');
  return stored ? JSON.parse(stored) : null;
};

export const useAuth = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: user, isLoading } = useQuery({
    queryKey: ['auth', 'user'],
    queryFn: () => getAuthUser(),
    staleTime: Infinity, // User data doesn't go stale
  });

  const loginMutation = useMutation({
    mutationFn: (credentials: { email: string; password: string }) =>
      api.auth.login(credentials.email, credentials.password),
    onSuccess: (response) => {
      localStorage.setItem('token', response.token);
      localStorage.setItem('authUser', JSON.stringify(response.user));
      queryClient.setQueryData(['auth', 'user'], response.user);
      router.push('/');
    },
  });

  const signupMutation = useMutation({
    mutationFn: (data: { username: string; email: string; password: string }) =>
      api.auth.signup(data.username, data.email, data.password),
    onSuccess: (response) => {
      localStorage.setItem('token', response.token);
      localStorage.setItem('authUser', JSON.stringify(response.user));
      queryClient.setQueryData(['auth', 'user'], response.user);
      router.push('/');
    },
  });

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('authUser');
    queryClient.setQueryData(['auth', 'user'], null);
    queryClient.clear();
    router.push('/auth/login');
  };

  return {
    user,
    isLoading,
    login: loginMutation.mutate,
    loginAsync: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    signup: signupMutation.mutate,
    signupAsync: signupMutation.mutateAsync,
    isSigningUp: signupMutation.isPending,
    signupError: signupMutation.error,
    logout,
    isAuthenticated: !!user,
  };
};
```

---

### **Page Example: `app/items/new/page.tsx`**

Using React Query for data fetching and mutations:

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCollections, useCreateItem } from '@/hooks/useItems';
import { useCollections } from '@/hooks/useCollections';

export default function NewItemPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    collectionId: '',
    title: '',
    type: 'link',
    type: 'link',
    url: '',
    description: '',
  });

  // Fetch collections
  const { data: collections, isLoading: isLoadingCollections } = useCollections();

  // Mutation for creating item
  const createItem = useCreateItem();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    if (!form.collectionId || !form.title) {
      alert('Collection and title required');
      return;
    }

    createItem.mutate(form, {
      onSuccess: () => {
        router.push('/');
      },
      onError: (error) => {
        alert(`Error: ${error.message}`);
      },
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Add New Item</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Collection</label>
          <select
            value={form.collectionId}
            onChange={(e) => setForm({ ...form, collectionId: e.target.value })}
            disabled={isLoadingCollections}
            className="w-full p-2 border rounded disabled:bg-gray-100"
          >
            <option value="">
              {isLoadingCollections ? 'Loading...' : 'Select Collection'}
            </option>
            {collections?.map((col: any) => (
              <option key={col.id} value={col.id}>
                {col.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input
            type="text"
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Type</label>
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="w-full p-2 border rounded"
          >
            <option value="link">Link</option>
            <option value="habit">Habit</option>
            <option value="movie">Movie</option>
            <option value="game">Game</option>
          </select>
        </div>

        {form.type === 'link' && (
          <div>
            <label className="block text-sm font-medium mb-1">URL</label>
            <input
              type="url"
              placeholder="https://example.com"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              className="w-full p-2 border rounded"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            placeholder="Add notes or description..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full p-2 border rounded"
            rows={4}
          />
        </div>

        <button
          type="submit"
          disabled={createItem.isPending}
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {createItem.isPending ? 'Creating...' : 'Create'}
        </button>

        {createItem.error && (
          <div className="p-3 bg-red-100 text-red-700 rounded">
            Error: {createItem.error.message}
          </div>
        )}
      </form>
    </div>
  );
}
```

---

## 🔄 Data Flow with React Query

**User creates a link item:**

1. **Frontend (Next.js):**
   - User fills form, clicks "Create"
   - Form calls `createItem.mutate(formData)`
   - React Query calls `api.items.create()` with data + JWT token
   
2. **React Query:**
   - Shows loading state (`createItem.isPending`)
   - Sends HTTP request

3. **Backend (Express):**
   - POST `/api/items` hits route handler
   - `authenticateToken` middleware extracts `req.user` from JWT
   - Controller validates input
   - Calls `ogScraper.fetchMetadata(url)` for metadata
   - Calls service to create in database
   - Returns item (201 status)

4. **React Query (onSuccess):**
   - Updates cache with new item: `queryClient.setQueryData(['items', itemId], newItem)`
   - Invalidates collection query: `queryClient.invalidateQueries(['items', collectionId])`
   - Collection list refetches automatically (background)
   - Form clears, redirects to dashboard

5. **UI Updates:**
   - `createItem.isPending` becomes false
   - New item appears in collection (from refetch)
   - User sees success immediately

**Key difference from plain fetch:**
- No manual state management (`loading`, `error`, `data`)
- Caching handled automatically
- Refetching on window focus/reconnect automatic
- Optimistic updates possible with `onMutate`

---

## 💡 Best Practices

**Backend:**
- Services contain business logic, controllers handle HTTP
- Always validate input in controllers
- Throw errors with status codes, let middleware handle them
- Use Prisma for type-safe database queries

**Frontend with React Query:**
- All HTTP calls go through `lib/api.ts`
- Each resource (items, collections, auth) gets its own hook file
- Use `useQuery` for fetching, `useMutation` for creating/updating/deleting
- Always invalidate related queries on mutation success
- Combine `setQueryData` (optimistic update) + `invalidateQueries` (refetch)
- Let React Query handle loading/error states — use `isPending`, `error` from hooks
- Store JWT in localStorage, include in every request via `apiClient`
- Set `staleTime` to avoid unnecessary refetches

**Query Key Convention:**
```typescript
// Single resource
queryKey: ['items', itemId]

// List
queryKey: ['items', collectionId]
queryKey: ['collections']

// Nested
queryKey: ['collections', collectionId, 'items']
queryKey: ['items', itemId, 'reviews']
```

This makes invalidation predictable:
```typescript
// Invalidate all item queries
queryClient.invalidateQueries({ queryKey: ['items'] })

// Invalidate items in one collection
queryClient.invalidateQueries({ queryKey: ['items', collectionId] })
```

---

## 📚 React Query Concepts You'll Use

**useQuery:** Fetch data (GET)
```typescript
const { data, isLoading, error, refetch } = useQuery({
  queryKey: ['items', collectionId],
  queryFn: () => api.items.getByCollection(collectionId),
});
```

**useMutation:** Create/update/delete (POST/PUT/DELETE)
```typescript
const mutation = useMutation({
  mutationFn: (data) => api.items.create(data),
  onSuccess: (newItem) => {
    queryClient.invalidateQueries({ queryKey: ['items', newItem.collectionId] });
  },
});

mutation.mutate(formData);
```

**Optimistic Update:** Show change instantly, revert if fails
```typescript
const mutation = useMutation({
  mutationFn: (newItem) => api.items.create(newItem),
  onMutate: async (newItem) => {
    // Cancel any outgoing queries
    await queryClient.cancelQueries({ queryKey: ['items', newItem.collectionId] });
    
    // Snapshot old data
    const previous = queryClient.getQueryData(['items', newItem.collectionId]);
    
    // Update cache optimistically
    queryClient.setQueryData(['items', newItem.collectionId], (old: any) => [
      ...old,
      newItem,
    ]);
    
    return { previous }; // Return for rollback
  },
  onError: (err, newItem, context: any) => {
    // Rollback on error
    queryClient.setQueryData(['items', newItem.collectionId], context.previous);
  },
  onSuccess: (data, newItem) => {
    // Update with real data from server
    queryClient.setQueryData(['items', newItem.collectionId], (old: any) =>
      old.map((item: any) => (item.id === undefined ? data : item))
    );
  },
});
```

Next: See `API_SPEC.md` for endpoint details (coming soon).
