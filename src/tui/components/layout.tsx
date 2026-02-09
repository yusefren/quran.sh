import { type ReactNode } from "react";
import { SurahList } from "./surah-list";
import { useRoute } from "../router";
import { useTheme } from "../theme";
import { useMode } from "../mode";

export interface LayoutProps {
  sidebar?: ReactNode;
  panel?: ReactNode;
  children?: ReactNode;
  showSidebar?: boolean;
  showPanel?: boolean;
  sidebarFocused?: boolean;
  panelFocused?: boolean;
}

export function Layout(props: LayoutProps) {
  const { theme } = useTheme();
  const { mode, resolvedMode } = useMode();
  const { navigate } = useRoute();
  const sidebarVisible = props.showSidebar ?? true;
  const panelVisible = props.showPanel ?? false;
  const sidebarFocused = props.sidebarFocused ?? false;
  const panelFocused = props.panelFocused ?? false;

  const getReaderWidth = () => {
    let width = 100;
    if (sidebarVisible) width -= 25;
    if (panelVisible) width -= 25;
    return `${width}%`;
  };

  return (
    <box flexDirection="column" width="100%" height="100%" backgroundColor={theme.colors.background}>
      <box flexDirection="row" width="100%" flexGrow={1}>
        {sidebarVisible && (
          <box
            width="25%"
            overflow="hidden"
            borderStyle={sidebarFocused ? theme.borderStyleFocused : theme.borderStyle}
            borderColor={sidebarFocused ? theme.colors.borderFocused : theme.colors.border}
            customBorderChars={theme.borderChars}
            focusedBorderColor={theme.colors.borderFocused}
            title={sidebarFocused ? ` ${theme.ornaments.focusIcon} Surahs ` : " Surahs "}
            titleAlignment="left"
            backgroundColor={theme.colors.background}
          >
            {props.sidebar || <SurahList onSelect={(id) => navigate(`/surah/${id}`)} />}
          </box>
        )}

        <box
          width={getReaderWidth()}
          overflow="hidden"
          flexDirection="column"
          backgroundColor={theme.colors.background}
        >
          {props.children}
        </box>

        {panelVisible && (
          <box
            width="25%"
            overflow="hidden"
            borderStyle={panelFocused ? theme.borderStyleFocused : theme.borderStyle}
            borderColor={panelFocused ? theme.colors.borderFocused : theme.colors.border}
            customBorderChars={theme.borderChars}
            focusedBorderColor={theme.colors.borderFocused}
            title={panelFocused ? ` ${theme.ornaments.focusIcon} Activity ` : " Activity "}
            titleAlignment="left"
            backgroundColor={theme.colors.background}
          >
            {props.panel}
          </box>
        )}
      </box>

      {/* Status bar — dynasty name + era + mode */}
      <box height={1} width="100%" backgroundColor={theme.colors.statusBar} flexDirection="row" justifyContent="space-between">
        <text color={theme.colors.secondary}>
          {` ${theme.ornaments.focusIcon} ${theme.name} — ${theme.era} ${theme.ornaments.focusIcon} `}
        </text>
        <text color={theme.colors.muted}>
          {` Mode: ${mode.toUpperCase()}${mode === "auto" ? ` (${resolvedMode})` : ""} `}
        </text>
      </box>
    </box>
  );
};
