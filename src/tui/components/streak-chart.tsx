import { Component, For } from "solid-js";
import { getReadingStats } from "../../data/streaks.ts";

export const StreakChart: Component = () => {
  const stats = getReadingStats();
  const { activityGrid } = stats;

  // Generate last 28 days for a mini-chart (4 weeks)
  // We want to display them in a grid 7x4 or 4x7.
  // Let's do a horizontal calendar: 4 weeks.
  
  const days = Array.from({ length: 28 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (27 - i));
    return d.toISOString().split('T')[0];
  });

  const getSymbol = (count: number) => {
    // Using simple blocks with color prop if possible, or emojis.
    // Emojis are self-colored.
    if (count === 0) return "⬜";
    if (count < 5) return "🟩";
    if (count < 10) return "🟨";
    return "🟥";
  };

  return (
    <box flexDirection="column" borderStyle="round" borderColor="green" padding={1}>
      <text bold color="cyan">
        Reading Activity (Last 28 Days)
      </text>
      
      <box flexDirection="row" marginTop={1} marginBottom={1}>
        <text>Current Streak: {stats.currentStreak} 🔥</text>
        <text marginLeft={2}>Longest Streak: {stats.longestStreak} 🏆</text>
      </box>

      <box flexDirection="row" flexWrap="wrap" width={60}>
         <For each={days}>
            {(date) => {
               const count = activityGrid[date] || 0;
               return <text>{getSymbol(count)}</text>;
            }}
         </For>
      </box>
    </box>
  );
};
