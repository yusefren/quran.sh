/** @jsxImportSource @opentui/solid */
import { Component, createSignal, onMount, createMemo, Show } from "solid-js";
import { getSurah, TOTAL_SURAHS } from "../../data/quran";
import { useTheme } from "../theme";
import { useKeyboard } from "@opentui/solid";

interface SurahOption {
  name: string;
  description: string;
  value: number;
}

export interface SurahListProps {
  onSelect?: (surahId: number) => void;
  initialSelectedId?: number;
  focused?: boolean;
}

export const SurahList: Component<SurahListProps> = (props) => {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = createSignal("");
  let selectRef: any;

  onMount(() => {
    if (selectRef) {
      if ('focusable' in selectRef) {
        selectRef.focusable = true;
      }
      if (typeof selectRef.focus === "function") {
        selectRef.focus();
      }
    }
  });

  useKeyboard((key) => {
    if (!props.focused) return;

    if (key.name === "backspace") {
      setSearchQuery((prev) => prev.slice(0, -1));
      return;
    }

    if (key.name === "escape") {
      setSearchQuery("");
      return;
    }

    const char = key.sequence || key.name;
    if (char && char.length === 1 && !key.ctrl && !key.meta && /^[a-zA-Z0-9\s-]$/.test(char)) {
      setSearchQuery((prev) => prev + char);
    }
  });

  const allOptions = createMemo(() => {
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
  });

  const filteredOptions = createMemo(() => {
    const query = searchQuery().toLowerCase();
    if (!query) return allOptions();
    
    return allOptions().filter((opt) => 
      opt.name.toLowerCase().includes(query) || 
      opt.description.toLowerCase().includes(query) ||
      opt.value.toString().includes(query)
    );
  });

  const [selectedIndex, setSelectedIndex] = createSignal(0);

  // Sync initial selection
  createMemo(() => {
    if (props.initialSelectedId && !searchQuery()) {
      setSelectedIndex(props.initialSelectedId - 1);
    } else {
       // Reset to top on search
       setSelectedIndex(0);
    }
  });

  return (
    <box flexDirection="column" width="100%" height="100%">
      <Show when={searchQuery().length > 0}>
        <box height={3} borderStyle={theme().borderStyle} borderColor={theme().colors.highlight} padding={0}>
          <text color={theme().colors.highlight}>{` Search: ${searchQuery()} `}</text>
        </box>
      </Show>
      
      <select
        ref={selectRef}
        width="100%"
        height="100%"
        options={filteredOptions()}
        selectedIndex={selectedIndex()}
        on:itemSelected={(e: any) => {
          const detail = e.detail !== undefined ? e.detail : e;
          let option;
          if (typeof detail === 'number') {
             option = filteredOptions()[detail];
          } else {
             option = detail;
          }

          if (option && option.value) {
            props.onSelect?.(option.value);
            // Clear search after selection to return to full list
            setSearchQuery("");
          }
        }}
        on:selectionChanged={(e: any) => {
          const detail = e.detail !== undefined ? e.detail : e;
          if (typeof detail === 'number') {
             setSelectedIndex(detail);
          }
        }}
        showScrollIndicator={true}
        showDescription={true}
        focusable={true}
        focused={props.focused ?? true}
        style={{
          selectedColor: theme().colors.highlight,
          selectedBold: true,
          borderColor: theme().colors.primary,
        }}
      />
    </box>
  );
};
