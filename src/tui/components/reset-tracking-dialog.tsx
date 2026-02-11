import { TextAttributes } from "@opentui/core";
import { useKeyboard } from "@opentui/react";
import { useState } from "react";
import { useTheme } from "../theme";
import { RESET_PERIODS, RESET_LABELS } from "../../data/log";
import type { ResetPeriod } from "../../data/log";

interface ResetTrackingDialogProps {
  visible: boolean;
  onConfirm: (period: ResetPeriod) => void;
  onDismiss: () => void;
}

export function ResetTrackingDialog(props: ResetTrackingDialogProps) {
  const { theme } = useTheme();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [confirmStep, setConfirmStep] = useState(false);

  useKeyboard((key) => {
    if (!props.visible) return;
    const str = key.sequence || key.name;

    if (confirmStep) {
      if (str === "y" || str === "Y") {
        const period = RESET_PERIODS[selectedIndex]!;
        setConfirmStep(false);
        setSelectedIndex(0);
        props.onConfirm(period);
      }
      if (str === "n" || str === "N" || key.name === "escape") {
        setConfirmStep(false);
      }
      return;
    }

    if (key.name === "escape") {
      setSelectedIndex(0);
      props.onDismiss();
      return;
    }

    if (str === "j" || key.name === "down") {
      setSelectedIndex((prev) => Math.min(prev + 1, RESET_PERIODS.length - 1));
      return;
    }
    if (str === "k" || key.name === "up") {
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
      return;
    }

    if (key.name === "return") {
      setConfirmStep(true);
      return;
    }
  });

  if (!props.visible) return null;

  const selectedPeriod = RESET_PERIODS[selectedIndex]!;

  if (confirmStep) {
    return (
      <box
        position="absolute"
        top="30%"
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
        title={` ${theme.ornaments.focusIcon} Confirm Reset `}
        titleAlignment="center"
      >
        <box justifyContent="center" marginBottom={1}>
          <text fg={theme.colors.text}>
            {`Delete all reading data for ${theme.ornaments.headerLeft} ${RESET_LABELS[selectedPeriod]} ${theme.ornaments.headerRight}?`}
          </text>
        </box>

        <box justifyContent="center">
          <text fg={theme.colors.secondary} attributes={TextAttributes.BOLD}>
            {"  [Y] Yes    [N] No  "}
          </text>
        </box>

        <box justifyContent="center" marginTop={1}>
          <text fg={theme.colors.muted}>
            {"This action cannot be undone."}
          </text>
        </box>
      </box>
    );
  }

  return (
    <box
      position="absolute"
      top="25%"
      left="25%"
      width="50%"
      height={3 + RESET_PERIODS.length + 4}
      borderStyle={theme.borderStyleFocused}
      customBorderChars={theme.borderChars}
      borderColor={theme.colors.highlight}
      flexDirection="column"
      padding={1}
      zIndex={100}
      backgroundColor={theme.colors.background}
      title={` ${theme.ornaments.focusIcon} Reset Reading Data `}
      titleAlignment="center"
    >
      <box justifyContent="center" marginBottom={1}>
        <text fg={theme.colors.text}>
          {"Select period to reset:"}
        </text>
      </box>

      {RESET_PERIODS.map((period, i) => (
        <box key={period} paddingLeft={2}>
          <text
            fg={i === selectedIndex ? theme.colors.highlight : theme.colors.text}
            attributes={i === selectedIndex ? TextAttributes.BOLD : 0}
          >
            {`${i === selectedIndex ? theme.ornaments.focusIcon : " "} ${RESET_LABELS[period]}`}
          </text>
        </box>
      ))}

      <box justifyContent="center" marginTop={1}>
        <text fg={theme.colors.muted}>
          {"↑/↓ navigate  Enter select  Esc cancel"}
        </text>
      </box>
    </box>
  );
}
