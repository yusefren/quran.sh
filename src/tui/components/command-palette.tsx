/** @jsxImportSource @opentui/solid */
import { Component, Show } from "solid-js";
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

export const CommandPalette: Component<CommandPaletteProps> = (props) => {
  const { theme } = useTheme();

  return (
    <Show when={props.visible}>
      <box
        position="absolute"
        top="15%"
        left="20%"
        width="60%"
        height="70%"
        borderStyle={theme().borderStyleFocused}
        borderColor={theme().colors.header}
        flexDirection="column"
        padding={1}
        zIndex={100}
        backgroundColor={theme().colors.background}
        title={` ${theme().ornaments.focusIcon} Command Palette `}
        titleAlignment="center"
      >
        <box justifyContent="center" marginBottom={1}>
          <text color={theme().colors.highlight} bold>
            {`${theme().ornaments.headerLeft} Commands ${theme().ornaments.headerRight}`}
          </text>
        </box>

        <box flexDirection="column" flexGrow={1}>
          {props.commands.map((cmd, i) => {
            const isSelected = () => i === props.selectedIndex;
            return (
              <box marginBottom={0}>
                <text
                  color={isSelected() ? theme().colors.highlight : theme().colors.secondary}
                  bold
                  width={10}
                >
                  {isSelected() ? `${theme().ornaments.verseMarker} ` : "  "}{cmd.key}
                </text>
                <text
                  color={isSelected() ? theme().colors.highlight : theme().colors.text}
                  bold={isSelected()}
                >
                  {cmd.label}
                </text>
                <text color={theme().colors.muted}>
                  {`  ${cmd.description}`}
                </text>
              </box>
            );
          })}
        </box>

        <box justifyContent="center" marginTop={1}>
          <text color={theme().colors.muted}>
            {`j/k Navigate  Enter Select  Esc Close`}
          </text>
        </box>
      </box>
    </Show>
  );
};
