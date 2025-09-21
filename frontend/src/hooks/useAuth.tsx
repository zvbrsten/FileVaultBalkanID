import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useMutation, useQuery, useApolloClient } from '@apollo/client';
import { LOGIN_USER, REGISTER_USER, GET_ME } from '../api/queries';

interface User {
  id: string;
  email: string;
  username: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const client = useApolloClient();

  const [loginMutation] = useMutation(LOGIN_USER);
  const [registerMutation] = useMutation(REGISTER_USER);

  const { data: meData, loading: meLoading } = useQuery(GET_ME, {
    skip: !localStorage.getItem('token'),
    onError: async (error) => {
      console.error('Authentication error:', error);
      // Clear cache and reset auth state on error
      try {
        await client.clearStore();
      } catch (clearError) {
        console.error('Error clearing cache:', clearError);
      }
      localStorage.removeItem('token');
      setUser(null);
    },
  });

  useEffect(() => {
    if (meData?.me) {
      setUser(meData.me);
    }
    setLoading(meLoading);
  }, [meData, meLoading]);

  // Clear cache on app load if no token exists
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      client.clearStore().catch(console.error);
    }
  }, [client]);

  const login = async (email: string, password: string) => {
    try {
      // Clear any existing cache before login to prevent data leakage
      await client.clearStore();
      
      const { data } = await loginMutation({
        variables: { email, password },
      });
      
      if (data?.loginUser) {
        localStorage.setItem('token', data.loginUser.token);
        setUser(data.loginUser.user);
        
        // Refetch user data to ensure we have the latest information
        await client.refetchQueries({
          include: [GET_ME]
        });
        
        console.log('User logged in successfully:', data.loginUser.user.username);
        console.log('Cache cleared and fresh data loaded');
      }
    } catch (error) {
      console.error('Login error:', error);
      // Clear cache on login error as well
      await client.clearStore().catch(console.error);
      throw error;
    }
  };

  const register = async (email: string, username: string, password: string) => {
    try {
      // Clear any existing cache before registration to prevent data leakage
      await client.clearStore();
      
      const { data } = await registerMutation({
        variables: { email, username, password },
      });
      
      if (data?.registerUser) {
        localStorage.setItem('token', data.registerUser.token);
        setUser(data.registerUser.user);
        
        // Refetch user data to ensure we have the latest information
        await client.refetchQueries({
          include: [GET_ME]
        });
        
        console.log('User registered successfully:', data.registerUser.user.username);
        console.log('Cache cleared and fresh data loaded');
      }
    } catch (error) {
      console.error('Register error:', error);
      // Clear cache on registration error as well
      await client.clearStore().catch(console.error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Clear the Apollo Client cache to remove all cached data
      await client.clearStore();
      
      // Remove the token from localStorage
      localStorage.removeItem('token');
      
      // Clear the user state
      setUser(null);
      
      console.log('User logged out successfully and cache cleared');
    } catch (error) {
      console.error('Error during logout:', error);
      // Even if cache clearing fails, still remove token and user
      localStorage.removeItem('token');
      setUser(null);
    }
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};


















