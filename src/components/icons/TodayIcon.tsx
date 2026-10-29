import { Icon, type IconProps } from "./Icon";

export function TodayIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 6C9 4 6 4 3 4v15c3 0 6 0 9 2 3-2 6-2 9-2V4c-3 0-6 0-9 2Zm0 0v15" />
    </Icon>
  );
}
