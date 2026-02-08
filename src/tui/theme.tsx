/** @jsxImportSource @opentui/solid */
import { createContext, useContext, createSignal, JSX, Component } from "solid-js";

export interface Theme {
  name: string;
  colors: {
    primary: string;        // Main accent color
    secondary: string;      // Secondary accent
    background: string;     // Background
    text: string;           // Primary text
    border: string;         // Border color (unfocused)
    borderFocused: string;  // Border color (focused pane)
    highlight: string;      // Selected/focused item
    muted: string;          // Muted/dimmed text
    arabic: string;         // Arabic text color
    translation: string;    // Translation text color
    transliteration: string;// Transliteration text color
    verseNum: string;       // Verse number color
    bookmark: string;       // Bookmark indicator color
    header: string;         // Panel header/title color
    statusBar: string;      // Status bar background
  };
}

export const madinahTheme: Theme = {
  name: "madinah",
  colors: {
    primary: "#2E7D32",        // Deep Islamic green
    secondary: "#00ACC1",      // Teal accent
    background: "#000000",     // Terminal black
    text: "#E0E0E0",           // Soft white (easier on eyes)
    border: "#2E7D32",         // Green borders (unfocused)
    borderFocused: "#00E676",  // Bright green (focused pane)
    highlight: "#FFD54F",      // Warm amber highlight
    muted: "#757575",          // Dimmed gray
    arabic: "#D4A574",         // Warm gold for Arabic script
    translation: "#E0E0E0",   // Clean white for translation
    transliteration: "#4DD0E1",// Bright teal for transliteration
    verseNum: "#81C784",       // Soft green for verse numbers
    bookmark: "#FFD54F",       // Amber bookmark star
    header: "#00E676",         // Bright green headers
    statusBar: "#1B5E20",      // Dark green status bar
  },
};

export const defaultTheme = madinahTheme;

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>();

export const ThemeProvider: Component<{ children: JSX.Element }> = (props) => {
  const [theme, setTheme] = createSignal(defaultTheme);

  return (
    <ThemeContext.Provider value={{ theme: theme(), setTheme }}>
      {props.children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider");
  return context.theme;
};
