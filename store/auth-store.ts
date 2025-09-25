import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState, useEffect, useCallback, useMemo } from "react";
import { authAPI, type LoginRequest, type RegisterRequest } from "@/services/api";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  isAdmin: boolean;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }) => Promise<void>;
  logout: () => void;
}

export const [AuthProvider, useAuth] = createContextHook<AuthState>(() => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadStoredUser = useCallback(async () => {
    try {
      const storedUser = await AsyncStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Error loading stored user:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStoredUser();
  }, [loadStoredUser]);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const loginData: LoginRequest = { email, password };
      const { access, refresh, user: apiUser } = await authAPI.login(loginData);
  
      await AsyncStorage.multiSet([
        ["access_token", access],
        ["refresh_token", refresh],
        ["user", JSON.stringify(apiUser)],
      ]);
  
      const user: User = {
        id: apiUser.id,
        name: apiUser.name,
        email: apiUser.email,
        phone: apiUser.phone,
        isAdmin: apiUser.is_admin,
      };
  
      setUser(user);
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const register = useCallback(async (userData: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }) => {
    setIsLoading(true);
    try {
      const { access, refresh, user: apiUser } = await authAPI.register(userData);
  
      await AsyncStorage.multiSet([
        ["access_token", access],
        ["refresh_token", refresh],
        ["user", JSON.stringify(apiUser)],
      ]);
  
      const user: User = {
        id: apiUser.id,
        name: apiUser.name,
        email: apiUser.email,
        phone: apiUser.phone,
        isAdmin: apiUser.is_admin,
      };
  
      setUser(user);
    } catch (error) {
      console.error("Registration error:", error);
      if (__DEV__) {
        const newUser: User = {
          id: "user_" + Date.now(),
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          isAdmin: false,
        };
        await AsyncStorage.setItem("user", JSON.stringify(newUser));
        setUser(newUser);
      } else {
        throw error;
      }
    } finally {
      setIsLoading(false);
    }
  }, []);
  

  const logout = useCallback(async () => {
    try {
      await AsyncStorage.multiRemove(['user', 'access_token', 'refresh_token']);
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  }, []);

  return useMemo(() => ({
    user,
    isLoading,
    login,
    register,
    logout,
  }), [user, isLoading, login, register, logout]);
});