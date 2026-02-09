/** @jsxImportSource @opentui/solid */
import { Component, Show } from "solid-js";
import { useTheme } from "../theme";

interface ReflectionDialogProps {
  visible: boolean;
  verseRef: string;
  note: string;
  onClose: () => void;
  onSave: (note: string) => void;
  onInput: (text: string) => void;
}

export const ReflectionDialog: Component<ReflectionDialogProps> = (props) => {
  const { theme } = useTheme();

  return (
    <Show when={props.visible}>
      <box
        position="absolute"
        top="25%"
        left="20%"
        width="60%"
        height="40%"
        borderStyle={theme().borderStyleFocused}
        borderColor={theme().colors.secondary}
        flexDirection="column"
        padding={1}
        zIndex={200}
        backgroundColor={theme().colors.background}
        title={` ${theme().ornaments.focusIcon} Reflection: ${props.verseRef} `}
        titleAlignment="center"
      >
        <box marginBottom={1}>
          <text color={theme().colors.muted}>
            {"Type your reflection below. Press Enter to save, Esc to cancel."}
          </text>
        </box>

        <box
          flexGrow={1}
          borderStyle="single"
          borderColor={theme().colors.border}
          padding={1}
        >
          <text color={theme().colors.text}>
            {props.note}{"_"}
          </text>
        </box>

        <box justifyContent="center" marginTop={1}>
          <text color={theme().colors.muted}>
            {"Enter: Save  Esc: Cancel  Backspace: Delete"}
          </text>
        </box>
      </box>
    </Show>
  );
};
