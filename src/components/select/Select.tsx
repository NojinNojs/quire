import { type KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import "./select.css";

export type SelectOption = { value: string; label: string };

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
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const selected = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(selected);
  const activeIndex = Math.min(active, options.length - 1);

  useEffect(() => {
    if (!open) return;
    function outside(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);

  useEffect(() => {
    if (open)
      document
        .getElementById(`${id}-option-${activeIndex}`)
        ?.scrollIntoView?.({ block: "nearest" });
  }, [activeIndex, id, open]);

  function choose(index: number) {
    const option = options[index];
    if (option) onChange(option.value);
    setOpen(false);
    trigger.current?.focus();
  }

  function keyDown(event: KeyboardEvent) {
    switch (event.key) {
      case "ArrowDown":
      case "ArrowUp":
        event.preventDefault();
        setActive(
          open
            ? Math.max(
                0,
                Math.min(options.length - 1, activeIndex + (event.key === "ArrowDown" ? 1 : -1)),
              )
            : selected,
        );
        setOpen(true);
        break;
      case "Home":
      case "End":
        event.preventDefault();
        setActive(event.key === "Home" ? 0 : options.length - 1);
        setOpen(true);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        if (open) choose(activeIndex);
        else {
          setActive(selected);
          setOpen(true);
        }
        break;
      case "Escape":
        if (open) event.preventDefault();
        setOpen(false);
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  }

  return (
    <div className="quire-select" ref={root}>
      <button
        ref={trigger}
        type="button"
        role="combobox"
        className="quire-select-control"
        aria-label={label}
        aria-describedby={`${id}-value`}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={`${id}-listbox`}
        aria-activedescendant={open ? `${id}-option-${activeIndex}` : undefined}
        onKeyDown={keyDown}
        onBlur={() => setOpen(false)}
        onClick={() => {
          setActive(selected);
          setOpen(!open);
        }}
      >
        <span className="quire-select-label">{label}</span>
        <span className="quire-select-value" id={`${id}-value`}>
          {options[selected]?.label}
        </span>
        <span className="quire-select-chevron" aria-hidden="true" />
      </button>
      {open && (
        <div
          className="quire-select-panel"
          id={`${id}-listbox`}
          role="listbox"
          aria-label={label}
          tabIndex={-1}
        >
          {options.map((option, index) => (
            <div
              key={option.value}
              id={`${id}-option-${index}`}
              role="option"
              tabIndex={-1}
              aria-selected={value === option.value}
              data-active={activeIndex === index}
              onPointerDown={(event) => event.preventDefault()}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choose(index)}
              onKeyDown={keyDown}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
