import { TextAttributes } from "@opentui/core";
import { useTheme } from "../theme";

export interface CommandItem {
  key: string;
  label: string;
  description: string;
}

interface CommandPaletteProps {
  visible: boolean;
  commands: CommandItem[];
  selectedIndex: number;
}

export function CommandPalette(props: CommandPaletteProps) {
  const { theme } = useTheme();

  if (!props.visible) return null;

  return (
    <box
      position="absolute"
      top="15%"
      left="20%"
      width="60%"
      height="70%"
      borderStyle={theme.borderStyleFocused}
      customBorderChars={theme.borderChars}
      borderColor={theme.colors.header}
      flexDirection="column"
      padding={1}
      zIndex={100}
      backgroundColor={theme.colors.background}
      title={` ${theme.ornaments.focusIcon} Command Palette `}
      titleAlignment="center"
    >
      <box justifyContent="center" marginBottom={1}>
        <text fg={theme.colors.highlight} attributes={TextAttributes.BOLD}>
          {`${theme.ornaments.headerLeft} Commands ${theme.ornaments.headerRight}`}
        </text>
      </box>

      <box flexDirection="column" flexGrow={1} overflow="hidden">
        {props.commands.map((cmd, i) => {
          const isSelected = i === props.selectedIndex;
          return (
            <box key={cmd.key} flexDirection="row" marginBottom={0}>
              <text
                fg={isSelected ? theme.colors.highlight : theme.colors.secondary}
                attributes={TextAttributes.BOLD}
                width={10}
              >
                {isSelected ? `${theme.ornaments.verseMarker} ` : "  "}{cmd.key}
              </text>
              <text
                fg={isSelected ? theme.colors.highlight : theme.colors.text}
                attributes={isSelected ? TextAttributes.BOLD : 0}
                width={22}
              >
                {cmd.label}
              </text>
              <text fg={theme.colors.muted} flexGrow={1}>
                {cmd.description}
              </text>
            </box>
          );
        })}
      </box>

      <box justifyContent="center" marginTop={1}>
        <text fg={theme.colors.muted}>
          {`j/k Navigate  Enter Select  Esc Close`}
        </text>
      </box>
    </box>
  );
};
