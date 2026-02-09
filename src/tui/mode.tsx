import { createContext, useContext, useState, useMemo, useEffect, type ReactNode } from "react";
import { getPreference, setPreference } from "../data/preferences.ts";

export type ColorMode = "dark" | "light" | "auto";

interface ModeContextType {
  mode: ColorMode;
  resolvedMode: "dark" | "light";
  setMode: (m: ColorMode) => void;
  cycleMode: () => void;
}

const ModeContext = createContext<ModeContextType | undefined>(undefined);

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
    const bg = parseInt(parts[1]!, 10);
    // Standard xterm-256color: colors 0-6 are dark, 7-15 vary but usually 7 is light gray, 15 white.
    // Simple heuristic: bg > 6 is likely a light background terminal.
    return bg > 6 ? "light" : "dark";
  } catch {
    return "dark";
  }
}

export function ModeProvider({ children }: { children: ReactNode }) {
  const initialMode = (getPreference("color_mode") as ColorMode) || "auto";
  const [mode, setModeInternal] = useState<ColorMode>(initialMode);
  const [detectedMode, setDetectedMode] = useState<"dark" | "light">("dark");

  useEffect(() => {
    setDetectedMode(detectTerminalMode());
  }, []);

  const resolvedMode = useMemo(() => {
    if (mode === "auto") return detectedMode;
    return mode;
  }, [mode, detectedMode]);

  const setMode = (m: ColorMode) => {
    setModeInternal(m);
    setPreference("color_mode", m);
  };

  const cycleMode = () => {
    if (mode === "auto") setMode("dark");
    else if (mode === "dark") setMode("light");
    else setMode("auto");
  };

  return (
    <ModeContext.Provider value={{ mode, resolvedMode, setMode, cycleMode }}>
      {children}
    </ModeContext.Provider>
  );
};

export const useMode = () => {
  const context = useContext(ModeContext);
  if (!context) throw new Error("useMode must be used within a ModeProvider");
  return context;
};
