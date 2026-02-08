import { Component, createMemo } from "solid-js";
import { getSurah } from "../../data/quran";

export interface ReaderProps {
  surahId: number;
  focused?: boolean;
}

export const Reader: Component<ReaderProps> = (props) => {
  const surah = createMemo(() => getSurah(props.surahId));

  return (
    <box
      flexDirection="column"
      width="100%"
      height="100%"
      borderStyle="single"
      borderColor="green"
      title={surah() ? ` ${surah()!.transliteration} ` : " Reader "}
    >
      {surah() ? (
        <scrollbox
          width="100%"
          height="100%"
          focusable={true}
          focused={props.focused ?? true}
          scrollable={true}
          scrollbar={true}
          flexDirection="column"
        >
          {surah()!.verses.map((v) => (
            <box flexDirection="column" paddingBottom={1} key={v.id}>
              <text color="yellow" bold>
                [{surah()!.id}:{v.id}]
              </text>
              <text>{v.translation}</text>
            </box>
          ))}
        </scrollbox>
      ) : (
        <box width="100%" height="100%" justifyContent="center" alignItems="center">
          <text color="red">Surah not found</text>
        </box>
      )}
    </box>
  );
};
