/** @jsxImportSource @opentui/solid */
import { render } from "@opentui/solid";
import { createSignal, onMount, onCleanup, Component, Show } from "solid-js";
import { Layout } from "./components/layout";
import { RouteProvider } from "./router";
import { SurahList } from "./components/surah-list";
import { StreakChart } from "./components/streak-chart";
import { Reader } from "./components/reader";
import { HelpDialog } from "./components/help-dialog";
import { toggleBookmark, getBookmarkedAyahs } from "../data/bookmarks";
import { setCue, getCue } from "../data/cues";
import { getSurah, search, LANGUAGES } from "../data/quran";
import type { VerseRef } from "../data/quran";
import { ThemeProvider, useTheme } from "./theme";
import type { Theme } from "./theme";
import { ModeProvider, useMode } from "./mode";
import * as readline from "node:readline";

export { useTheme };
export type { Theme };

export type FocusablePane = "sidebar" | "arabic" | "translation" | "transliteration";

const AppContent: Component = () => {
  const { cycleTheme } = useTheme();
  const { cycleMode } = useMode();

  const [selectedSurahId, setSelectedSurahId] = createSignal(1);
  const [focusedPanel, setFocusedPanel] = createSignal<FocusablePane>("sidebar");
  const [currentVerseId, setCurrentVerseId] = createSignal(1);
  const [bookmarkedAyahs, setBookmarkedAyahs] = createSignal<Set<number>>(new Set());
  const [isSearchMode, setIsSearchMode] = createSignal(false);
  const [searchInput, setSearchInput] = createSignal("");
  const [searchResults, setSearchResults] = createSignal<VerseRef[]>([]);
  const [searchQuery, setSearchQuery] = createSignal("");
  const [showHelp, setShowHelp] = createSignal(false);
  const [showSidebar, setShowSidebar] = createSignal(true);
  const [verseSpacing, setVerseSpacing] = createSignal(1);

  const [showArabic, setShowArabic] = createSignal(true);
  const [showTranslation, setShowTranslation] = createSignal(true);
  const [showTransliteration, setShowTransliteration] = createSignal(false);
  const [language, setLanguage] = createSignal("en");
  const [flashMessage, setFlashMessage] = createSignal("");

  const showFlash = (msg: string) => {
    setFlashMessage(msg);
    setTimeout(() => setFlashMessage(""), 2000);
  };

  const refreshBookmarks = () => {
    try {
      setBookmarkedAyahs(getBookmarkedAyahs(selectedSurahId()));
    } catch {
      // DB may not be available in tests
    }
  };

  const isReaderPane = (p: FocusablePane) => p === "arabic" || p === "translation" || p === "transliteration";

  const cycleFocus = () => {
    const panes: FocusablePane[] = [];
    if (showSidebar()) panes.push("sidebar");
    panes.push("arabic");
    if (showTranslation()) panes.push("translation");
    if (showTransliteration()) panes.push("transliteration");

    const current = focusedPanel();
    const idx = panes.indexOf(current);
    const next = panes[(idx + 1) % panes.length];
    setFocusedPanel(next);
  };

  onMount(() => {
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
      if (showHelp()) {
        if (key && (key.name === 'escape' || key.name === 'q' || str === '?')) {
          setShowHelp(false);
        }
        return;
      }

      if (isSearchMode()) {
        if (key && key.name === 'escape') {
          setIsSearchMode(false);
          setSearchInput("");
          setSearchResults([]);
          setSearchQuery("");
          return;
        }
        if (key && key.name === 'return') {
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
        if (str && str.length === 1 && !key?.ctrl && !key?.meta) {
          setSearchInput(prev => prev + str);
          return;
        }
        return;
      }

      if (key && key.name === 'q') {
        process.exit(0);
      }

      if (str === '?') {
        setShowHelp(true);
        return;
      }

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

      if (str === 'T') {
        cycleTheme();
        return;
      }

      if (str === 'D') {
        cycleMode();
        return;
      }

      if (str === 's') {
        const wasVisible = showSidebar();
        setShowSidebar(prev => !prev);
        if (wasVisible && focusedPanel() === "sidebar") {
          setFocusedPanel("arabic");
        }
        if (!wasVisible) {
          setFocusedPanel("sidebar");
        }
        return;
      }

      if (str === '+' || str === '=') {
        setVerseSpacing(prev => Math.min(prev + 1, 5));
        return;
      }
      if (str === '-') {
        setVerseSpacing(prev => Math.max(prev - 1, 0));
        return;
      }

      if (key && key.name === 'tab') {
        cycleFocus();
        return;
      }

      if (str === '/') {
        setIsSearchMode(true);
        setSearchInput("");
        setFocusedPanel("arabic");
        return;
      }

      if (key && key.name === 'escape') {
        if (searchResults().length > 0) {
          setSearchResults([]);
          setSearchQuery("");
        }
        return;
      }

      if (isReaderPane(focusedPanel())) {
        const cueSetSymbols: Record<string, number> = {
          '!': 1, '@': 2, '#': 3, '$': 4, '%': 5, '^': 6, '&': 7, '*': 8, '(': 9
        };
        const cueJumpKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

        if (cueSetSymbols[str]) {
          const slot = cueSetSymbols[str];
          const surahId = selectedSurahId();
          const ayahId = currentVerseId();
          const verseRef = `${surahId}:${ayahId}`;
          try {
            setCue(slot, surahId, ayahId, verseRef);
            showFlash(`Cue ${slot} set \u2192 ${verseRef}`);
          } catch { /* DB */ }
          return;
        }

        if (cueJumpKeys.includes(str)) {
          const slot = parseInt(str, 10);
          try {
            const cue = getCue(slot);
            if (cue) {
              setSelectedSurahId(cue.surah);
              setCurrentVerseId(cue.ayah);
              refreshBookmarks();
              showFlash(`Jumped to Cue ${slot} (${cue.verseRef})`);
            }
          } catch { /* DB */ }
          return;
        }

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
    <RouteProvider>
      <Layout
        showSidebar={showSidebar()}
        sidebarFocused={focusedPanel() === "sidebar"}
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
          focusedPane={focusedPanel()}
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
          verseSpacing={verseSpacing()}
        />
        <Show when={flashMessage()}>
          <box
            position="absolute"
            bottom={2}
            right={2}
            padding={1}
            backgroundColor={useTheme().theme().colors.secondary}
          >
            <text color={useTheme().theme().colors.background}>{flashMessage()}</text>
          </box>
        </Show>
        <HelpDialog visible={showHelp()} />
      </Layout>
    </RouteProvider>
  );
};

const App: Component = () => {
  return (
    <ModeProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </ModeProvider>
  );
};

if (import.meta.main) {
  render(() => <App />);
}

export default App;
