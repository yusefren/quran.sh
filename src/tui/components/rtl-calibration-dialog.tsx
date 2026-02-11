import { useState, useRef } from "react";
import { TextAttributes } from "@opentui/core";
import { useKeyboard, useTerminalDimensions } from "@opentui/react";
import { useTheme } from "../theme";
import {
  RTL_STRATEGIES,
  RTL_STRATEGY_LABELS,
  applyStrategy,
  type RtlStrategy,
} from "../utils/rtl";

const BASMALA = "بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ";

/** Lines consumed per strategy item (label row + preview row + border). */
const ITEM_HEIGHT = 3;
/** Lines reserved for header + instructions + footer + padding. */
const CHROME_LINES = 12;

interface RtlCalibrationDialogProps {
  onDone: (strategy: RtlStrategy) => void;
}

export function RtlCalibrationDialog(props: RtlCalibrationDialogProps) {
  const { theme } = useTheme();
  const { height: rows } = useTerminalDimensions();
  const [selectedIndex, setSelectedIndex] = useState(5); // default to reshaped_reversed
  const windowStartRef = useRef(0);

  useKeyboard((key) => {
    const str = key.sequence || key.name;
    if (key.name === "up" || str === "k") {
      setSelectedIndex((i) => Math.max(0, i - 1));
    } else if (key.name === "down" || str === "j") {
      setSelectedIndex((i) => Math.min(RTL_STRATEGIES.length - 1, i + 1));
    } else if (key.name === "return") {
      props.onDone(RTL_STRATEGIES[selectedIndex]!);
    }
  });

  // Stable window: only shift when selection escapes the visible range
  const maxVisible = Math.max(3, Math.floor((rows - CHROME_LINES) / ITEM_HEIGHT));
  const total = RTL_STRATEGIES.length;
  let ws = windowStartRef.current;
  if (selectedIndex < ws) ws = selectedIndex;                             // scrolled above
  else if (selectedIndex >= ws + maxVisible) ws = selectedIndex - maxVisible + 1; // scrolled below
  ws = Math.max(0, Math.min(ws, total - maxVisible));                     // clamp
  windowStartRef.current = ws;

  const visibleItems = RTL_STRATEGIES.slice(ws, ws + maxVisible);
  const aboveCount = ws;
  const belowCount = total - (ws + visibleItems.length);

  return (
    <box
      position="absolute"
      top="0%"
      left="0%"
      width="100%"
      height="100%"
      flexDirection="column"
      padding={2}
      zIndex={200}
      backgroundColor={theme.colors.background}
    >
      {/* Header */}
      <box justifyContent="center" marginBottom={1}>
        <text fg={theme.colors.highlight} attributes={TextAttributes.BOLD}>
          {`${theme.ornaments.headerLeft} Arabic Rendering Calibration ${theme.ornaments.headerRight}`}
        </text>
      </box>

      <box justifyContent="center">
        <text fg={theme.colors.muted}>
          {"Terminals render Arabic text differently. Pick the option where"}
        </text>
      </box>
      <box justifyContent="center" marginBottom={1}>
        <text fg={theme.colors.muted}>
          {"the Basmala below looks correct — connected and right-to-left."}
        </text>
      </box>
      <box justifyContent="center" marginBottom={1}>
        <text fg={theme.colors.secondary}>
          {"Use ↑/↓ to navigate, Enter to confirm"}
        </text>
      </box>

      {/* "More above" indicator */}
      {aboveCount > 0 && (
        <box justifyContent="center">
          <text fg={theme.colors.muted}>
            {`▲ ${aboveCount} more above`}
          </text>
        </box>
      )}

      {/* Strategy list (windowed) */}
      <box flexDirection="column" flexGrow={1}>
        {visibleItems.map((strategy) => {
          const idx = RTL_STRATEGIES.indexOf(strategy);
          const isSelected = idx === selectedIndex;
          const label = RTL_STRATEGY_LABELS[strategy];
          const preview = applyStrategy(BASMALA, strategy);
          const marker = isSelected ? theme.ornaments.verseMarker : " ";
          const labelColor = isSelected
            ? theme.colors.highlight
            : theme.colors.secondary;
          const textColor = isSelected
            ? theme.colors.arabic
            : theme.colors.muted;
          const bgColor = isSelected
            ? theme.colors.statusBar
            : theme.colors.background;

          return (
            <box
              key={strategy}
              flexDirection="column"
              paddingLeft={1}
              paddingRight={1}
              backgroundColor={bgColor}
            >
              <box flexDirection="row">
                <text
                  fg={labelColor}
                  attributes={TextAttributes.BOLD}
                  width={4}
                >
                  {`${marker}${String(idx + 1).padStart(2)}`}
                </text>
                <text
                  fg={labelColor}
                  attributes={TextAttributes.BOLD}
                >
                  {` ${label}`}
                </text>
              </box>
              <box paddingLeft={4}>
                <text
                  fg={textColor}
                  attributes={TextAttributes.BOLD}
                >
                  {preview}
                </text>
              </box>
            </box>
          );
        })}
      </box>

      {/* "More below" indicator */}
      {belowCount > 0 && (
        <box justifyContent="center">
          <text fg={theme.colors.muted}>
            {`▼ ${belowCount} more below`}
          </text>
        </box>
      )}

      {/* Footer */}
      <box justifyContent="center" marginTop={1}>
        <text fg={theme.colors.muted}>
          {`${selectedIndex + 1}/${RTL_STRATEGIES.length} — Re-run anytime from Command Palette (Ctrl+P)`}
        </text>
      </box>
    </box>
  );
}
