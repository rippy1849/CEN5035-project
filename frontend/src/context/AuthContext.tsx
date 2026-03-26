import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { type User, getCurrentUser, isLoggedIn as checkLoggedIn, logout as apiLogout, googleLogin as apiGoogleLogin, clearAuth } from '../api/auth';

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  login: (credential: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoggedIn: false,
  login: async () => {},
  logout: async () => {},
  loading: true,
});

export function useAuth() {
  return useContext(AuthContext);
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in from localStorage
    if (checkLoggedIn()) {
      const storedUser = getCurrentUser();
      if (storedUser) {
        setUser(storedUser);
      }
    }
    setLoading(false);
  }, []);

  const login = async (credential: string) => {
    const response = await apiGoogleLogin(credential);
    setUser(response.user);
  };

  const logout = async () => {
    await apiLogout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        login,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
