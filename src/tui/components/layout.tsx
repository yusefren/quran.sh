/** @jsxImportSource @opentui/solid */
import { type Component, type JSX, Show } from "solid-js";
import { SurahList } from "./surah-list";
import { useRoute } from "../router";
import { useTheme } from "../theme";

export interface LayoutProps {
  sidebar?: JSX.Element;
  children?: JSX.Element;
  showSidebar?: boolean;
  sidebarFocused?: boolean;
}

export const Layout: Component<LayoutProps> = (props) => {
  const { theme } = useTheme();
  const { navigate } = useRoute();
  const sidebarVisible = () => props.showSidebar ?? true;
  const sidebarFocused = () => props.sidebarFocused ?? false;

  return (
    <box flexDirection="column" width="100%" height="100%">
      <box flexDirection="row" width="100%" flexGrow={1}>
        <Show when={sidebarVisible()}>
          <box
            width="30%"
            overflow="hidden"
            borderStyle={sidebarFocused() ? theme().borderStyleFocused : theme().borderStyle}
            borderColor={sidebarFocused() ? theme().colors.borderFocused : theme().colors.border}
            focusedBorderColor={theme().colors.borderFocused}
            title={sidebarFocused() ? ` ${theme().ornaments.focusIcon} Surahs ` : " Surahs "}
            titleAlignment="left"
          >
            {props.sidebar || <SurahList onSelect={(id) => navigate(`/surah/${id}`)} />}
          </box>
        </Show>

        <box
          width={sidebarVisible() ? "70%" : "100%"}
          overflow="hidden"
          flexDirection="column"
        >
          {props.children}
        </box>
      </box>

      {/* Status bar — dynasty name + era */}
      <box height={1} width="100%">
        <text color={theme().colors.secondary}>
          {` ${theme().ornaments.focusIcon} ${theme().name} — ${theme().era} ${theme().ornaments.focusIcon} `}
        </text>
      </box>
    </box>
  );
};
