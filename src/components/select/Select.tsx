import { Select as BaseSelect } from "@base-ui/react/select";
import "./select.css";

export type SelectOption = { value: string; label: string };

/**
 * Single-choice dropdown. The API stays `label/value/options/onChange`; Base UI
 * owns the portal, keyboard, typeahead, focus restore and the exit transition.
 */
export function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly SelectOption[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="quire-select">
      <BaseSelect.Root
        items={options}
        value={value}
        modal={false}
        onValueChange={(next) => {
          if (typeof next === "string") onChange(next);
        }}
      >
        <BaseSelect.Trigger className="quire-select-control" aria-label={label}>
          <span className="quire-select-label" aria-hidden="true">
            {label}
          </span>
          <span className="quire-select-value">
            <BaseSelect.Value />
          </span>
          <BaseSelect.Icon className="quire-select-chevron" aria-hidden="true" />
        </BaseSelect.Trigger>
        <BaseSelect.Portal>
          <BaseSelect.Positioner
            className="quire-select-positioner"
            sideOffset={4}
            alignItemWithTrigger={false}
            collisionAvoidance={{ side: "flip", align: "shift" }}
          >
            <BaseSelect.Popup className="quire-select-panel">
              <BaseSelect.List>
                {options.map((option) => (
                  <BaseSelect.Item
                    key={option.value}
                    value={option.value}
                    className="quire-select-option"
                    label={option.label}
                  >
                    <BaseSelect.ItemText>{option.label}</BaseSelect.ItemText>
                    <BaseSelect.ItemIndicator className="quire-select-indicator">
                      <span className="quire-select-check" />
                    </BaseSelect.ItemIndicator>
                  </BaseSelect.Item>
                ))}
              </BaseSelect.List>
            </BaseSelect.Popup>
          </BaseSelect.Positioner>
        </BaseSelect.Portal>
      </BaseSelect.Root>
    </div>
  );
}
