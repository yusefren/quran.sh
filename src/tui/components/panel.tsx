import { type FC, useMemo } from "react";
import { useTheme } from "../theme";
import type { Bookmark } from "../../data/bookmarks";
import type { Cue } from "../../data/cues";
import type { Reflection } from "../../data/reflections";

export type PanelTab = "bookmarks" | "cues" | "reflections";

interface PanelProps {
  bookmarks: Bookmark[];
  cues: Cue[];
  reflections: Reflection[];
  activeTab: PanelTab;
  selectedIndex: number;
  focused: boolean;
}

export const Panel: FC<PanelProps> = (props) => {
  const { theme } = useTheme();

  const currentItems = useMemo(() => {
    if (props.activeTab === "bookmarks") return props.bookmarks;
    if (props.activeTab === "cues") return props.cues;
    return props.reflections;
  }, [props.activeTab, props.bookmarks, props.cues, props.reflections]);

  const tabTitle = (tab: PanelTab, label: string) => {
    const isActive = props.activeTab === tab;
    if (isActive) {
      return `\u25C2 ${label} \u25B8`;
    }
    return `  ${label}  `;
  };

  return (
    <box
      flexDirection="column"
      width="100%"
      height="100%"
      backgroundColor={theme.colors.background}
    >
      {/* Tab Header */}
      <box
        flexDirection="row"
        justifyContent="space-around"
        borderStyle="single"
        borderColor={theme.colors.border}
        padding={0}
        height={3}
        alignItems="center"
      >
        <text color={props.activeTab === "bookmarks" ? theme.colors.highlight : theme.colors.muted} bold={props.activeTab === "bookmarks"}>
          {tabTitle("bookmarks", "Bookmarks")}
        </text>
        <text color={props.activeTab === "cues" ? theme.colors.highlight : theme.colors.muted} bold={props.activeTab === "cues"}>
          {tabTitle("cues", "Cues")}
        </text>
        <text color={props.activeTab === "reflections" ? theme.colors.highlight : theme.colors.muted} bold={props.activeTab === "reflections"}>
          {tabTitle("reflections", "Reflections")}
        </text>
      </box>

      {/* Item List */}
      <scrollbox
        flexGrow={1}
        width="100%"
        scrollable={true}
        scrollbar={true}
        focusable={true}
        focused={props.focused}
        viewportCulling={true}
        backgroundColor={theme.colors.background}
      >
        {currentItems.length === 0 && (
          <box padding={1} justifyContent="center">
            <text color={theme.colors.muted}>No items found</text>
          </box>
        )}
        {currentItems.map((item, i) => {
          const isSelected = i === props.selectedIndex;
          
          let label: string;
          let subLabel: string | null = null;

          if (props.activeTab === "bookmarks") {
            const b = item as Bookmark;
            label = b.verseRef;
            subLabel = b.label;
          } else if (props.activeTab === "cues") {
            const c = item as Cue;
            label = `Cue ${c.slot}: ${c.verseRef}`;
          } else {
            const r = item as Reflection;
            label = r.verseRef;
            subLabel = r.note.length > 20 ? r.note.substring(0, 17) + "..." : r.note;
          }

          return (
            <box
              key={`${props.activeTab}-${i}`}
              paddingLeft={1}
              paddingRight={1}
              backgroundColor={isSelected && props.focused ? theme.colors.border : "transparent"}
            >
              <text
                color={isSelected ? theme.colors.highlight : theme.colors.text}
                bold={isSelected}
              >
                {isSelected ? `${theme.ornaments.verseMarker} ` : "  "}{label}
              </text>
              {subLabel && (
                <text color={theme.colors.muted}>
                  {`  ${subLabel}`}
                </text>
              )}
            </box>
          );
        })}
      </scrollbox>

      {/* Footer / Help */}
      <box height={1} paddingLeft={1} backgroundColor={theme.colors.statusBar}>
        <text color={theme.colors.muted} size="small">
          {"\u2190\u2192 Tab  \u2191\u2193 Item  Ent Jump"}
        </text>
      </box>
    </box>
  );
};
