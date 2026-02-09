import { type FC, useMemo, useEffect, useRef } from "react";
import { getSurah } from "../../data/quran";
import type { VerseRef } from "../../data/quran";
import { useTheme } from "../theme";
import type { FocusablePane } from "../app";
import { renderArabicVerse } from "../utils/rtl";

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
  arabicZoom?: number;
  modalOpen?: boolean;
}

export const Reader: FC<ReaderProps> = (props) => {
  const { theme } = useTheme();
  const surah = useMemo(() => getSurah(props.surahId, props.language), [props.surahId, props.language]);
  const hasSearchResults =
    (props.searchResults && props.searchResults.length > 0) || false;
  const arabicZoom = props.arabicZoom ?? 0;

  const isArabicFocused = props.focusedPane === "arabic";
  const isTranslationFocused = props.focusedPane === "translation";
  const isTransliterationFocused = props.focusedPane === "transliteration";
  const isAnyReaderFocused = !props.modalOpen && (isArabicFocused || isTranslationFocused || isTransliterationFocused);

  const scrollRefs = useRef<Record<string, any>>({});
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (props.currentVerseId === undefined) return;

    // Clear any previous timer
    if (timerRef.current) clearTimeout(timerRef.current);

    // Small delay to ensure layout has updated
    timerRef.current = setTimeout(() => {
      ["arabic", "translation", "transliteration"].forEach(mode => {
        const ref = scrollRefs.current[mode];
        if (ref && typeof ref.getChildren === "function") {
          const children = ref.getChildren();
          const target = children[props.currentVerseId! - 1];
          if (target) {
            const viewportHeight = ref.getLayoutNode().getComputedHeight();
            const verseHeight = target.getLayoutNode().getComputedHeight();
            const centerY = target.y - (viewportHeight / 2) + (verseHeight / 2);
            ref.scrollTo(Math.max(0, centerY));
          }
        }
      });
    }, 10);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [props.currentVerseId]);

  const paneTitle = (label: string, focused: boolean, extra?: string) => {
    const icon = focused ? ` ${theme.ornaments.focusIcon} ` : " ";
    const suffix = extra ? ` ${extra} ` : " ";
    return `${icon}${label}${suffix}`;
  };

  const searchTitle = () => {
    if (props.isSearchMode) return ` Search: ${props.searchInput ?? ""}_  `;
    if (hasSearchResults) return ` Search: "${props.searchQuery}" (${props.searchResults!.length} results) `;
    return "";
  };

  const surahLabel = useMemo(() => {
    if (!surah) return "Reader";
    return `${theme.ornaments.headerLeft} ${surah.transliteration} ${theme.ornaments.headerRight}`;
  }, [surah, theme.ornaments.headerLeft, theme.ornaments.headerRight]);

  const showTranslation = props.showTranslation ?? true;
  const showTransliteration = props.showTransliteration ?? false;
  const showArabic = props.showArabic ?? true;

  const bottomPaneCount = (showTranslation ? 1 : 0) + (showTransliteration ? 1 : 0);

  const renderVerseList = (
    mode: "arabic" | "translation" | "transliteration",
    focused: boolean,
  ) => {
    if (!surah) return null;

    return (
      <scrollbox
        ref={(el: any) => { scrollRefs.current[mode] = el; }}
        width="100%"
        height="100%"
        focusable={true}
        focused={focused}
        scrollable={true}
        scrollbar={true}
        flexDirection="column"
        overflow="hidden"
        backgroundColor={theme.colors.background}
                viewportCulling={true}
                verticalScrollbarOptions={{
                  trackOptions: {
                    character: " ",
                  },
                  thumbOptions: {
                    character: theme.ornaments.scrollbarThumb,
                  }
                }}
              >
                {surah.verses.map((v) => {

          const isCurrent = v.id === (props.currentVerseId ?? 1);
          const isBookmarked = props.bookmarkedAyahs?.has(v.id) ?? false;
          const marker = isCurrent ? theme.ornaments.verseMarker : " ";
          const bookmark = isBookmarked ? ` ${theme.ornaments.bookmarkIcon}` : "";

          const verseNumColor = isCurrent ? theme.colors.highlight : theme.colors.verseNum;
          const bookmarkColor = theme.colors.bookmark;

          let textContent: string;
          let textColor: string;

          if (mode === "arabic") {
            textContent = renderArabicVerse(v.text, arabicZoom);
            console.log("textContent",v.text == textContent, v.text, `|||||||||`,textContent)
            textColor = isCurrent ? theme.colors.highlight : theme.colors.arabic;
          } else if (mode === "translation") {
            textContent = v.translation;
            textColor = isCurrent ? theme.colors.highlight : theme.colors.translation;
          } else {
            textContent = v.transliteration || "";
            textColor = isCurrent ? theme.colors.highlight : theme.colors.transliteration;
          }


          return (
            <box
              key={`${mode}-${v.id}`}
              flexDirection="column"
              paddingBottom={1}
              paddingLeft={mode === "arabic" ? 2 : 0}
              paddingRight={mode === "arabic" ? 2 : 0}
              alignItems={mode === "arabic" ? "flex-end" : "flex-start"}
            >
              <text color={verseNumColor} bold>
                {marker} [{surah.id}:{v.id}]{isBookmarked ? <span color={bookmarkColor}>{bookmark}</span> : ""}
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
      focused={isAnyReaderFocused}
      scrollable={true}
      scrollbar={true}
      flexDirection="column"
      overflow="hidden"
      borderStyle={theme.borderStyle}
      borderColor={theme.colors.border}
      backgroundColor={theme.colors.background}
      viewportCulling={true}
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
        <box key={r.reference} flexDirection="column" paddingBottom={1}>
          <text color={theme.colors.verseNum} bold>
            {`  [${r.reference}]`}
          </text>
          <text color={theme.colors.translation}>{r.translation}</text>
        </box>
      ))}
    </scrollbox>
  );

  return (
    <box flexDirection="column" width="100%" height="100%" backgroundColor={theme.colors.background}>
      {props.isSearchMode && (
        <box height={1} width="100%" borderStyle={theme.borderStyle} borderColor={theme.colors.secondary}>
          <text color={theme.colors.secondary} bold>
            {"/"}{props.searchInput ?? ""}{"_"}
          </text>
        </box>
      )}

      {hasSearchResults && !props.isSearchMode && renderSearchResults()}

      {!hasSearchResults && !props.isSearchMode && (
        <>
          {!surah ? (
            <box
              width="100%"
              height="100%"
              borderStyle={theme.borderStyle}
              borderColor={theme.colors.border}
              title={paneTitle("Reader", false)}
              titleAlignment="left"
            >
              <text color={theme.colors.muted}>Surah not found</text>
            </box>
          ) : (
            <>
              {showArabic && (
                <box
                  height={bottomPaneCount > 0 ? "50%" : "100%"}
                  width="100%"
                  overflow="hidden"
                  borderStyle={isArabicFocused ? theme.borderStyleFocused : theme.borderStyle}
                  borderColor={isArabicFocused ? theme.colors.borderFocused : theme.colors.border}
                  customBorderChars={theme.borderChars}
                  focusedBorderColor={theme.colors.borderFocused}
                  title={paneTitle(surahLabel, isArabicFocused, searchTitle())}
                  titleAlignment="left"
                >
                  {renderVerseList("arabic", isArabicFocused)}
                </box>
              )}

              {bottomPaneCount > 0 && (
                <box
                  flexDirection="row"
                  height={showArabic ? "50%" : "100%"}
                  width="100%"
                >
                  {showTranslation && (
                    <box
                      width={showTransliteration ? "50%" : "100%"}
                      overflow="hidden"
                      borderStyle={isTranslationFocused ? theme.borderStyleFocused : theme.borderStyle}
                      borderColor={isTranslationFocused ? theme.colors.borderFocused : theme.colors.border}
                      customBorderChars={theme.borderChars}
                      focusedBorderColor={theme.colors.borderFocused}
                      title={paneTitle("Translation", isTranslationFocused)}
                      titleAlignment="left"
                    >
                      {renderVerseList("translation", isTranslationFocused)}
                    </box>
                  )}

                  {showTransliteration && (
                    <box
                      width={showTranslation ? "50%" : "100%"}
                      overflow="hidden"
                      borderStyle={isTransliterationFocused ? theme.borderStyleFocused : theme.borderStyle}
                      borderColor={isTransliterationFocused ? theme.colors.borderFocused : theme.colors.border}
                      customBorderChars={theme.borderChars}
                      focusedBorderColor={theme.colors.borderFocused}
                      title={paneTitle("Transliteration", isTransliterationFocused)}
                      titleAlignment="left"
                    >
                      {renderVerseList("transliteration", isTransliterationFocused)}
                    </box>
                  )}
                </box>
              )}
            </>
          )}
        </>
      )}
    </box>
  );
};
