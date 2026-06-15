import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const API_URL = 'http://127.0.0.1:8000/api';

// Create custom axios instance for the application
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Response interceptor to unwrap DRF paginated responses
api.interceptors.response.use(
  (response) => {
    if (response.data && typeof response.data === 'object' && Array.isArray(response.data.results)) {
      response.data = response.data.results;
    }
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);

  // Set up interceptor to inject Authorization header if token exists in memory
  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use(
      (config) => {
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.request.eject(requestInterceptor);
    };
  }, [token]);

  const login = async (username, password) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login/', { username, password });
      const { access } = response.data;
      setToken(access);
      
      // Decoded payload from JWT (we can get username/user_id from JWT or fetch user details)
      // For simplicity and richness, let's fetch profile/user info or decode the token
      // Let's decode token payload
      const base64Url = access.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(window.atob(base64));
      
      // Setup simple user object
      const loggedUser = {
        id: payload.user_id,
        username: username,
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`
      };
      
      setUser(loggedUser);
      setLoading(false);
      return { success: true };
    } catch (error) {
      setLoading(false);
      const errorMsg = error.response?.data?.detail || 'Credenciales inválidas o error de conexión.';
      return { success: false, error: errorMsg };
    }
  };

  const register = async (username, email, password, avatarUrl) => {
    setLoading(true);
    try {
      const avatar = avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`;
      await api.post('/auth/register/', {
        username,
        email,
        password,
        avatar
      });
      setLoading(false);
      return { success: true };
    } catch (error) {
      setLoading(false);
      let errorMsg = 'Error en el registro.';
      if (error.response?.data) {
        const errors = error.response.data;
        if (errors.username) errorMsg = `Usuario: ${errors.username[0]}`;
        else if (errors.email) errorMsg = `Email: ${errors.email[0]}`;
        else if (errors.password) errorMsg = `Contraseña: ${errors.password[0]}`;
      }
      return { success: false, error: errorMsg };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};
