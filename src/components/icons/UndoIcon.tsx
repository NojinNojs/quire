import { Icon, type IconProps } from "./Icon";

export function UndoIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9 7 4 12l5 5" />
      <path d="M4 12h10a5 5 0 0 1 0 10h-3" />
    </Icon>
  );
}
