import { useState } from "react";
import { getPeriodStats, STATS_PERIODS, PERIOD_LABELS } from "../../data/stats";
import type { PeriodStats } from "../../data/stats";
import { useTheme } from "../theme";

export interface ReadingStatsProps {
  sessionStart: string;
}

export function ReadingStats(props: ReadingStatsProps) {
  const { theme } = useTheme();
  const [periodIndex, setPeriodIndex] = useState(0);

  const period = STATS_PERIODS[periodIndex] ?? "today";

  let stats: PeriodStats;
  try {
    stats = getPeriodStats(period, props.sessionStart);
  } catch {
    stats = { versesRead: 0, uniqueVerses: 0, surahsTouched: 0, surahsCompleted: 0 };
  }

  const tabOptions = STATS_PERIODS.map((p) => ({
    name: PERIOD_LABELS[p],
    description: "",
  }));

  const rows: { label: string; value: number; fg: string }[] = [
    { label: "Verses", value: stats.versesRead, fg: theme.colors.highlight },
    { label: "Unique", value: stats.uniqueVerses, fg: theme.colors.secondary },
    { label: "Surahs", value: stats.surahsTouched, fg: theme.colors.primary },
    { label: "Complete", value: stats.surahsCompleted, fg: theme.colors.header },
  ];

  return (
    <box
      flexDirection="column"
      borderStyle={theme.borderStyle}
      customBorderChars={theme.borderChars}
      borderColor={theme.colors.border}
      width="100%"
      height="100%"
    >
      <tab-select
        options={tabOptions}
        onChange={(index: number) => setPeriodIndex(index)}
        onSelect={(index: number) => setPeriodIndex(index)}
        focused={false}
      />
      <box flexDirection="column" paddingLeft={1} paddingRight={1}>
        {rows.map((row) => (
          <box key={row.label} flexDirection="row" justifyContent="space-between">
            <text fg={theme.colors.text}>{row.label}</text>
            <text fg={row.fg}><strong>{String(row.value)}</strong></text>
          </box>
        ))}
      </box>
    </box>
  );
}
