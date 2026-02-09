/** @jsxImportSource @opentui/solid */
import { Component, Show } from "solid-js";
import { useTheme } from "../theme";

interface HelpDialogProps {
  visible: boolean;
}

export const HelpDialog: Component<HelpDialogProps> = (props) => {
  const { theme } = useTheme();

  const shortcuts = [
    { key: "Tab", desc: "Cycle focus (Sidebar \u2192 Arabic \u2192 Translation \u2192 Translit)" },
    { key: "\u2191/\u2193 j/k", desc: "Navigate surahs or verses" },
    { key: "Enter", desc: "Select surah (in Sidebar)" },
    { key: "b", desc: "Toggle bookmark (in Reader)" },
    { key: "a", desc: "Toggle Arabic pane" },
    { key: "t", desc: "Toggle Translation pane" },
    { key: "r", desc: "Toggle Transliteration pane" },
    { key: "l", desc: "Cycle Language" },
    { key: "s", desc: "Toggle Sidebar" },
    { key: "T", desc: "Cycle theme (dynasty/era)" },
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
        borderStyle={theme().borderStyleFocused}
        borderColor={theme().colors.header}
        flexDirection="column"
        padding={1}
        zIndex={100}
        backgroundColor={theme().colors.background}
        title={` ${theme().ornaments.focusIcon} Help `}
        titleAlignment="center"
      >
        <box justifyContent="center" marginBottom={1}>
          <text color={theme().colors.highlight} bold>
            {`${theme().ornaments.headerLeft} quran.sh Keyboard Shortcuts ${theme().ornaments.headerRight}`}
          </text>
        </box>

        <box flexDirection="column" flexGrow={1}>
          {shortcuts.map((s) => (
            <box marginBottom={0}>
              <text color={theme().colors.secondary} bold width={15}>
                {s.key}
              </text>
              <text color={theme().colors.text}>
                {s.desc}
              </text>
            </box>
          ))}
        </box>

        <box justifyContent="center" marginTop={1}>
          <text color={theme().colors.muted}>
            {`Theme: ${theme().name} (${theme().era}) ${theme().ornaments.sectionMarker} Press T to change`}
          </text>
        </box>
      </box>
    </Show>
  );
};
