/** @jsxImportSource @opentui/solid */
import { createContext, useContext, createSignal, createMemo, onMount, JSX, Component } from "solid-js";
import { getPreference, setPreference } from "../data/preferences.ts";

export type ColorMode = "dark" | "light" | "auto";

interface ModeContextType {
  mode: () => ColorMode;
  resolvedMode: () => "dark" | "light";
  setMode: (m: ColorMode) => void;
  cycleMode: () => void;
}

const ModeContext = createContext<ModeContextType>();

/**
 * Auto-detect terminal color scheme using COLORFGBG environment variable.
 * Common terminal convention: "fg;bg". Background index > 6 typically means light background.
 */
function detectTerminalMode(): "dark" | "light" {
  const colorfgbg = process.env.COLORFGBG;
  if (!colorfgbg) return "dark";

  try {
    const parts = colorfgbg.split(";");
    if (parts.length < 2) return "dark";
    const bg = parseInt(parts[1], 10);
    // Standard xterm-256color: colors 0-6 are dark, 7-15 vary but usually 7 is light gray, 15 white.
    // Simple heuristic: bg > 6 is likely a light background terminal.
    return bg > 6 ? "light" : "dark";
  } catch {
    return "dark";
  }
}

export const ModeProvider: Component<{ children: JSX.Element }> = (props) => {
  const initialMode = (getPreference("color_mode") as ColorMode) || "auto";
  const [mode, setModeInternal] = createSignal<ColorMode>(initialMode);
  const [detectedMode, setDetectedMode] = createSignal<"dark" | "light">("dark");

  onMount(() => {
    setDetectedMode(detectTerminalMode());
  });

  const resolvedMode = createMemo(() => {
    const m = mode();
    if (m === "auto") return detectedMode();
    return m;
  });

  const setMode = (m: ColorMode) => {
    setModeInternal(m);
    setPreference("color_mode", m);
  };

  const cycleMode = () => {
    const current = mode();
    if (current === "auto") setMode("dark");
    else if (current === "dark") setMode("light");
    else setMode("auto");
  };

  return (
    <ModeContext.Provider value={{ mode, resolvedMode, setMode, cycleMode }}>
      {props.children}
    </ModeContext.Provider>
  );
};

export const useMode = () => {
  const context = useContext(ModeContext);
  if (!context) throw new Error("useMode must be used within a ModeProvider");
  return context;
};
