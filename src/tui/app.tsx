import { render } from "@opentui/solid";
import { createContext, useContext, createSignal, JSX, Component } from "solid-js";
import { Layout } from "./components/layout";

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

// --- Theme Provider ---
interface ThemeContextType {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
  };
  setTheme: (theme: any) => void;
}

const defaultTheme = {
  primary: "cyan",
  secondary: "green",
  background: "black",
  text: "white",
};

const ThemeContext = createContext<ThemeContextType>();

export const ThemeProvider: Component<{ children: JSX.Element }> = (props) => {
  const [theme, setTheme] = createSignal(defaultTheme);

  return (
    <ThemeContext.Provider value={{ colors: theme(), setTheme }}>
      {props.children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
};

// --- App Component ---
const App: Component = () => {
  return (
    <ThemeProvider>
      <RouteProvider>
        <Layout>
          <box flexDirection="column">
            <text>Welcome to Quran TUI</text>
            <RouteInfo />
          </box>
        </Layout>
      </RouteProvider>
    </ThemeProvider>
  );
};

const RouteInfo: Component = () => {
  const { path } = useRoute();
  return <text>Current Route: {path()}</text>;
};

if (import.meta.main) {
  render(() => <App />);
}

export default App;
