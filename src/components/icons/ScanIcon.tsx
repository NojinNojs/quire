import { Icon, type IconProps } from "./Icon";

/**
 * A barcode inside the four corner marks a camera looks for, so every scan
 * affordance reads as a viewfinder rather than a second generic add icon.
 */
export function ScanIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9 4H4v5M15 4h5v5M20 15v5h-5M9 20H4v-5" />
      <path d="M8 9v6M10.5 9v6M13.5 9v6M16 9v6" />
    </Icon>
  );
}
