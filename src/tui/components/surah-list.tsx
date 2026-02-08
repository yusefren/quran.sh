import { Component, createSignal, onMount } from "solid-js";
import { getSurah, TOTAL_SURAHS } from "../../data/quran";

interface SurahOption {
  name: string;
  description: string;
  value: number;
}

export interface SurahListProps {
  onSelect?: (surahId: number) => void;
  initialSelectedId?: number;
}

export const SurahList: Component<SurahListProps> = (props) => {
  let selectRef: any;

  onMount(() => {
    if (selectRef) {
      // Force focusable to true in case it's disabled by default
      if ('focusable' in selectRef) {
        selectRef.focusable = true;
      }
      
      if (typeof selectRef.focus === "function") {
        selectRef.focus();
      }
    }
  });

  const options = Array.from({ length: TOTAL_SURAHS }, (_, i) => {
    const id = i + 1;
    const surah = getSurah(id);
    if (!surah) return { name: "Unknown", description: "", value: id };
    
    return {
      name: `${id}. ${surah.transliteration}`,
      description: surah.translation,
      value: id,
    };
  });

  const [selectedIndex, setSelectedIndex] = createSignal(
    props.initialSelectedId ? props.initialSelectedId - 1 : 0
  );

  return (
    <select
      ref={selectRef}
      width="100%"
      height="100%"
      options={options}
      selectedIndex={selectedIndex()}
      on:itemSelected={(e: any) => {
        const detail = e.detail !== undefined ? e.detail : e;
        
        let option;
        if (typeof detail === 'number') {
           option = options[detail];
        } else {
           option = detail;
        }

        if (option && option.value) {
          props.onSelect?.(option.value);
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
      focused={true}
    />
  );
};
