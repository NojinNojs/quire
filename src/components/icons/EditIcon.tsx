import { Icon, type IconProps } from "./Icon";

export function EditIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 20h4L20 8l-4-4L4 16v4Z" />
      <path d="m13 7 4 4" />
    </Icon>
  );
}
