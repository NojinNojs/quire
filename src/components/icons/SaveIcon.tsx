import { Icon, type IconProps } from "./Icon";

export function SaveIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 4h11l3 3v13H5z" />
      <path d="M8 4v6h8V4M8 20v-6h8v6" />
    </Icon>
  );
}
