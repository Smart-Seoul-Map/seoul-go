import { createContext, useContext } from "react";

export type AppTabsOrientation = "horizontal" | "vertical";
export type AppTabsVariant = "outline" | "card";
export type AppTabsSize = "md" | "lg";

export type TabRegistration = { value: string; disabled: boolean; element: HTMLButtonElement };

type TabsContextValue = {
  id: string;
  value: string | undefined;
  tabStopValue: string | undefined;
  orientation: AppTabsOrientation;
  selectValue: (value: string) => void;
  register: (tab: TabRegistration) => () => void;
};

export const TabsContext = createContext<TabsContextValue | null>(null);

export function useTabsContext(): TabsContextValue {
  const context = useContext(TabsContext);
  if (!context) throw new Error("AppTabs parts must be inside AppTabs.Root.");

  return context;
}

export function getTabIds(id: string, value: string): { trigger: string; content: string } {
  const key = encodeURIComponent(value);

  return { trigger: `${id}-tab-${key}`, content: `${id}-panel-${key}` };
}
