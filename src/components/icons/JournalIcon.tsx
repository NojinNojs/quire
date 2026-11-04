import { Icon, type IconProps } from "./Icon";

export function JournalIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 3h13a1 1 0 0 1 1 1v17H7a2 2 0 0 1-2-2zM5 17h14M9 7h6M9 11h4" />
    </Icon>
  );
}
