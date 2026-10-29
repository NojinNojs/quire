import { Icon, type IconProps } from "./Icon";

export function SettingsIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 6h3m4 0h11M3 12h11m4 0h3M3 18h5m4 0h9" />
      <path d="M6 3h4v6H6zM14 9h4v6h-4zM8 15h4v6H8z" />
    </Icon>
  );
}
