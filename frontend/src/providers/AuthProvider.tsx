import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface User {
  id: string;
  email: string;
  username: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

  // Check if user is admin
  const isAdmin = user?.role === 'admin';

  // Initialize auth state from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    
    setIsLoading(false);
  }, []);

  // GraphQL request helper
  const graphqlRequest = async (query: string, variables: any = {}) => {
    const response = await fetch(`${API_URL}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.errors) {
      throw new Error(data.errors[0].message);
    }

    return data.data;
  };

  const login = async (email: string, password: string) => {
    try {
      const query = `
        mutation LoginUser($email: String!, $password: String!) {
          loginUser(email: $email, password: $password) {
            token
            user {
              id
              email
              username
              role
            }
          }
        }
      `;

      const data = await graphqlRequest(query, { email, password });
      
      if (data.loginUser) {
        const { token: newToken, user: newUser } = data.loginUser;
        
        setToken(newToken);
        setUser(newUser);
        
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(newUser));
        
        navigate('/dashboard');
      } else {
        throw new Error('Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const signup = async (email: string, username: string, password: string) => {
    try {
      const query = `
        mutation RegisterUser($email: String!, $username: String!, $password: String!) {
          registerUser(email: $email, username: $username, password: $password) {
            token
            user {
              id
              email
              username
              role
            }
          }
        }
      `;

      const data = await graphqlRequest(query, { email, username, password });
      
      if (data.registerUser) {
        const { token: newToken, user: newUser } = data.registerUser;
        
        setToken(newToken);
        setUser(newUser);
        
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(newUser));
        
        navigate('/dashboard');
      } else {
        throw new Error('Registration failed');
      }
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    signup,
    logout,
    isLoading,
    isAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};





