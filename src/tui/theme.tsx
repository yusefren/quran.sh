/** @jsxImportSource @opentui/solid */
import { createContext, useContext, createSignal, JSX, Component } from "solid-js";

export interface Theme {
  name: string;
  colors: {
    primary: string;      // Main accent color
    secondary: string;    // Secondary accent
    background: string;   // Background
    text: string;         // Primary text
    border: string;       // Border color
    highlight: string;    // Selected/focused item
    muted: string;        // Muted/dimmed text
  };
}

export const madinahTheme: Theme = {
  name: "madinah",
  colors: {
    primary: "green",      // Islamic green
    secondary: "cyan",
    background: "black",
    text: "white",
    border: "green",
    highlight: "yellow",
    muted: "gray",
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
