import {
  useCallback,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type KeyboardEvent,
  type ReactElement,
} from "react";

import {
  TabsContext,
  getTabIds,
  useTabsContext,
  type AppTabsOrientation,
  type AppTabsSize,
  type AppTabsVariant,
  type TabRegistration,
} from "./tabsContext";
import { getNextTabIndex, revealTab } from "./tabsNavigation";

import "./tabs.css";

export type AppTabsRootProps = Omit<
  ComponentPropsWithoutRef<"div">,
  "defaultValue" | "onChange"
> & {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  orientation?: AppTabsOrientation;
  variant?: AppTabsVariant;
  size?: AppTabsSize;
};

export function AppTabsRoot({
  value: controlledValue,
  defaultValue,
  onValueChange,
  orientation = "horizontal",
  variant = "outline",
  size = "md",
  id,
  className,
  children,
  ...props
}: AppTabsRootProps): ReactElement {
  const autoId = useId();
  const [localValue, setLocalValue] = useState(defaultValue);
  const [tabs, setTabs] = useState<TabRegistration[]>([]);
  const requestedValue = controlledValue ?? localValue;
  const enabledTabs = tabs
    .filter((tab) => !tab.disabled)
    .sort((first, second) => {
      const position = first.element.compareDocumentPosition(second.element);

      return position & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
    });
  const hasRequestedValue = enabledTabs.some((tab) => tab.value === requestedValue);
  const fallbackValue = controlledValue === undefined ? enabledTabs[0]?.value : undefined;
  const value = hasRequestedValue ? requestedValue : fallbackValue;
  const tabStopValue = value ?? enabledTabs[0]?.value;

  const register = useCallback((tab: TabRegistration) => {
    setTabs((previous) => [...previous, tab]);

    return () => setTabs((previous) => previous.filter((entry) => entry !== tab));
  }, []);

  const selectValue = (nextValue: string) => {
    if (nextValue === value) return;
    if (controlledValue === undefined) setLocalValue(nextValue);
    onValueChange?.(nextValue);
  };

  return (
    <TabsContext.Provider
      value={{ id: id ?? autoId, value, tabStopValue, orientation, selectValue, register }}
    >
      <div
        {...props}
        id={id ?? autoId}
        className={["AppTabs", className].filter(Boolean).join(" ")}
        data-orientation={orientation}
        data-variant={variant}
        data-size={size}
      >
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export type AppTabsListProps = ComponentPropsWithoutRef<"div">;

export function AppTabsList({ className, onKeyDown, ...props }: AppTabsListProps): ReactElement {
  const { orientation, selectValue } = useTabsContext();

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || event.nativeEvent.isComposing) return;
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;

    const list = event.currentTarget;
    const triggers = Array.from(
      list.querySelectorAll<HTMLButtonElement>("button[role='tab']:not(:disabled)")
    ).filter((trigger) => trigger.closest("[role='tablist']") === list);
    const index = triggers.findIndex((trigger) => trigger === event.target);
    const nextIndex = getNextTabIndex(
      event.key,
      index,
      triggers.length,
      orientation,
      getComputedStyle(list).direction === "rtl"
    );
    if (nextIndex === undefined) return;

    event.preventDefault();
    const trigger = triggers[nextIndex];
    const nextValue = trigger.dataset.value;
    if (nextValue === undefined) return;
    selectValue(nextValue);
    trigger.focus({ preventScroll: true });
    revealTab(trigger);
  };

  return (
    <div
      {...props}
      className={["AppTabs-list", className].filter(Boolean).join(" ")}
      role="tablist"
      aria-orientation={orientation}
      onKeyDown={handleKeyDown}
    />
  );
}

export type AppTabsTriggerProps = Omit<ComponentPropsWithoutRef<"button">, "value" | "id"> & {
  value: string;
};

export function AppTabsTrigger({
  value,
  disabled = false,
  className,
  onClick,
  ...props
}: AppTabsTriggerProps): ReactElement {
  const { id, value: selectedValue, tabStopValue, register, selectValue } = useTabsContext();
  const ref = useRef<HTMLButtonElement>(null);
  const ids = getTabIds(id, value);
  const isSelected = selectedValue === value && !disabled;

  useLayoutEffect(() => {
    if (!ref.current) return;

    return register({ value, disabled, element: ref.current });
  }, [register, value, disabled]);
  useLayoutEffect(() => {
    if (isSelected && ref.current) revealTab(ref.current);
  }, [isSelected]);

  return (
    <button
      {...props}
      ref={ref}
      id={ids.trigger}
      className={["AppTabs-trigger", className].filter(Boolean).join(" ")}
      type="button"
      role="tab"
      disabled={disabled}
      aria-disabled={disabled || undefined}
      aria-selected={isSelected}
      aria-controls={ids.content}
      tabIndex={!disabled && tabStopValue === value ? 0 : -1}
      data-value={value}
      data-selected={isSelected ? "" : undefined}
      data-disabled={disabled ? "" : undefined}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented && !disabled) selectValue(value);
      }}
    />
  );
}

export type AppTabsContentProps = Omit<ComponentPropsWithoutRef<"div">, "id" | "hidden"> & {
  value: string;
};

export function AppTabsContent({ value, className, ...props }: AppTabsContentProps): ReactElement {
  const { id, value: selectedValue } = useTabsContext();
  const ids = getTabIds(id, value);
  const isSelected = selectedValue === value;

  return (
    <div
      {...props}
      id={ids.content}
      className={["AppTabs-content", className].filter(Boolean).join(" ")}
      role="tabpanel"
      aria-labelledby={ids.trigger}
      hidden={!isSelected}
      tabIndex={0}
      data-selected={isSelected ? "" : undefined}
    />
  );
}

export const AppTabs = {
  Root: AppTabsRoot,
  List: AppTabsList,
  Trigger: AppTabsTrigger,
  Content: AppTabsContent,
};
