// src/services/api.js

import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://100.116.170.3:8000/api",
  headers: {
    Accept: "application/json",
  },
  withCredentials: true,
  timeout: 30000,
});

// ✅ Injecte automatiquement le token Bearer sur chaque requête
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;