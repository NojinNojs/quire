import { Button as BaseButton } from "@base-ui/react/button";
import type { ComponentProps } from "react";
import "./button.css";

export type ButtonVariant = "primary" | "secondary" | "danger" | "quiet" | "icon";

/**
 * Shared action target. Navigation keeps its own `quire-button-*` chrome;
 * action variants map to the canonical control classes in controls.css so a
 * button reads the same on every page.
 */
const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: "primary",
  secondary: "secondary",
  danger: "danger",
  quiet: "quire-button-quiet",
  icon: "quire-button-icon",
};

export function Button({
  variant = "quiet",
  className,
  type = "button",
  ...rest
}: { variant?: ButtonVariant } & Omit<ComponentProps<typeof BaseButton>, "className"> & {
    className?: string;
  }) {
  const classes = ["quire-button", VARIANT_CLASS[variant], className].filter(Boolean).join(" ");
  return <BaseButton type={type} className={classes} {...rest} />;
}
