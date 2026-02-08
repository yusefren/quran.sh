/** @jsxImportSource @opentui/solid */
import { Component, Show } from "solid-js";
import { useTheme } from "../app";

interface HelpDialogProps {
  visible: boolean;
}

export const HelpDialog: Component<HelpDialogProps> = (props) => {
  const theme = useTheme();

  const shortcuts = [
    { key: "Tab", desc: "Cycle focus (Sidebar → Arabic → Translation → Translit)" },
    { key: "↑/↓ j/k", desc: "Navigate surahs or verses" },
    { key: "Enter", desc: "Select surah (in Sidebar)" },
    { key: "b", desc: "Toggle bookmark (in Reader)" },
    { key: "a", desc: "Toggle Arabic pane" },
    { key: "t", desc: "Toggle Translation pane" },
    { key: "r", desc: "Toggle Transliteration pane" },
    { key: "l", desc: "Cycle Language" },
    { key: "s", desc: "Toggle Sidebar" },
    { key: "+/-", desc: "Increase/decrease verse spacing" },
    { key: "/", desc: "Search verses" },
    { key: "?", desc: "Show/hide this help dialog" },
    { key: "ESC", desc: "Dismiss dialog / Clear search" },
    { key: "q", desc: "Quit application" },
  ];

  return (
    <Show when={props.visible}>
      <box
        position="absolute"
        top="10%"
        left="15%"
        width="70%"
        height="80%"
        borderStyle="heavy"
        borderColor={theme.colors.header}
        flexDirection="column"
        padding={1}
        zIndex={100}
        backgroundColor={theme.colors.background}
        title=" ◆ Help "
        titleAlignment="center"
      >
        <box justifyContent="center" marginBottom={1}>
          <text color={theme.colors.highlight} bold>
            {"━━━ quran.sh Keyboard Shortcuts ━━━"}
          </text>
        </box>

        <box flexDirection="column" flexGrow={1}>
          {shortcuts.map((s) => (
            <box marginBottom={0}>
              <text color={theme.colors.secondary} bold width={15}>
                {s.key}
              </text>
              <text color={theme.colors.text}>
                {s.desc}
              </text>
            </box>
          ))}
        </box>

        <box justifyContent="center" marginTop={1}>
          <text color={theme.colors.muted}>
            {"Press ESC or ? to close"}
          </text>
        </box>
      </box>
    </Show>
  );
};
