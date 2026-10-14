import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const getToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
};

export const apiClient = async (
  endpoint: string,
  options: RequestInit = {}
) => {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const response = await fetch(`${API_BASE}${cleanEndpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Something went wrong" }));
    throw new Error(error.message || "Something went wrong");
  }

  return response.json();
};

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Structured helpers attached to api (supports string UUIDs & numbers)
export const apiHelpers = {
  items: {
    get: (id: string | number) => apiClient(`/item/${id}`),
    create: (data: any) => apiClient("/create", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string | number, data: any) => apiClient(`/item/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: string | number) => apiClient(`/item/${id}`, { method: "DELETE" }),
    getByCollection: (collectionId: string | number) => apiClient(`/collections/${collectionId}`),
  },
  collections: {
    list: () => apiClient("/collections"),
    get: (id: string | number) => apiClient(`/collections/${id}`),
    create: (data: any) => apiClient("/collections", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string | number, data: any) => apiClient(`/collections/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: string | number) => apiClient(`/collections/${id}`, { method: "DELETE" }),
  },
  auth: {
    login: (email: string, password: string) =>
      apiClient("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
    signup: (username: string, email: string, password: string) =>
      apiClient("/auth/signup", { method: "POST", body: JSON.stringify({ username, email, password }) }),
    me: () => apiClient("/auth/me"),
  },
  users: {
    getProfile: (userId: string | number) => apiClient(`/users/${userId}`),
    follow: (userId: string | number) => apiClient(`/users/${userId}/follow`, { method: "POST" }),
  },
};

Object.assign(api, apiHelpers);