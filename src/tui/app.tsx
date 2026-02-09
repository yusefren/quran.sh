/** @jsxImportSource @opentui/solid */
import { render } from "@opentui/solid";
import { createSignal, onMount, onCleanup, Component, Show } from "solid-js";
import { Layout } from "./components/layout";
import { RouteProvider } from "./router";
import { SurahList } from "./components/surah-list";
import { StreakChart } from "./components/streak-chart";
import { Reader } from "./components/reader";
import { HelpDialog } from "./components/help-dialog";
import { Panel } from "./components/panel";
import type { PanelTab } from "./components/panel";
import { ReflectionDialog } from "./components/reflection-dialog";
import { CommandPalette } from "./components/command-palette";
import type { CommandItem } from "./components/command-palette";
import { toggleBookmark, getBookmarkedAyahs, getAllBookmarks } from "../data/bookmarks";
import type { Bookmark } from "../data/bookmarks";
import { setCue, getCue, getAllCues } from "../data/cues";
import type { Cue } from "../data/cues";
import { getAllReflections, addReflection, getReflection } from "../data/reflections";
import type { Reflection } from "../data/reflections";
import { getSurah, search, LANGUAGES } from "../data/quran";
import type { VerseRef } from "../data/quran";
import { ThemeProvider, useTheme } from "./theme";
import type { Theme } from "./theme";
import { ModeProvider, useMode } from "./mode";
import * as readline from "node:readline";

export { useTheme };
export type { Theme };

