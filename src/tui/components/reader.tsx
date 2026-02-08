/** @jsxImportSource @opentui/solid */
import { Component, createMemo } from "solid-js";
import { getSurah } from "../../data/quran";
import type { VerseRef } from "../../data/quran";
import { useTheme } from "../app";

export interface ReaderProps {
  surahId: number;
  focused?: boolean;
  /** 1-based ayah ID of the currently selected verse */
  currentVerseId?: number;
  /** Set of ayah IDs that are bookmarked for the current surah */
  bookmarkedAyahs?: Set<number>;
  /** Search results to display instead of surah content */
  searchResults?: VerseRef[];
  /** The query that produced the search results */
  searchQuery?: string;
  /** Whether the search input is currently active */
  isSearchMode?: boolean;
  /** Current search input text (while typing) */
  searchInput?: string;
  /** Whether to show the Arabic text */
  showArabic?: boolean;
  /** Whether to show the translation text */
  showTranslation?: boolean;
  /** Whether to show the transliteration text */
  showTransliteration?: boolean;
  /** The language code for translation (e.g. "en", "fr") */
  language?: string;
}

export const Reader: Component<ReaderProps> = (props) => {
  const theme = useTheme();
  const surah = createMemo(() => getSurah(props.surahId, props.language));
  const hasSearchResults = () =>
    (props.searchResults && props.searchResults.length > 0) || false;

  // Determine the title for the reader panel
  const panelTitle = () => {
    if (props.isSearchMode) return " Search: _ ";
    if (hasSearchResults()) return ` Search: "${props.searchQuery}" (${props.searchResults!.length} results) `;
    return surah() ? ` ${surah()!.transliteration} ` : " Reader ";
  };

  return (
    <box
      flexDirection="column"
      width="100%"
      height="100%"
      borderStyle="single"
      borderColor={theme.colors.border}
      title={panelTitle()}
    >
      {/* Search input bar */}
      {props.isSearchMode && (
        <box height={1} width="100%">
          <text color={theme.colors.secondary} bold>
            {"/"}{props.searchInput ?? ""}{"_"}
          </text>
        </box>
      )}

      {/* Search results mode */}
      {hasSearchResults() && !props.isSearchMode ? (
        <scrollbox
          width="100%"
          height="100%"
          focusable={true}
          focused={props.focused ?? true}
          scrollable={true}
          scrollbar={true}
          flexDirection="column"
        >
          <box paddingBottom={1}>
            <text color={theme.colors.secondary} bold>
              {`Found ${props.searchResults!.length} result(s) for "${props.searchQuery}"`}
            </text>
          </box>
          <box paddingBottom={1}>
            <text color={theme.colors.muted}>{"Press ESC to return to surah view"}</text>
          </box>
          {props.searchResults!.map((r) => (
            <box flexDirection="column" paddingBottom={1}>
              <text color={theme.colors.highlight} bold>
                {`  [${r.reference}]`}
              </text>
              <text color={theme.colors.text}>{r.translation}</text>
            </box>
          ))}
        </scrollbox>
      ) : !props.isSearchMode ? (
        /* Normal surah view */
        surah() ? (
          <scrollbox
            width="100%"
            height="100%"
            focusable={true}
            focused={props.focused ?? true}
            scrollable={true}
            scrollbar={true}
            flexDirection="column"
          >
            {surah()!.verses.map((v) => {
              const isCurrent = v.id === (props.currentVerseId ?? 1);
              const isBookmarked = props.bookmarkedAyahs?.has(v.id) ?? false;
              const marker = isCurrent ? ">" : " ";
              const bookmark = isBookmarked ? " *" : "";

              // Defaults: Arabic and Translation on, Transliteration off
              const showArabic = props.showArabic ?? true;
              const showTranslation = props.showTranslation ?? true;
              const showTransliteration = props.showTransliteration ?? false;

              return (
                <box flexDirection="column" paddingBottom={1} key={v.id}>
                  <text color={isCurrent ? theme.colors.secondary : theme.colors.highlight} bold>
                    {marker} [{surah()!.id}:{v.id}]{bookmark}
                  </text>
                  
                  {showArabic && (
                    <text bold color={theme.colors.text}>
                      {v.text}
                    </text>
                  )}

                  {showTransliteration && v.transliteration && (
                    <text color={theme.colors.secondary} italic>
                      {v.transliteration}
                    </text>
                  )}

                  {showTranslation && (
                    <text color={theme.colors.text}>
                      {v.translation}
                    </text>
                  )}
                </box>
              );
            })}
          </scrollbox>
        ) : (
          <box width="100%" height="100%" justifyContent="center" alignItems="center">
            <text color="red">Surah not found</text>
          </box>
        )
      ) : null}
    </box>
  );
};
