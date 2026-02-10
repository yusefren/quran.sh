import { useMemo, useEffect, useRef } from "react";
import { TextAttributes } from "@opentui/core";
import { getSurah } from "../../data/quran";
import type { VerseRef } from "../../data/quran";
import { useTheme } from "../theme";
import type { FocusablePane, ArabicAlign, ArabicWidth, ArabicFlow } from "../app";
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
  arabicAlign?: ArabicAlign;
  arabicWidth?: ArabicWidth;
  arabicFlow?: ArabicFlow;
  onVerseSelect?: (verseId: number) => void;
}

export function Reader(props: ReaderProps) {
  const { theme } = useTheme();
  const surah = useMemo(() => getSurah(props.surahId, props.language), [props.surahId, props.language]);
  const hasSearchResults =
    (props.searchResults && props.searchResults.length > 0) || false;
  const arabicZoom = props.arabicZoom ?? 0;

  const isArabicFocused = props.focusedPane === "arabic";
  const isTranslationFocused = props.focusedPane === "translation";
  const isTransliterationFocused = props.focusedPane === "transliteration";
  const isAnyReaderFocused = !props.modalOpen && (isArabicFocused || isTranslationFocused || isTransliterationFocused);

  // Refs for non-focused pane scroll sync
  const scrollRefs = useRef<Record<string, any>>({});

  // Sync all panes to currentVerseId
  useEffect(() => {
    if (props.currentVerseId === undefined) return;

    const timer = setTimeout(() => {
      ["arabic", "translation", "transliteration"].forEach(mode => {
        const ref = scrollRefs.current[mode];
        if (ref && typeof ref.getChildren === "function") {
          const children = ref.getChildren();
          const target = children[props.currentVerseId! - 1];
          if (target) {
            const y = target.getLayoutNode().getComputedTop();
            ref.scrollTo(y);
          }
        }
      });
    }, 50);

    return () => clearTimeout(timer);
  }, [props.currentVerseId]);

  const paneTitle = (label: string, focused: boolean, extra?: string) => {
    const icon = focused ? ` ${theme.ornaments.focusIcon} ` : " ";
    const suffix = extra ? ` ${extra} ` : " ";
    // Build progress bar from current verse position
    const totalVerses = surah?.verses.length ?? 0;
    const currentVerse = props.currentVerseId ?? 1;
    if (totalVerses === 0) return `${icon}${label}${suffix}`;
    const barWidth = 10;
    const filled = Math.round((currentVerse / totalVerses) * barWidth);
    const empty = barWidth - filled;
    const bar = theme.ornaments.progressFilled.repeat(filled) + theme.ornaments.progressEmpty.repeat(empty);
    const pct = Math.round((currentVerse / totalVerses) * 100);
    return `${icon}${label}${suffix}${bar} ${pct}% `;
  };

  const searchTitle = () => {
    if (props.isSearchMode) return ` Search: ${props.searchInput ?? ""}_  `;
    if (hasSearchResults) return ` Search: "${props.searchQuery}" (${props.searchResults!.length} results) `;
    return "";
  };

  const surahLabel = useMemo(() => {
    if (!surah) return "Reader";
    return `${theme.ornaments.headerLeft} ${surah.id}. ${surah.transliteration} · ${surah.translation} ${theme.ornaments.headerRight}`;
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

    const arabicAlign = props.arabicAlign ?? "right";
    const arabicWidth = props.arabicWidth ?? "100%";
    const arabicFlow = props.arabicFlow ?? "verse";
    const isArabic = mode === "arabic";

    // Map alignment names to flexbox values (for text within verse boxes)
    const alignMap = { right: "flex-end", center: "center", left: "flex-start" } as const;
    const textAlign = isArabic ? alignMap[arabicAlign] : "flex-start";
    // Center the verse boxes in the scrollbox when width is constrained
    const containerAlign = isArabic && arabicWidth !== "100%" ? "center" : textAlign;

    // Continuous flow mode for Arabic: join all verses into one text block
    if (isArabic && arabicFlow === "continuous") {
      const parts = surah.verses.map((v) => {
        const text = renderArabicVerse(v.text, arabicZoom);
        const isCurrent = v.id === (props.currentVerseId ?? 1);
        const marker = theme.ornaments.sectionMarker;
        return `${text} ${marker}${v.id}${marker}`;
      });

      return (
        <scrollbox
          ref={(el: any) => { scrollRefs.current[mode] = el; }}
          width="100%"
          height="100%"
          margin="auto"
          focusable={true}
          focused={focused}
          scrollY={true}
          flexDirection="column"
          overflow="hidden"
          alignItems={containerAlign}
          backgroundColor={theme.colors.background}
          viewportCulling={true}
        >
          <box maxWidth={arabicWidth} paddingLeft={2} paddingRight={2}>
            <text fg={theme.colors.arabic} attributes={TextAttributes.BOLD}>
              {parts.join("  ")}
            </text>
          </box>
        </scrollbox>
      );
    }

    return (
      <scrollbox
        ref={(el: any) => { scrollRefs.current[mode] = el; }}
        width="100%"
        height="100%"
        focusable={true}
        focused={focused}
        scrollY={true}
        flexDirection="column"
        overflow="hidden"
        alignItems={containerAlign}
        backgroundColor={theme.colors.background}
                viewportCulling={true}
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
              paddingLeft={isArabic ? 2 : 0}
              marginLeft={isArabic && (textAlign === "center" || textAlign === "flex-end" )  ? "auto" : "0%"}
              marginRight={isArabic && (textAlign === "center" || textAlign === "flex-start" ) ? "auto" : "0%"}
              paddingRight={isArabic ? 2 : 0}
              maxWidth={isArabic ? arabicWidth : "100%"}
              alignItems={isArabic ? textAlign : "flex-start"}
              justifyContent={isArabic ? textAlign : "flex-start"}
              onMouseDown={() => {
                if (props.onVerseSelect) props.onVerseSelect(v.id);
              }}
            >
              <text fg={verseNumColor} attributes={TextAttributes.BOLD}>
                {marker} {v.id}{isBookmarked ? <span fg={bookmarkColor}>{bookmark}</span> : ""}
              </text>
              <text fg={textColor} attributes={mode === "arabic" ? TextAttributes.BOLD : TextAttributes.NONE}>
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
      scrollY={true}
      flexDirection="column"
      overflow="hidden"
      borderStyle={theme.borderStyle}
      borderColor={theme.colors.border}
      backgroundColor={theme.colors.background}
      viewportCulling={true}
    >
      <box paddingBottom={1}>
        <text fg={theme.colors.header} attributes={TextAttributes.BOLD}>
          {`Found ${props.searchResults!.length} result(s) for "${props.searchQuery}"`}
        </text>
      </box>
      <box paddingBottom={1}>
        <text fg={theme.colors.muted}>{"Press ESC to return to surah view"}</text>
      </box>
      {props.searchResults!.map((r) => (
        <box key={r.reference} flexDirection="column" paddingBottom={1}>
          <text fg={theme.colors.verseNum} attributes={TextAttributes.BOLD}>
            {`  [${r.reference}]`}
          </text>
          <text fg={theme.colors.translation}>{r.translation}</text>
        </box>
      ))}
    </scrollbox>
  );

  return (
    <box flexDirection="column" width="100%" height="100%" backgroundColor={theme.colors.background}>
      {props.isSearchMode && (
        <box height={1} width="100%" borderStyle={theme.borderStyle} borderColor={theme.colors.secondary}>
          <text fg={theme.colors.secondary} attributes={TextAttributes.BOLD}>
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
              <text fg={theme.colors.muted}>Surah not found</text>
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
                      title={paneTitle("Translation", isTranslationFocused, `[${(props.language ?? "en").toUpperCase()}]`)}
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
