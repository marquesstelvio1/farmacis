import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
}

const UserContext = createContext<UserContextType>({ user: null, setUser: () => {} });

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(() => {
    try {
      const u = localStorage.getItem("user");
      return u ? JSON.parse(u) : null;
    } catch { return null; }
  });

  const setUser = (userData: User | null) => {
    setUserState(userData);
    if (userData) {
      localStorage.setItem("user", JSON.stringify(userData));
    } else {
      localStorage.removeItem("user");
    }
  };

  useEffect(() => {
    const syncUserFromStorage = () => {
      try {
        const rawUser = localStorage.getItem("user");
        setUserState(rawUser ? JSON.parse(rawUser) : null);
      } catch {
        setUserState(null);
      }
    };

    window.addEventListener("storage", syncUserFromStorage);
    window.addEventListener("user-updated", syncUserFromStorage);

    return () => {
      window.removeEventListener("storage", syncUserFromStorage);
      window.removeEventListener("user-updated", syncUserFromStorage);
    };
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);