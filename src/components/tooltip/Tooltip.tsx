import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import { cloneElement, type ReactElement, type RefObject, useId } from "react";
import "./tooltip.css";

export type TooltipSide = "top" | "right" | "bottom" | "left";

/** Where the popup mounts. A native dialog lives in the top layer, so a tooltip
 *  opened inside one has to portal into that dialog to be seen at all. */
export type TooltipContainer =
  | HTMLElement
  | ShadowRoot
  | RefObject<HTMLElement | ShadowRoot | null>
  | null;

/**
 * Icon controls are the only tooltips: the label repeats an accessible name
 * that is invisible while the rail is compact. Hover waits, focus is instant,
 * Escape closes, and a touch press never opens one.
 */
export function Tooltip({
  label,
  children,
  side = "top",
  delay,
  disabled = false,
  container,
}: {
  label: string;
  children: ReactElement<{ "aria-describedby"?: string }>;
  side?: TooltipSide;
  delay?: number;
  disabled?: boolean;
  container?: TooltipContainer;
}) {
  const id = useId();
  const describedBy = disabled
    ? children.props["aria-describedby"]
    : [children.props["aria-describedby"], id].filter(Boolean).join(" ");

  return (
    <BaseTooltip.Root disabled={disabled}>
      <BaseTooltip.Trigger
        delay={delay}
        render={cloneElement(children, { "aria-describedby": describedBy })}
      />
      <BaseTooltip.Portal container={container}>
        <BaseTooltip.Positioner
          className="quire-tooltip-positioner"
          side={side}
          sideOffset={side === "right" || side === "left" ? 12 : 8}
          collisionAvoidance={{ side: "flip", align: "shift" }}
        >
          <BaseTooltip.Popup className="quire-tooltip" id={id} role="tooltip">
            {label}
          </BaseTooltip.Popup>
        </BaseTooltip.Positioner>
      </BaseTooltip.Portal>
    </BaseTooltip.Root>
  );
}
