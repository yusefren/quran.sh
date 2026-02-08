/** @jsxImportSource @opentui/solid */
import { render } from "@opentui/solid";
import { createSignal, onMount, onCleanup, Component } from "solid-js";
import { Layout } from "./components/layout";
import { RouteProvider } from "./router";
import { SurahList } from "./components/surah-list";
import { StreakChart } from "./components/streak-chart";
import { Reader } from "./components/reader";
import { HelpDialog } from "./components/help-dialog";
import { toggleBookmark, getBookmarkedAyahs } from "../data/bookmarks";
import { getSurah, search, LANGUAGES } from "../data/quran";
import type { VerseRef } from "../data/quran";
import { ThemeProvider, useTheme } from "./theme";
import * as readline from "node:readline";

export { useTheme };

// --- App Component ---
const App: Component = () => {
  const [selectedSurahId, setSelectedSurahId] = createSignal(1);
  const [focusedPanel, setFocusedPanel] = createSignal<"sidebar" | "reader">("sidebar");
  const [currentVerseId, setCurrentVerseId] = createSignal(1);
  const [bookmarkedAyahs, setBookmarkedAyahs] = createSignal<Set<number>>(new Set());
  const [isSearchMode, setIsSearchMode] = createSignal(false);
  const [searchInput, setSearchInput] = createSignal("");
  const [searchResults, setSearchResults] = createSignal<VerseRef[]>([]);
  const [searchQuery, setSearchQuery] = createSignal("");
  const [showHelp, setShowHelp] = createSignal(false);
  
  // View settings
  const [showArabic, setShowArabic] = createSignal(true);
  const [showTranslation, setShowTranslation] = createSignal(true);
  const [showTransliteration, setShowTransliteration] = createSignal(false);
  const [language, setLanguage] = createSignal("en");

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
      // --- Help dialog handling ---
      if (showHelp()) {
        if (key && (key.name === 'escape' || key.name === 'q' || str === '?')) {
          setShowHelp(false);
        }
        return;
      }

      // --- Search mode input handling ---
      if (isSearchMode()) {
        if (key && key.name === 'escape') {
          // ESC exits search mode and clears results
          setIsSearchMode(false);
          setSearchInput("");
          setSearchResults([]);
          setSearchQuery("");
          return;
        }
        if (key && key.name === 'return') {
          // Enter executes search
          const query = searchInput();
          if (query.trim().length > 0) {
            const results = search(query);
            setSearchResults(results);
            setSearchQuery(query);
          }
          setIsSearchMode(false);
          return;
        }
        if (key && key.name === 'backspace') {
          setSearchInput(prev => prev.slice(0, -1));
          return;
        }
        // Append printable characters to search input
        if (str && str.length === 1 && !key?.ctrl && !key?.meta) {
          setSearchInput(prev => prev + str);
          return;
        }
        return;
      }

      // --- Normal mode key handling ---
      if (key && key.name === 'q') {
        process.exit(0);
      }

      if (str === '?') {
        setShowHelp(true);
        return;
      }

      // --- View Toggles ---
      if (str === 'a') {
        setShowArabic(prev => !prev);
        return;
      }
      if (str === 't') {
        setShowTranslation(prev => !prev);
        return;
      }
      if (str === 'r') {
        setShowTransliteration(prev => !prev);
        return;
      }
      if (str === 'l') {
        const idx = LANGUAGES.indexOf(language() as any);
        if (idx !== -1) {
          const next = LANGUAGES[(idx + 1) % LANGUAGES.length];
          setLanguage(next);
        }
        return;
      }

      if (key && key.name === 'tab') {
        setFocusedPanel(prev => prev === 'sidebar' ? 'reader' : 'sidebar');
      }

      // `/` opens search mode
      if (str === '/') {
        setIsSearchMode(true);
        setSearchInput("");
        setFocusedPanel("reader");
        return;
      }

      // ESC in normal mode clears search results (return to surah view)
      if (key && key.name === 'escape') {
        if (searchResults().length > 0) {
          setSearchResults([]);
          setSearchQuery("");
        }
        return;
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
            searchResults={searchResults()}
            searchQuery={searchQuery()}
            isSearchMode={isSearchMode()}
            searchInput={searchInput()}
            showArabic={showArabic()}
            showTranslation={showTranslation()}
            showTransliteration={showTransliteration()}
            language={language()}
          />
          <HelpDialog visible={showHelp()} />
        </Layout>
      </RouteProvider>
    </ThemeProvider>
  );
};

if (import.meta.main) {
  render(() => <App />);
}

export default App;
