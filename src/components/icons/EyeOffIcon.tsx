import { Icon, type IconProps } from "./Icon";

export function EyeOffIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M2 12s4-7 10-7c2 0 3.8.6 5.3 1.5M22 12s-4 7-10 7c-2 0-3.8-.6-5.3-1.5" />
      <circle cx="12" cy="12" r="3" />
      <path d="m4 4 16 16" />
    </Icon>
  );
}
