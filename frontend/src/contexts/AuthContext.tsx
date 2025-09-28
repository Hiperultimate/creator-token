import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { UserProfile } from '@/types/anchor';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => void;
  updateUser: (user: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { publicKey, connected, disconnect } = useWallet();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isAuthenticated = connected && !!user;

  // Fetch user data when wallet connects
  useEffect(() => {
    if (connected && publicKey) {
      fetchUserData();
    } else {
      setUser(null);
    }
  }, [connected, publicKey]);

  const fetchUserData = async () => {
    if (!publicKey) return;
    
    setIsLoading(true);
    try {
      // TODO: Replace with actual API call from backend
      const response = await fetch(`/api/users/${publicKey.toBase58()}`);
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        // User doesn't exist in backend, create basic profile
        setUser({
          walletAddress: publicKey.toBase58(),
          isCreator: false,
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      // Fallback to basic profile
      setUser({
        walletAddress: publicKey.toBase58(),
        isCreator: false,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const login = async () => {
    // The actual wallet connection is handled by the wallet adapter
    // This function is for any additional login logic
    if (connected && publicKey) {
      await fetchUserData();
    }
  };

  const logout = () => {
    disconnect();
    setUser(null);
  };

  const updateUser = (updatedUser: Partial<UserProfile>) => {
    if (user) {
      setUser({ ...user, ...updatedUser });
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}