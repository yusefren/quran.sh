/** @jsxImportSource @opentui/solid */
import { Component, createMemo, Show } from "solid-js";
import { getSurah } from "../../data/quran";
import type { VerseRef } from "../../data/quran";
import { useTheme } from "../app";
import type { FocusablePane } from "../app";

export interface ReaderProps {
  surahId: number;
  focusedPane: FocusablePane;
  currentVerseId?: number;
  bookmarkedAyahs?: Set<number>;
  searchResults?: VerseRef[];
  searchQuery?: string;
  isSearchMode?: boolean;
  searchInput?: string;
  showArabic?: boolean;
  showTranslation?: boolean;
  showTransliteration?: boolean;
  language?: string;
  verseSpacing?: number;
}

const PaneTitle = (label: string, focused: boolean, extra?: string) => {
  const icon = focused ? " ◆ " : " ";
  const suffix = extra ? ` ${extra} ` : " ";
  return `${icon}${label}${suffix}`;
};

export const Reader: Component<ReaderProps> = (props) => {
  const theme = useTheme();
  const surah = createMemo(() => getSurah(props.surahId, props.language));
  const hasSearchResults = () =>
    (props.searchResults && props.searchResults.length > 0) || false;
  const spacing = () => props.verseSpacing ?? 1;

  const isArabicFocused = () => props.focusedPane === "arabic";
  const isTranslationFocused = () => props.focusedPane === "translation";
  const isTransliterationFocused = () => props.focusedPane === "transliteration";
  const isAnyReaderFocused = () => isArabicFocused() || isTranslationFocused() || isTransliterationFocused();

  const searchTitle = () => {
    if (props.isSearchMode) return ` Search: ${props.searchInput ?? ""}_  `;
    if (hasSearchResults()) return ` Search: "${props.searchQuery}" (${props.searchResults!.length} results) `;
    return "";
  };

  const surahLabel = () => surah() ? surah()!.transliteration : "Reader";

  const showTranslation = () => props.showTranslation ?? true;
  const showTransliteration = () => props.showTransliteration ?? false;
  const showArabic = () => props.showArabic ?? true;

  const bottomPaneCount = () => {
    let count = 0;
    if (showTranslation()) count++;
    if (showTransliteration()) count++;
    return count;
  };

  const renderVerseList = (
    mode: "arabic" | "translation" | "transliteration",
    focused: boolean,
  ) => {
    if (!surah()) return null;

    return (
      <scrollbox
        width="100%"
        height="100%"
        focusable={true}
        focused={focused}
        scrollable={true}
        scrollbar={true}
        flexDirection="column"
        overflow="hidden"
      >
        {surah()!.verses.map((v) => {
          const isCurrent = v.id === (props.currentVerseId ?? 1);
          const isBookmarked = props.bookmarkedAyahs?.has(v.id) ?? false;
          const marker = isCurrent ? "▸" : " ";
          const bookmark = isBookmarked ? " ★" : "";

          const verseNumColor = isCurrent ? theme.colors.highlight : theme.colors.verseNum;
          const bookmarkColor = theme.colors.bookmark;

          let textContent: string;
          let textColor: string;

          if (mode === "arabic") {
            textContent = v.text;
            textColor = isCurrent ? theme.colors.highlight : theme.colors.arabic;
          } else if (mode === "translation") {
            textContent = v.translation;
            textColor = isCurrent ? theme.colors.highlight : theme.colors.translation;
          } else {
            textContent = v.transliteration || "";
            textColor = isCurrent ? theme.colors.highlight : theme.colors.transliteration;
          }

          return (
            <box flexDirection="column" paddingBottom={spacing()}>
              <text color={verseNumColor} bold>
                {marker} [{surah()!.id}:{v.id}]{isBookmarked ? <span color={bookmarkColor}>{bookmark}</span> : ""}
              </text>
              <text color={textColor} bold={mode === "arabic"}>
                {textContent}
              </text>
            </box>
          );
        })}
      </scrollbox>
    );
  };

  const renderSearchResults = () => (
    <scrollbox
      width="100%"
      height="100%"
      focusable={true}
      focused={isAnyReaderFocused()}
      scrollable={true}
      scrollbar={true}
      flexDirection="column"
      overflow="hidden"
      borderStyle="rounded"
      borderColor={theme.colors.border}
    >
      <box paddingBottom={1}>
        <text color={theme.colors.header} bold>
          {`Found ${props.searchResults!.length} result(s) for "${props.searchQuery}"`}
        </text>
      </box>
      <box paddingBottom={1}>
        <text color={theme.colors.muted}>{"Press ESC to return to surah view"}</text>
      </box>
      {props.searchResults!.map((r) => (
        <box flexDirection="column" paddingBottom={1}>
          <text color={theme.colors.verseNum} bold>
            {`  [${r.reference}]`}
          </text>
          <text color={theme.colors.translation}>{r.translation}</text>
        </box>
      ))}
    </scrollbox>
  );

  return (
    <box flexDirection="column" width="100%" height="100%">
      <Show when={props.isSearchMode}>
        <box height={1} width="100%" borderStyle="rounded" borderColor={theme.colors.secondary}>
          <text color={theme.colors.secondary} bold>
            {"/"}{props.searchInput ?? ""}{"_"}
          </text>
        </box>
      </Show>

      <Show when={hasSearchResults() && !props.isSearchMode}>
        {renderSearchResults()}
      </Show>

      <Show when={!hasSearchResults() && !props.isSearchMode}>
        <Show when={showArabic()}>
          <box
            height={bottomPaneCount() > 0 ? "50%" : "100%"}
            width="100%"
            overflow="hidden"
            borderStyle={isArabicFocused() ? "heavy" : "rounded"}
            borderColor={isArabicFocused() ? theme.colors.borderFocused : theme.colors.border}
            focusedBorderColor={theme.colors.borderFocused}
            title={PaneTitle(surahLabel(), isArabicFocused(), searchTitle())}
            titleAlignment="left"
          >
            {renderVerseList("arabic", isArabicFocused())}
          </box>
        </Show>

        <Show when={bottomPaneCount() > 0}>
          <box
            flexDirection="row"
            height={showArabic() ? "50%" : "100%"}
            width="100%"
          >
            <Show when={showTranslation()}>
              <box
                width={showTransliteration() ? "50%" : "100%"}
                overflow="hidden"
                borderStyle={isTranslationFocused() ? "heavy" : "rounded"}
                borderColor={isTranslationFocused() ? theme.colors.borderFocused : theme.colors.border}
                focusedBorderColor={theme.colors.borderFocused}
                title={PaneTitle("Translation", isTranslationFocused())}
                titleAlignment="left"
              >
                {renderVerseList("translation", isTranslationFocused())}
              </box>
            </Show>

            <Show when={showTransliteration()}>
              <box
                width={showTranslation() ? "50%" : "100%"}
                overflow="hidden"
                borderStyle={isTransliterationFocused() ? "heavy" : "rounded"}
                borderColor={isTransliterationFocused() ? theme.colors.borderFocused : theme.colors.border}
                focusedBorderColor={theme.colors.borderFocused}
                title={PaneTitle("Transliteration", isTransliterationFocused())}
                titleAlignment="left"
              >
                {renderVerseList("transliteration", isTransliterationFocused())}
              </box>
            </Show>
          </box>
        </Show>
      </Show>
    </box>
  );
};
