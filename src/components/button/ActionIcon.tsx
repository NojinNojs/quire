import type { ComponentProps, ReactNode } from "react";
import { Tooltip, type TooltipContainer, type TooltipSide } from "../tooltip/Tooltip";
import { Button } from "./Button";

/**
 * Icon-only control. The accessible name is required and also becomes the
 * desktop tooltip, so a glyph never stands alone. Touch users get a 44px
 * target with no hover dependency. A `container` keeps the tooltip inside a
 * native dialog, which paints above anything portaled to the body.
 */
export function ActionIcon({
  label,
  children,
  side = "top",
  className,
  disabled,
  container,
  ...rest
}: {
  label: string;
  children: ReactNode;
  side?: TooltipSide;
  disabled?: boolean;
  className?: string;
  container?: TooltipContainer;
} & Omit<ComponentProps<typeof Button>, "children" | "className" | "variant" | "aria-label">) {
  const classes = ["control-icon", className].filter(Boolean).join(" ");
  return (
    <Tooltip label={label} side={side} disabled={disabled} container={container}>
      <Button variant="icon" className={classes} aria-label={label} disabled={disabled} {...rest}>
        {children}
      </Button>
    </Tooltip>
  );
}
