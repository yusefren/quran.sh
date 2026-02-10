import { TextAttributes } from "@opentui/core";
import { useKeyboard } from "@opentui/react";
import { useTheme } from "../theme";

interface MarkSurahDialogProps {
  visible: boolean;
  surahName: string;
  onConfirm: () => void;
  onDismiss: () => void;
}

export function MarkSurahDialog(props: MarkSurahDialogProps) {
  const { theme } = useTheme();

  useKeyboard((key) => {
    if (!props.visible) return;
    const str = key.sequence || key.name;
    if (str === "y" || str === "Y") {
      props.onConfirm();
    }
    if (str === "n" || str === "N" || key.name === "escape") {
      props.onDismiss();
    }
  });

  if (!props.visible) return null;

  return (
    <box
      position="absolute"
      top="35%"
      left="25%"
      width="50%"
      height={9}
      borderStyle={theme.borderStyleFocused}
      customBorderChars={theme.borderChars}
      borderColor={theme.colors.highlight}
      flexDirection="column"
      padding={1}
      zIndex={100}
      backgroundColor={theme.colors.background}
      title={` ${theme.ornaments.focusIcon} Mark Surah as Read? `}
      titleAlignment="center"
    >
      <box justifyContent="center" marginBottom={1}>
        <text fg={theme.colors.text}>
          {`Mark ${theme.ornaments.headerLeft} ${props.surahName} ${theme.ornaments.headerRight} as fully read?`}
        </text>
      </box>

      <box justifyContent="center">
        <text fg={theme.colors.secondary} attributes={TextAttributes.BOLD}>
          {"  [Y] Yes    [N] No  "}
        </text>
      </box>

      <box justifyContent="center" marginTop={1}>
        <text fg={theme.colors.muted}>
          {"This logs all verses in the surah to your reading activity."}
        </text>
      </box>
    </box>
  );
}
