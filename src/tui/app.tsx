import { render } from "@opentui/solid";
import { createContext, useContext, createSignal, onMount, onCleanup, JSX, Component } from "solid-js";
import { Layout } from "./components/layout";
import { RouteProvider } from "./router";
import { SurahList } from "./components/surah-list";
import { Reader } from "./components/reader";
import * as readline from "node:readline";

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
  const [selectedSurahId, setSelectedSurahId] = createSignal(1);
  const [focusedPanel, setFocusedPanel] = createSignal<"sidebar" | "reader">("sidebar");

  onMount(() => {
    try {
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(true);
        readline.emitKeypressEvents(process.stdin);
      }
    } catch (e) {
      // Ignore
    }

    const onKeyPress = (str: string, key: any) => {
      if (key && key.name === 'q') {
        process.exit(0);
      }
      if (key && key.name === 'tab') {
        setFocusedPanel(prev => prev === 'sidebar' ? 'reader' : 'sidebar');
      }
    };

    process.stdin.on('keypress', onKeyPress);

    onCleanup(() => {
      process.stdin.removeListener('keypress', onKeyPress);
    });
  });

  return (
    <ThemeProvider>
      <RouteProvider>
        <Layout
          sidebar={
            <SurahList 
              onSelect={(id) => setSelectedSurahId(id)}
              initialSelectedId={selectedSurahId()}
              focused={focusedPanel() === "sidebar"}
            />
          }
        >
          <Reader 
            surahId={selectedSurahId()} 
            focused={focusedPanel() === "reader"}
          />
        </Layout>
      </RouteProvider>
    </ThemeProvider>
  );
};

if (import.meta.main) {
  render(() => <App />);
}

export default App;
