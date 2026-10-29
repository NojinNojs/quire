import { Icon, type IconProps } from "./Icon";

export function SearchIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M10 19H3V4h15v5M7 8h7M7 12h2" />
      <circle cx="15.5" cy="15.5" r="4" />
      <path d="m18.5 18.5 3 3" />
    </Icon>
  );
}
