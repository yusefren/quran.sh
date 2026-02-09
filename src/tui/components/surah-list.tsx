import { type FC, useState, useMemo, useRef, useCallback } from "react";
import { useKeyboard } from "@opentui/react";
import { getSurah, TOTAL_SURAHS } from "../../data/quran";
import { useTheme } from "../theme";

export interface SurahListProps {
  onSelect?: (surahId: number) => void;
  initialSelectedId?: number;
  focused?: boolean;
  disabled?: boolean;
}

export const SurahList: FC<SurahListProps> = (props) => {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  const allOptions = useMemo(() => {
    return Array.from({ length: TOTAL_SURAHS }, (_, i) => {
      const id = i + 1;
      const surah = getSurah(id);
      if (!surah) return { name: "Unknown", description: "", value: id };

      return {
        name: `${id}. ${surah.transliteration}`,
        description: surah.translation,
        value: id,
      };
    });
  }, []);

  const filteredOptions = useMemo(() => {
    const query = searchQuery.toLowerCase();
    if (!query) return allOptions;

    return allOptions.filter(
      (opt) =>
        opt.name.toLowerCase().includes(query) ||
        opt.description.toLowerCase().includes(query) ||
        opt.value.toString().includes(query)
    );
  }, [searchQuery, allOptions]);

  const [selectedIndex, setSelectedIndex] = useState(
    props.initialSelectedId ? props.initialSelectedId - 1 : 0
  );

  const isFocused = !props.disabled && (props.focused ?? true);

  // Press `/` while the select list is focused to jump into the search input
  useKeyboard((key) => {
    if (!isFocused || searchFocused) return;
    const str = key.sequence || key.name;
    if (str === "/") {
      setSearchFocused(true);
    }
  });

  return (
    <box flexDirection="column" width="100%" height="100%">
      <box
        height={3}
        borderStyle={theme.borderStyle}
        customBorderChars={theme.borderChars}
        borderColor={searchFocused ? theme.colors.highlight : theme.colors.border}
        padding={0}
      >
        <input
          width="100%"
          placeholder=" 🔍 / to search..."
          value={searchQuery}
          focused={isFocused && searchFocused}
          focusable={true}
          onInput={(value: string) => setSearchQuery(value)}
          onSubmit={() => {
            // Enter → return focus to the select list
            setSearchFocused(false);
          }}
        />
      </box>

      <select
        width="100%"
        height="100%"
        options={filteredOptions}
        selectedIndex={selectedIndex}
        onChange={(index: number) => {
          setSelectedIndex(index);
        }}
        onSelect={(index: number) => {
          const option = filteredOptions[index];
          if (option && option.value) {
            props.onSelect?.(option.value);
            setSearchQuery("");
          }
        }}
        showScrollIndicator={true}
        showDescription={true}
        focusable={true}
        focused={isFocused && !searchFocused}
        style={{
          selectedColor: theme.colors.highlight,
          selectedBold: true,
          borderColor: theme.colors.primary,
        }}
      />
    </box>
  );
};
