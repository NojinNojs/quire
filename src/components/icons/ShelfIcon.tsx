import { Icon, type IconProps } from "./Icon";

export function ShelfIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 4h4v16H3zM10 4h4v16h-4zM16 5l4-1 3 15-4 1zM3 8h4M10 16h4" />
    </Icon>
  );
}