export type FocusablePane = "sidebar" | "arabic" | "translation" | "transliteration" | "panel";

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
  const [showPanel, setShowPanel] = createSignal(false);
  const [showPalette, setShowPalette] = createSignal(false);
  const [paletteIndex, setPaletteIndex] = createSignal(0);
  const [showReflectionDialog, setShowReflectionDialog] = createSignal(false);
  const [reflectionInput, setReflectionInput] = createSignal("");
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

  const [panelTab, setPanelTab] = createSignal<PanelTab>("bookmarks");
  const [panelIndex, setPanelIndex] = createSignal(0);
  const [allBookmarks, setAllBookmarks] = createSignal<Bookmark[]>([]);
  const [allCues, setAllCues] = createSignal<Cue[]>([]);
  const [allReflections, setAllReflections] = createSignal<Reflection[]>([]);

  // Command palette: actionable items with their labels and actions
  interface PaletteCommand extends CommandItem {
    action: () => void;
  }

  const paletteCommands: PaletteCommand[] = [
    { key: "a", label: "Toggle Arabic", description: "Show/hide Arabic pane", action: () => setShowArabic((prev) => !prev) },
    { key: "t", label: "Toggle Translation", description: "Show/hide Translation pane", action: () => setShowTranslation((prev) => !prev) },
    { key: "r", label: "Toggle Transliteration", description: "Show/hide Transliteration pane", action: () => setShowTransliteration((prev) => !prev) },
    {
      key: "l",
      label: "Cycle Language",
      description: "Switch translation language",
      action: () => {
        const idx = LANGUAGES.indexOf(language() as any);
        if (idx !== -1) setLanguage(LANGUAGES[(idx + 1) % LANGUAGES.length]);
      },
    },
    { key: "D", label: "Cycle Mode", description: "Switch light/dark mode", action: () => cycleMode() },
    { key: "T", label: "Cycle Theme", description: "Switch dynasty theme", action: () => cycleTheme() },
    {
      key: "s",
      label: "Toggle Sidebar",
      description: "Show/hide surah sidebar",
      action: () => {
        const wasVisible = showSidebar();
        setShowSidebar((prev) => !prev);
        if (wasVisible && focusedPanel() === "sidebar") setFocusedPanel("arabic");
        if (!wasVisible) setFocusedPanel("sidebar");
      },
    },
    {
      key: "B",
      label: "Toggle Panel",
      description: "Show/hide activity panel",
      action: () => {
        const wasVisible = showPanel();
        setShowPanel((prev) => !prev);
        if (wasVisible && focusedPanel() === "panel") setFocusedPanel("arabic");
        if (!wasVisible) {
          refreshPanelData();
          setFocusedPanel("panel");
        }
      },
    },
    { key: "+", label: "Increase Spacing", description: "Increase verse spacing", action: () => setVerseSpacing((prev) => Math.min(prev + 1, 5)) },
    { key: "-", label: "Decrease Spacing", description: "Decrease verse spacing", action: () => setVerseSpacing((prev) => Math.max(prev - 1, 0)) },
    {
      key: "b",
      label: "Toggle Bookmark",
      description: "Bookmark current verse",
      action: () => {
        const surahId = selectedSurahId();
        const ayahId = currentVerseId();
        const verseRef = `${surahId}:${ayahId}`;
        try {
          toggleBookmark(surahId, ayahId, verseRef);
          refreshBookmarks();
          if (showPanel()) refreshPanelData();
        } catch {
          /* DB may not be available */
        }
      },
    },
    {
      key: "R",
      label: "Add Reflection",
      description: "Add/edit reflection for current verse",
      action: () => {
        const surahId = selectedSurahId();
        const ayahId = currentVerseId();
        try {
          const existing = getReflection(surahId, ayahId);
          setReflectionInput(existing ? existing.note : "");
          setShowReflectionDialog(true);
        } catch {
          /* DB */
        }
      },
    },
    { key: "Tab", label: "Cycle Focus", description: "Move focus between panes", action: () => cycleFocus() },
    {
      key: "/",
      label: "Search",
      description: "Search verses",
      action: () => {
        setIsSearchMode(true);
        setSearchInput("");
        setFocusedPanel("arabic");
      },
    },
    { key: "?", label: "Help", description: "Show keyboard shortcuts", action: () => setShowHelp(true) },
    { key: "q", label: "Quit", description: "Exit application", action: () => process.exit(0) },
  ];

  const refreshBookmarks = () => {
    try {
      setBookmarkedAyahs(getBookmarkedAyahs(selectedSurahId()));
      setAllBookmarks(getAllBookmarks());
    } catch {
      // DB may not be available in tests
    }
  };

  const refreshPanelData = () => {
    try {
      setAllBookmarks(getAllBookmarks());
      setAllCues(getAllCues());
      setAllReflections(getAllReflections());
    } catch { /* DB */ }
  };

  const isReaderPane = (p: FocusablePane) => p === "arabic" || p === "translation" || p === "transliteration";

  const cycleFocus = () => {
    const panes: FocusablePane[] = [];
    if (showSidebar()) panes.push("sidebar");
    panes.push("arabic");
    if (showTranslation()) panes.push("translation");
    if (showTransliteration()) panes.push("transliteration");
    if (showPanel()) panes.push("panel");

    const current = focusedPanel();
    const idx = panes.indexOf(current);
    const next = panes[(idx + 1) % panes.length];
    setFocusedPanel(next);
  };

  onMount(() => {
    refreshBookmarks();
    refreshPanelData();

    try {
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(true);
        readline.emitKeypressEvents(process.stdin);
      }
    } catch (e) {
      // Ignore
    }

    const onKeyPress = (str: string, key: any) => {
      // Ctrl+P: toggle command palette
      if (key && key.ctrl && key.name === "p") {
        setShowPalette((prev) => !prev);
        setPaletteIndex(0);
        return;
      }

      if (showPalette()) {
        if (key && key.name === "escape") {
          setShowPalette(false);
          return;
        }
        if (str === "j" || (key && key.name === "down")) {
          setPaletteIndex((prev) => (prev + 1) % paletteCommands.length);
          return;
        }
        if (str === "k" || (key && key.name === "up")) {
          setPaletteIndex((prev) => (prev - 1 + paletteCommands.length) % paletteCommands.length);
          return;
        }
        if (key && key.name === "return") {
          const cmd = paletteCommands[paletteIndex()];
          if (cmd) {
            cmd.action();
            setShowPalette(false);
          }
          return;
        }
        return;
      }

      if (showReflectionDialog()) {
        if (key && key.name === "escape") {
          setShowReflectionDialog(false);
          return;
        }
        if (key && key.name === "return") {
          const surahId = selectedSurahId();
          const ayahId = currentVerseId();
          const verseRef = `${surahId}:${ayahId}`;
          try {
            addReflection(surahId, ayahId, verseRef, reflectionInput());
            setShowReflectionDialog(false);
            refreshPanelData();
            showFlash("Reflection saved");
          } catch {
            /* DB */
          }
          return;
        }
        if (key && key.name === "backspace") {
          setReflectionInput((prev) => prev.slice(0, -1));
          return;
        }
        if (str && str.length === 1 && !key?.ctrl && !key?.meta) {
          setReflectionInput((prev) => prev + str);
          return;
        }
        return;
      }

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

      if (focusedPanel() === "panel") {
        const tabs: PanelTab[] = ["bookmarks", "cues", "reflections"];
        const items = panelTab() === "bookmarks" ? allBookmarks() :
                      panelTab() === "cues" ? allCues() : allReflections();

        if (key && (key.name === "left" || str === "h")) {
          const idx = tabs.indexOf(panelTab());
          setPanelTab(tabs[(idx - 1 + tabs.length) % tabs.length]);
          setPanelIndex(0);
          return;
        }
        if (key && (key.name === "right" || str === "l")) {
          const idx = tabs.indexOf(panelTab());
          setPanelTab(tabs[(idx + 1) % tabs.length]);
          setPanelIndex(0);
          return;
        }
        if (str === "j" || (key && key.name === "down")) {
          setPanelIndex((prev) => Math.min(prev + 1, Math.max(0, items.length - 1)));
          return;
        }
        if (str === "k" || (key && key.name === "up")) {
          setPanelIndex((prev) => Math.max(prev - 1, 0));
          return;
        }
        if (key && key.name === "return") {
          const item = items[panelIndex()];
          if (item) {
            setSelectedSurahId(item.surah);
            setCurrentVerseId(item.ayah);
            refreshBookmarks();

            if (panelTab() === "reflections") {
              setReflectionInput((item as Reflection).note);
              setShowReflectionDialog(true);
            }
          }
          return;
        }
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

      if (str === 'B') {
        const wasVisible = showPanel();
        setShowPanel(prev => !prev);
        if (wasVisible && focusedPanel() === "panel") {
          setFocusedPanel("arabic");
        }
        if (!wasVisible) {
          refreshPanelData();
          setFocusedPanel("panel");
        }
        return;
      }

      if (str === "R") {
        const surahId = selectedSurahId();
        const ayahId = currentVerseId();
        try {
          const existing = getReflection(surahId, ayahId);
          setReflectionInput(existing ? existing.note : "");
          setShowReflectionDialog(true);
        } catch {
          /* DB */
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
            if (showPanel()) refreshPanelData();
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
            if (showPanel()) refreshPanelData();
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
        showPanel={showPanel()}
        sidebarFocused={focusedPanel() === "sidebar"}
        panelFocused={focusedPanel() === "panel"}
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
        panel={
          <Panel
            bookmarks={allBookmarks()}
            cues={allCues()}
            reflections={allReflections()}
            activeTab={panelTab()}
            selectedIndex={panelIndex()}
            focused={focusedPanel() === "panel"}
          />
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
        <CommandPalette
          visible={showPalette()}
          commands={paletteCommands}
          selectedIndex={paletteIndex()}
        />
        <ReflectionDialog
          visible={showReflectionDialog()}
          verseRef={`${selectedSurahId()}:${currentVerseId()}`}
          note={reflectionInput()}
          onClose={() => setShowReflectionDialog(false)}
          onSave={(note) => {
            const surahId = selectedSurahId();
            const ayahId = currentVerseId();
            addReflection(surahId, ayahId, `${surahId}:${ayahId}`, note);
            setShowReflectionDialog(false);
            refreshPanelData();
            showFlash("Reflection saved");
          }}
          onInput={(text) => setReflectionInput(text)}
        />
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
