import { createContext, useContext, createSignal, JSX, Component } from "solid-js";

// --- Route Provider ---
interface RouteContextType {
  path: () => string;
  navigate: (path: string) => void;
}

const RouteContext = createContext<RouteContextType>();

export const RouteProvider: Component<{ children: JSX.Element }> = (props) => {
  const [path, setPath] = createSignal("/");

  const navigate = (newPath: string) => {
    setPath(newPath);
  };

  return (
    <RouteContext.Provider value={{ path, navigate }}>
      {props.children}
    </RouteContext.Provider>
  );
};

export const useRoute = () => {
  const context = useContext(RouteContext);
  if (!context) throw new Error("useRoute must be used within a RouteProvider");
  return context;
};
