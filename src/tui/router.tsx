import { createContext, useContext, useState, type ReactNode } from "react";

// --- Route Provider ---
interface RouteContextType {
  path: string;
  navigate: (path: string) => void;
}

const RouteContext = createContext<RouteContextType | undefined>(undefined);

export function RouteProvider({ children }: { children: ReactNode }) {
  const [path, setPath] = useState("/");

  const navigate = (newPath: string) => {
    setPath(newPath);
  };

  return (
    <RouteContext.Provider value={{ path, navigate }}>
      {children}
    </RouteContext.Provider>
  );
}

export const useRoute = () => {
  const context = useContext(RouteContext);
  if (!context) throw new Error("useRoute must be used within a RouteProvider");
  return context;
};
