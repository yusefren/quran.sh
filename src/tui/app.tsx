import { render } from "@opentui/solid";
import { createContext, useContext, createSignal, onMount, onCleanup, JSX, Component } from "solid-js";
import { Layout } from "./components/layout";
import { RouteProvider } from "./router";
import { SurahList } from "./components/surah-list";
import { StreakChart } from "./components/streak-chart";
import { Reader } from "./components/reader";
import { toggleBookmark, getBookmarkedAyahs } from "../data/bookmarks";
import { getSurah } from "../data/quran";
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
  const [currentVerseId, setCurrentVerseId] = createSignal(1);
  const [bookmarkedAyahs, setBookmarkedAyahs] = createSignal<Set<number>>(new Set());

  /** Refresh the bookmarked ayahs set for the current surah from the DB */
  const refreshBookmarks = () => {
    try {
      setBookmarkedAyahs(getBookmarkedAyahs(selectedSurahId()));
    } catch {
      // DB may not be available in tests
    }
  };

  onMount(() => {
    // Load initial bookmarks
    refreshBookmarks();

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

      // Reader-specific keys (only when reader panel is focused)
      if (focusedPanel() === 'reader') {
        if (str === 'j' || (key && key.name === 'down')) {
          const surah = getSurah(selectedSurahId());
          if (surah && currentVerseId() < surah.totalVerses) {
            setCurrentVerseId(prev => prev + 1);
          }
        }
        if (str === 'k' || (key && key.name === 'up')) {
          if (currentVerseId() > 1) {
            setCurrentVerseId(prev => prev - 1);
          }
        }
        if (str === 'b') {
          const surahId = selectedSurahId();
          const ayahId = currentVerseId();
          const verseRef = `${surahId}:${ayahId}`;
          try {
            toggleBookmark(surahId, ayahId, verseRef);
            refreshBookmarks();
          } catch {
            // DB may not be available
          }
        }
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
            <box flexDirection="column" height="100%">
              <box height="25%">
                <StreakChart />
              </box>
              <box height="75%">
                <SurahList 
                  onSelect={(id) => {
                    setSelectedSurahId(id);
                    setCurrentVerseId(1);
                    // Refresh bookmarks for the new surah
                    try {
                      setBookmarkedAyahs(getBookmarkedAyahs(id));
                    } catch {
                      // DB may not be available
                    }
                  }}
                  initialSelectedId={selectedSurahId()}
                  focused={focusedPanel() === "sidebar"}
                />
              </box>
            </box>
          }
        >
          <Reader 
            surahId={selectedSurahId()} 
            focused={focusedPanel() === "reader"}
            currentVerseId={currentVerseId()}
            bookmarkedAyahs={bookmarkedAyahs()}
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
