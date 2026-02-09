import { useKeyboard } from "@opentui/react";
import { useState, useEffect, useCallback, useRef, type FC } from "react";
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

export { useTheme };
export type { Theme };

export type FocusablePane = "sidebar" | "arabic" | "translation" | "transliteration" | "panel";

const AppContent: FC = () => {
  const { cycleTheme } = useTheme();
  const { cycleMode } = useMode();

  const [selectedSurahId, setSelectedSurahId] = useState(1);
  const [focusedPanel, setFocusedPanel] = useState<FocusablePane>("sidebar");
  const [currentVerseId, setCurrentVerseId] = useState(1);
  const [bookmarkedAyahs, setBookmarkedAyahs] = useState<Set<number>>(new Set());
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchResults, setSearchResults] = useState<VerseRef[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showHelp, setShowHelp] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showPanel, setShowPanel] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [paletteIndex, setPaletteIndex] = useState(0);
  const [showReflectionDialog, setShowReflectionDialog] = useState(false);
  const [reflectionInput, setReflectionInput] = useState("");
  const [arabicZoom, setArabicZoom] = useState(0);

  const [showArabic, setShowArabic] = useState(true);
  const [showTranslation, setShowTranslation] = useState(true);
  const [showTransliteration, setShowTransliteration] = useState(false);
  const [language, setLanguage] = useState("en");
  const [flashMessage, setFlashMessage] = useState("");

  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showFlash = useCallback((msg: string) => {
    setFlashMessage(msg);
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    flashTimerRef.current = setTimeout(() => setFlashMessage(""), 2000);
  }, []);

  // Cleanup flash timer on unmount
  useEffect(() => {
    return () => {
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    };
  }, []);

  const [panelTab, setPanelTab] = useState<PanelTab>("bookmarks");
  const [panelIndex, setPanelIndex] = useState(0);
  const [allBookmarks, setAllBookmarks] = useState<Bookmark[]>([]);
  const [allCues, setAllCues] = useState<Cue[]>([]);
  const [allReflections, setAllReflections] = useState<Reflection[]>([]);

  // Command palette: actionable items with their labels and actions
  interface PaletteCommand extends CommandItem {
    action: () => void;
  }

  const refreshBookmarks = useCallback(() => {
    try {
      setBookmarkedAyahs(getBookmarkedAyahs(selectedSurahId));
      setAllBookmarks(getAllBookmarks());
    } catch {
      // DB may not be available in tests
    }
  }, [selectedSurahId]);

  const refreshPanelData = useCallback(() => {
    try {
      setAllBookmarks(getAllBookmarks());
      setAllCues(getAllCues());
      setAllReflections(getAllReflections());
    } catch { /* DB */ }
  }, []);

  const isReaderPane = (p: FocusablePane) => p === "arabic" || p === "translation" || p === "transliteration";

  const cycleFocus = useCallback(() => {
    const panes: FocusablePane[] = [];
    if (showSidebar) panes.push("sidebar");
    panes.push("arabic");
    if (showTranslation) panes.push("translation");
    if (showTransliteration) panes.push("transliteration");
    if (showPanel) panes.push("panel");

    const idx = panes.indexOf(focusedPanel);
    const next = panes[(idx + 1) % panes.length]!;
    setFocusedPanel(next);
  }, [showSidebar, showTranslation, showTransliteration, showPanel, focusedPanel]);

  // True when any modal/overlay is open — used to disable focus on child components
  const anyModalOpen = showPalette || showReflectionDialog || showHelp || isSearchMode;

  // We use refs to access latest state inside the keyboard handler
  // (avoids stale closures without needing to list every state var as dep)
  const stateRef = useRef({
    selectedSurahId, currentVerseId, focusedPanel, isSearchMode, searchInput,
    searchResults, showHelp, showSidebar, showPanel, showPalette, paletteIndex,
    showReflectionDialog, reflectionInput, showArabic, showTranslation, showTransliteration,
    language, panelTab, panelIndex, allBookmarks, allCues, allReflections, anyModalOpen,
  });
  stateRef.current = {
    selectedSurahId, currentVerseId, focusedPanel, isSearchMode, searchInput,
    searchResults, showHelp, showSidebar, showPanel, showPalette, paletteIndex,
    showReflectionDialog, reflectionInput, showArabic, showTranslation, showTransliteration,
    language, panelTab, panelIndex, allBookmarks, allCues, allReflections, anyModalOpen,
  };

  const paletteCommands: PaletteCommand[] = [
    { key: "a", label: "Toggle Arabic", description: "Show/hide Arabic pane", action: () => setShowArabic((prev) => !prev) },
    { key: "t", label: "Toggle Translation", description: "Show/hide Translation pane", action: () => setShowTranslation((prev) => !prev) },
    { key: "r", label: "Toggle Transliteration", description: "Show/hide Transliteration pane", action: () => setShowTransliteration((prev) => !prev) },
    {
      key: "l",
      label: "Cycle Language",
      description: "Switch translation language",
      action: () => {
        const s = stateRef.current;
        const idx = LANGUAGES.indexOf(s.language as any);
        if (idx !== -1) setLanguage(LANGUAGES[(idx + 1) % LANGUAGES.length]!);
      },
    },
    { key: "D", label: "Cycle Mode", description: "Switch light/dark mode", action: () => cycleMode() },
    { key: "T", label: "Cycle Theme", description: "Switch dynasty theme", action: () => cycleTheme() },
    {
      key: "s",
      label: "Toggle Sidebar",
      description: "Show/hide surah sidebar",
      action: () => {
        const s = stateRef.current;
        const wasVisible = s.showSidebar;
        setShowSidebar((prev) => !prev);
        if (wasVisible && s.focusedPanel === "sidebar") setFocusedPanel("arabic");
        if (!wasVisible) setFocusedPanel("sidebar");
      },
    },
    {
      key: "B",
      label: "Toggle Panel",
      description: "Show/hide activity panel",
      action: () => {
        const s = stateRef.current;
        const wasVisible = s.showPanel;
        setShowPanel((prev) => !prev);
        if (wasVisible && s.focusedPanel === "panel") setFocusedPanel("arabic");
        if (!wasVisible) {
          refreshPanelData();
          setFocusedPanel("panel");
        }
      },
    },
    { key: "+", label: "Zoom In Arabic", description: "Increase Arabic text size", action: () => setArabicZoom((prev) => Math.min(prev + 1, 5)) },
    { key: "-", label: "Zoom Out Arabic", description: "Decrease Arabic text size", action: () => setArabicZoom((prev) => Math.max(prev - 1, 0)) },
    {
      key: "b",
      label: "Toggle Bookmark",
      description: "Bookmark current verse",
      action: () => {
        const s = stateRef.current;
        const verseRef = `${s.selectedSurahId}:${s.currentVerseId}`;
        try {
          toggleBookmark(s.selectedSurahId, s.currentVerseId, verseRef);
          refreshBookmarks();
          if (s.showPanel) refreshPanelData();
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
        const s = stateRef.current;
        try {
          const existing = getReflection(s.selectedSurahId, s.currentVerseId);
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

  useKeyboard((key) => {
    const s = stateRef.current;
    // Ctrl+P: toggle command palette
    if (key.ctrl && key.name === "p") {
      setShowPalette((prev) => !prev);
      setPaletteIndex(0);
      return;
    }

    const str = key.sequence || key.name;

    if (s.showPalette) {
      if (key.name === "escape") {
        setShowPalette(false);
        return;
      }
      if (str === "j" || key.name === "down") {
        setPaletteIndex((prev) => (prev + 1) % paletteCommands.length);
        return;
      }
      if (str === "k" || key.name === "up") {
        setPaletteIndex((prev) => (prev - 1 + paletteCommands.length) % paletteCommands.length);
        return;
      }
      if (key.name === "return") {
        const cmd = paletteCommands[s.paletteIndex];
        if (cmd) {
          cmd.action();
          setShowPalette(false);
        }
        return;
      }
      return;
    }

    if (s.showReflectionDialog) {
      if (key.name === "escape") {
        setShowReflectionDialog(false);
        return;
      }
      if (key.name === "return") {
        const verseRef = `${s.selectedSurahId}:${s.currentVerseId}`;
        try {
          addReflection(s.selectedSurahId, s.currentVerseId, verseRef, s.reflectionInput);
          setShowReflectionDialog(false);
          refreshPanelData();
          showFlash("Reflection saved");
        } catch {
          /* DB */
        }
        return;
      }
      if (key.name === "backspace") {
        setReflectionInput((prev) => prev.slice(0, -1));
        return;
      }
      if (str && str.length === 1 && !key.ctrl && !key.meta) {
        setReflectionInput((prev) => prev + str);
        return;
      }
      return;
    }

    if (s.showHelp) {
      if (key.name === 'escape' || key.name === 'q' || str === '?') {
        setShowHelp(false);
      }
      return;
    }

    if (s.isSearchMode) {
      if (key.name === 'escape') {
        setIsSearchMode(false);
        setSearchInput("");
        setSearchResults([]);
        setSearchQuery("");
        return;
      }
      if (key.name === 'return') {
        const query = s.searchInput;
        if (query.trim().length > 0) {
          const results = search(query);
          setSearchResults(results);
          setSearchQuery(query);
        }
        setIsSearchMode(false);
        return;
      }
      if (key.name === 'backspace') {
        setSearchInput(prev => prev.slice(0, -1));
        return;
      }
      if (str && str.length === 1 && !key.ctrl && !key.meta) {
        setSearchInput(prev => prev + str);
        return;
      }
      return;
    }

    // --- Beyond this point: global shortcuts ---
    // When sidebar is focused, skip single-char shortcuts so SurahList
    // can use them for its own search/filtering.
    const sidebarActive = s.focusedPanel === "sidebar";

    if (key.name === 'q' && !sidebarActive) {
      process.exit(0);
    }

    if (str === '?' && !sidebarActive) {
      setShowHelp(true);
      return;
    }

    // When sidebar is focused, only allow Tab and Ctrl+P — skip everything else
    if (sidebarActive) {
      if (key.name === 'tab') {
        cycleFocus();
      }
      return;
    }

    if (s.focusedPanel === "panel") {
      const tabs: PanelTab[] = ["bookmarks", "cues", "reflections"];
      const items = s.panelTab === "bookmarks" ? s.allBookmarks :
                    s.panelTab === "cues" ? s.allCues : s.allReflections;

      if (key.name === "left" || str === "h") {
        const idx = tabs.indexOf(s.panelTab);
        setPanelTab(tabs[(idx - 1 + tabs.length) % tabs.length]!);
        setPanelIndex(0);
        return;
      }
      if (key.name === "right" || str === "l") {
        const idx = tabs.indexOf(s.panelTab);
        setPanelTab(tabs[(idx + 1) % tabs.length]!);
        setPanelIndex(0);
        return;
      }
      if (str === "j" || key.name === "down") {
        setPanelIndex((prev) => Math.min(prev + 1, Math.max(0, items.length - 1)));
        return;
      }
      if (str === "k" || key.name === "up") {
        setPanelIndex((prev) => Math.max(prev - 1, 0));
        return;
      }
      if (key.name === "return") {
        const item = items[s.panelIndex];
        if (item) {
          setSelectedSurahId(item.surah);
          setCurrentVerseId(item.ayah);
          refreshBookmarks();

          if (s.panelTab === "reflections") {
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
      const idx = LANGUAGES.indexOf(s.language as any);
      if (idx !== -1) {
        const next = LANGUAGES[(idx + 1) % LANGUAGES.length]!;
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
      const wasVisible = s.showSidebar;
      setShowSidebar(prev => !prev);
      if (wasVisible && s.focusedPanel === "sidebar") {
        setFocusedPanel("arabic");
      }
      if (!wasVisible) {
        setFocusedPanel("sidebar");
      }
      return;
    }

    if (str === 'B') {
      const wasVisible = s.showPanel;
      setShowPanel(prev => !prev);
      if (wasVisible && s.focusedPanel === "panel") {
        setFocusedPanel("arabic");
      }
      if (!wasVisible) {
        refreshPanelData();
        setFocusedPanel("panel");
      }
      return;
    }

    if (str === "R") {
      try {
        const existing = getReflection(s.selectedSurahId, s.currentVerseId);
        setReflectionInput(existing ? existing.note : "");
        setShowReflectionDialog(true);
      } catch {
        /* DB */
      }
      return;
    }

    if (str === '+' || str === '=') {
      setArabicZoom(prev => Math.min(prev + 1, 5));
      return;
    }
    if (str === '-') {
      setArabicZoom(prev => Math.max(prev - 1, 0));
      return;
    }

    if (key.name === 'tab') {
      cycleFocus();
      return;
    }

    if (str === '/') {
      setIsSearchMode(true);
      setSearchInput("");
      setFocusedPanel("arabic");
      return;
    }

    if (key.name === 'escape') {
      if (s.searchResults.length > 0) {
        setSearchResults([]);
        setSearchQuery("");
      }
      return;
    }

    if (isReaderPane(s.focusedPanel)) {
      const cueSetSymbols: Record<string, number> = {
        '!': 1, '@': 2, '#': 3, '$': 4, '%': 5, '^': 6, '&': 7, '*': 8, '(': 9
      };
      const cueJumpKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

      if (str && cueSetSymbols[str]) {
        const slot = cueSetSymbols[str]!;
        const verseRef = `${s.selectedSurahId}:${s.currentVerseId}`;
        try {
          setCue(slot, s.selectedSurahId, s.currentVerseId, verseRef);
          showFlash(`Cue ${slot} set \u2192 ${verseRef}`);
          if (s.showPanel) refreshPanelData();
        } catch { /* DB */ }
        return;
      }

      if (str && cueJumpKeys.includes(str)) {
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

      if (str === 'j' || key.name === 'down') {
        const surah = getSurah(s.selectedSurahId);
        if (surah && s.currentVerseId < surah.totalVerses) {
          setCurrentVerseId(prev => prev + 1);
        }
      }
      if (str === 'k' || key.name === 'up') {
        if (s.currentVerseId > 1) {
          setCurrentVerseId(prev => prev - 1);
        }
      }
      if (str === 'b') {
        const verseRef = `${s.selectedSurahId}:${s.currentVerseId}`;
        try {
          toggleBookmark(s.selectedSurahId, s.currentVerseId, verseRef);
          refreshBookmarks();
          if (s.showPanel) refreshPanelData();
        } catch {
          // DB may not be available
        }
      }
      if (str === 'h') {
        setShowHelp(true);
      }
    }
  });

  useEffect(() => {
    refreshBookmarks();
    refreshPanelData();
  }, []);

  const { theme } = useTheme();

  return (
    <RouteProvider>
      <Layout
        showSidebar={showSidebar}
        showPanel={showPanel}
        sidebarFocused={focusedPanel === "sidebar"}
        panelFocused={focusedPanel === "panel"}
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
                selectedId={selectedSurahId}
                focused={focusedPanel === "sidebar"}
                disabled={anyModalOpen}
              />
            </box>
          </box>
        }
        panel={
          <Panel
            bookmarks={allBookmarks}
            cues={allCues}
            reflections={allReflections}
            activeTab={panelTab}
            selectedIndex={panelIndex}
            focused={focusedPanel === "panel"}
          />
        }
      >
        <Reader
          surahId={selectedSurahId}
          focusedPane={focusedPanel}
          currentVerseId={currentVerseId}
          bookmarkedAyahs={bookmarkedAyahs}
          searchResults={searchResults}
          searchQuery={searchQuery}
          isSearchMode={isSearchMode}
          searchInput={searchInput}
          showArabic={showArabic}
          showTranslation={showTranslation}
          showTransliteration={showTransliteration}
          language={language}
          arabicZoom={arabicZoom}
          modalOpen={anyModalOpen}
        />
        {flashMessage && (
          <box
            position="absolute"
            bottom={2}
            right={2}
            padding={1}
            backgroundColor={theme.colors.secondary}
          >
            <text color={theme.colors.background}>{flashMessage}</text>
          </box>
        )}
        <HelpDialog visible={showHelp} />
        <CommandPalette
          visible={showPalette}
          commands={paletteCommands}
          selectedIndex={paletteIndex}
        />
        <ReflectionDialog
          visible={showReflectionDialog}
          verseRef={`${selectedSurahId}:${currentVerseId}`}
          note={reflectionInput}
          onClose={() => setShowReflectionDialog(false)}
          onSave={(note) => {
            addReflection(selectedSurahId, currentVerseId, `${selectedSurahId}:${currentVerseId}`, note);
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

const App: FC = () => {
  return (
    <ModeProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </ModeProvider>
  );
};

export default App;
