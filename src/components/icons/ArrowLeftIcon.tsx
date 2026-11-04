import { Icon, type IconProps } from "./Icon";

export function ArrowLeftIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M20 12H5M11 6l-6 6 6 6" />
    </Icon>
  );
}
