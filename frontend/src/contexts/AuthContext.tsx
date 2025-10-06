import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { UserProfile } from "@/types/anchor";
import axios, { AxiosResponse } from "axios";
import bs58 from "bs58";
import { toast } from "sonner";

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
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { publicKey, connected, disconnect, signMessage } = useWallet();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isAuthenticated = connected && !!user;

  // Fetch user data when wallet connects
  useEffect(() => {
    if (connected && publicKey) {
      // Attempting to login the user auth
      (async () => {
        const nonceResponse = await axios.get<string>(
          `${import.meta.env.VITE_BACKEND_URL}/auth/nonce/${publicKey}`
        );
        const nonce = nonceResponse.data;
        const message = `Sign this message to authenticate : nonce ${nonce}`;
        
        let signedMessage: Uint8Array;
        try {
          signedMessage = await signMessage(new TextEncoder().encode(message));
        } catch (error) {
          toast.error("Failed to sign : message");
          disconnect();
        }

        let verificationResponse : AxiosResponse;
        try {
          verificationResponse = await axios.post<boolean>(
            `${import.meta.env.VITE_BACKEND_URL}/auth/signin`,
            {
              walletPublicKey: publicKey,
              nonce,
              signedMessage: bs58.encode(signedMessage),
            },
            {
              withCredentials: true
            }
          );
        } catch (error) {
          // disconnect wallet
          // send toast message
          toast.error("Failed to verify signature");
          disconnect();
          return;
        }
        const isSigVerified = verificationResponse.data;

        toast("Logged in successfully");

        fetchUserData();
      })();
    } else {
      setUser(null);
    }
  }, [connected, publicKey ]);

  const fetchUserData = async () => {
    if (!publicKey) return;

    setIsLoading(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/auth/user/${publicKey.toBase58()}`,
        { withCredentials: true }
      );
      const userData = response.data;
      setUser(userData);
    } catch (error) {
      console.error("Error fetching user data:", error);
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
