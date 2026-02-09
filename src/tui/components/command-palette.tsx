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
        <text color={theme.colors.highlight} bold>
          {`${theme.ornaments.headerLeft} Commands ${theme.ornaments.headerRight}`}
        </text>
      </box>

      <box flexDirection="column" flexGrow={1}>
        {props.commands.map((cmd, i) => {
          const isSelected = i === props.selectedIndex;
          return (
            <box key={cmd.key} marginBottom={0}>
              <text
                color={isSelected ? theme.colors.highlight : theme.colors.secondary}
                bold
                width={10}
              >
                {isSelected ? `${theme.ornaments.verseMarker} ` : "  "}{cmd.key}
              </text>
              <text
                color={isSelected ? theme.colors.highlight : theme.colors.text}
                bold={isSelected}
              >
                {cmd.label}
              </text>
              <text color={theme.colors.muted}>
                {`  ${cmd.description}`}
              </text>
            </box>
          );
        })}
      </box>

      <box justifyContent="center" marginTop={1}>
        <text color={theme.colors.muted}>
          {`j/k Navigate  Enter Select  Esc Close`}
        </text>
      </box>
    </box>
  );
};
