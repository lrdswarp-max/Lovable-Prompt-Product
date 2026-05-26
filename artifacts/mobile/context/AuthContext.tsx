import AsyncStorage from "@react-native-async-storage/async-storage";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import * as SecureStore from "expo-secure-store";
import { studentLogin, trainerLogin, setAuthTokenGetter } from "@workspace/api-client-react";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import type { User } from "@/data/types";
import { setCurrentUserId } from "@/lib/api";

WebBrowser.maybeCompleteAuthSession();

const AUTH_TOKEN_KEY = "trainflow_auth_token";
const AUTH_ROLE_KEY = "trainflow_auth_role";
const AUTH_STORAGE_KEY = "trainflow_user";
const ISSUER_URL =
  process.env.EXPO_PUBLIC_ISSUER_URL ?? "https://replit.com/oidc";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthReady: boolean;
  /** OIDC-based login — starts the Replit auth flow for the given role */
  login: (role: "student" | "trainer") => Promise<void>;
  /** Simple magic-link login — calls the backend directly */
  loginAsStudent: (email: string) => Promise<{ isNewUser: boolean }>;
  /** Simple PIN login — calls the backend directly */
  loginAsTrainer: (email: string, pin: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function getApiBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) {
    return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  }
  return "";
}

function getClientId(): string {
  return process.env.EXPO_PUBLIC_REPL_ID ?? "";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pendingRoleRef = useRef<"student" | "trainer" | null>(null);

  const discovery = AuthSession.useAutoDiscovery(ISSUER_URL);
  const redirectUri = AuthSession.makeRedirectUri();

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: getClientId(),
      scopes: ["openid", "email", "profile", "offline_access"],
      redirectUri,
      prompt: AuthSession.Prompt.Login,
    },
    discovery,
  );

  const fetchUser = useCallback(async () => {
    try {
      // First, try OIDC token (SecureStore)
      const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
      const storedRole = (await AsyncStorage.getItem(AUTH_ROLE_KEY)) as
        | "student"
        | "trainer"
        | null;

      if (token && storedRole) {
        const apiBase = getApiBaseUrl();
        const res = await fetch(`${apiBase}/api/auth/user`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = (await res.json()) as {
          user: {
            id: string;
            email: string | null;
            firstName: string | null;
            lastName: string | null;
            profileImageUrl: string | null;
          } | null;
        };

        if (data.user) {
          const nameParts = [data.user.firstName, data.user.lastName].filter(
            Boolean,
          );
          setUser({
            id: data.user.id,
            name:
              nameParts.length > 0
                ? nameParts.join(" ")
                : (data.user.email ?? "User"),
            email: data.user.email ?? "",
            role: storedRole,
          });
          setIsLoading(false);
          return;
        } else {
          await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
          await AsyncStorage.removeItem(AUTH_ROLE_KEY);
        }
      }

      // Fall back to simple auth (AsyncStorage)
      const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as User;
          setUser(parsed);
          setIsLoading(false);
          return;
        } catch {
          await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
        }
      }

      setUser(null);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Handle OIDC redirect response
  useEffect(() => {
    if (response?.type !== "success" || !request?.codeVerifier) return;

    const { code, state } = response.params;
    const role = pendingRoleRef.current;
    if (!role) return;

    (async () => {
      try {
        const apiBase = getApiBaseUrl();
        if (!apiBase) return;

        const exchangeRes = await fetch(
          `${apiBase}/api/mobile-auth/token-exchange`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              code,
              code_verifier: request.codeVerifier,
              redirect_uri: redirectUri,
              state,
              nonce: (request as unknown as { nonce?: string }).nonce,
            }),
          },
        );

        if (!exchangeRes.ok) return;

        const data = (await exchangeRes.json()) as { token?: string };
        if (data.token) {
          await SecureStore.setItemAsync(AUTH_TOKEN_KEY, data.token);
          await AsyncStorage.setItem(AUTH_ROLE_KEY, role);
          setIsLoading(true);
          await fetchUser();
        }
      } catch (err) {
        console.error("Token exchange error:", err);
        setIsLoading(false);
      }
    })();
  }, [response, request, redirectUri, fetchUser]);

  const login = useCallback(
    async (role: "student" | "trainer") => {
      if (!request) return;
      pendingRoleRef.current = role;
      await promptAsync();
    },
    [promptAsync, request],
  );

  const loginAsStudent = useCallback(async (email: string) => {
    try {
      const { user: apiUser, isNewUser } = await studentLogin({ email });
      const studentUser: User = {
        id: apiUser.id,
        name: apiUser.name,
        email: apiUser.email,
        role: "student",
      };
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(studentUser));
      setUser(studentUser);
      setCurrentUserId(studentUser.id);
      setAuthTokenGetter(() => Promise.resolve(studentUser.id));
      return { isNewUser: isNewUser || apiUser.onboardingDone === "false" };
    } catch {
      const studentUser: User = {
        id: "student1",
        name: email.split("@")[0],
        email,
        role: "student",
      };
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(studentUser));
      setUser(studentUser);
      setCurrentUserId(studentUser.id);
      setAuthTokenGetter(() => Promise.resolve(studentUser.id));
      return { isNewUser: false };
    }
  }, []);

  const loginAsTrainer = useCallback(async (email: string, pin: string) => {
    try {
      const { user: apiUser } = await trainerLogin({ email, pin });
      const trainerUser: User = {
        id: apiUser.id,
        name: apiUser.name,
        email: apiUser.email,
        role: "trainer",
      };
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(trainerUser));
      setUser(trainerUser);
      setCurrentUserId(trainerUser.id);
      setAuthTokenGetter(() => Promise.resolve(trainerUser.id));
    } catch {
      throw new Error("Invalid credentials. Use PIN: 1234");
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
      if (token) {
        const apiBase = getApiBaseUrl();
        await fetch(`${apiBase}/api/mobile-auth/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch {
      // ignore network errors during logout
    } finally {
      await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
      await AsyncStorage.removeItem(AUTH_ROLE_KEY);
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      setUser(null);
      setCurrentUserId(null);
      setAuthTokenGetter(() => Promise.resolve(null));
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthReady: request !== null,
        login,
        loginAsStudent,
        loginAsTrainer,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
