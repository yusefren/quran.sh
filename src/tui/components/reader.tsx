/** @jsxImportSource @opentui/solid */
import { Component, createMemo, Show } from "solid-js";
import { getSurah } from "../../data/quran";
import type { VerseRef } from "../../data/quran";
import { useTheme } from "../theme";
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

export const Reader: Component<ReaderProps> = (props) => {
  const { theme } = useTheme();
  const surah = createMemo(() => getSurah(props.surahId, props.language));
  const hasSearchResults = () =>
    (props.searchResults && props.searchResults.length > 0) || false;
  const spacing = () => props.verseSpacing ?? 1;

  const isArabicFocused = () => props.focusedPane === "arabic";
  const isTranslationFocused = () => props.focusedPane === "translation";
  const isTransliterationFocused = () => props.focusedPane === "transliteration";
  const isAnyReaderFocused = () => isArabicFocused() || isTranslationFocused() || isTransliterationFocused();

  const paneTitle = (label: string, focused: boolean, extra?: string) => {
    const t = theme();
    const icon = focused ? ` ${t.ornaments.focusIcon} ` : " ";
    const suffix = extra ? ` ${extra} ` : " ";
    return `${icon}${label}${suffix}`;
  };

  const searchTitle = () => {
    if (props.isSearchMode) return ` Search: ${props.searchInput ?? ""}_  `;
    if (hasSearchResults()) return ` Search: "${props.searchQuery}" (${props.searchResults!.length} results) `;
    return "";
  };

  const surahLabel = () => {
    const s = surah();
    if (!s) return "Reader";
    const t = theme();
    return `${t.ornaments.headerLeft} ${s.transliteration} ${t.ornaments.headerRight}`;
  };

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
    const t = theme();

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
        backgroundColor={t.colors.background}
      >
        {surah()!.verses.map((v) => {
          const isCurrent = v.id === (props.currentVerseId ?? 1);
          const isBookmarked = props.bookmarkedAyahs?.has(v.id) ?? false;
          const marker = isCurrent ? t.ornaments.verseMarker : " ";
          const bookmark = isBookmarked ? ` ${t.ornaments.bookmarkIcon}` : "";

          const verseNumColor = isCurrent ? t.colors.highlight : t.colors.verseNum;
          const bookmarkColor = t.colors.bookmark;

          let textContent: string;
          let textColor: string;

          if (mode === "arabic") {
            textContent = v.text;
            textColor = isCurrent ? t.colors.highlight : t.colors.arabic;
          } else if (mode === "translation") {
            textContent = v.translation;
            textColor = isCurrent ? t.colors.highlight : t.colors.translation;
          } else {
            textContent = v.transliteration || "";
            textColor = isCurrent ? t.colors.highlight : t.colors.transliteration;
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
      borderStyle={theme().borderStyle}
      borderColor={theme().colors.border}
      backgroundColor={theme().colors.background}
    >
      <box paddingBottom={1}>
        <text color={theme().colors.header} bold>
          {`Found ${props.searchResults!.length} result(s) for "${props.searchQuery}"`}
        </text>
      </box>
      <box paddingBottom={1}>
        <text color={theme().colors.muted}>{"Press ESC to return to surah view"}</text>
      </box>
      {props.searchResults!.map((r) => (
        <box flexDirection="column" paddingBottom={1}>
          <text color={theme().colors.verseNum} bold>
            {`  [${r.reference}]`}
          </text>
          <text color={theme().colors.translation}>{r.translation}</text>
        </box>
      ))}
    </scrollbox>
  );

  return (
    <box flexDirection="column" width="100%" height="100%" backgroundColor={theme().colors.background}>
      <Show when={props.isSearchMode}>
        <box height={1} width="100%" borderStyle={theme().borderStyle} borderColor={theme().colors.secondary}>
          <text color={theme().colors.secondary} bold>
            {"/"}{props.searchInput ?? ""}{"_"}
          </text>
        </box>
      </Show>

      <Show when={hasSearchResults() && !props.isSearchMode}>
        {renderSearchResults()}
      </Show>

      <Show when={!hasSearchResults() && !props.isSearchMode}>
        <Show when={!surah()}>
          <box
            width="100%"
            height="100%"
            borderStyle={theme().borderStyle}
            borderColor={theme().colors.border}
            title={paneTitle("Reader", false)}
            titleAlignment="left"
          >
            <text color={theme().colors.muted}>Surah not found</text>
          </box>
        </Show>
        <Show when={surah()}>
          <Show when={showArabic()}>
            <box
              height={bottomPaneCount() > 0 ? "50%" : "100%"}
              width="100%"
              overflow="hidden"
              borderStyle={isArabicFocused() ? theme().borderStyleFocused : theme().borderStyle}
              borderColor={isArabicFocused() ? theme().colors.borderFocused : theme().colors.border}
              focusedBorderColor={theme().colors.borderFocused}
              title={paneTitle(surahLabel(), isArabicFocused(), searchTitle())}
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
                  borderStyle={isTranslationFocused() ? theme().borderStyleFocused : theme().borderStyle}
                  borderColor={isTranslationFocused() ? theme().colors.borderFocused : theme().colors.border}
                  focusedBorderColor={theme().colors.borderFocused}
                  title={paneTitle("Translation", isTranslationFocused())}
                  titleAlignment="left"
                >
                  {renderVerseList("translation", isTranslationFocused())}
                </box>
              </Show>

              <Show when={showTransliteration()}>
                <box
                  width={showTranslation() ? "50%" : "100%"}
                  overflow="hidden"
                  borderStyle={isTransliterationFocused() ? theme().borderStyleFocused : theme().borderStyle}
                  borderColor={isTransliterationFocused() ? theme().colors.borderFocused : theme().colors.border}
                  focusedBorderColor={theme().colors.borderFocused}
                  title={paneTitle("Transliteration", isTransliterationFocused())}
                  titleAlignment="left"
                >
                  {renderVerseList("transliteration", isTransliterationFocused())}
                </box>
              </Show>
            </box>
          </Show>
        </Show>
      </Show>
    </box>
  );
};
