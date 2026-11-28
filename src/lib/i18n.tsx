"use client";

import { createContext, useContext, type ReactNode } from "react";

/* Optional app-wide string overrides: <LocaleProvider messages={{ themeToggle: {...} }}>. */
type Messages = Record<string, Record<string, string>>;
const LocaleContext = createContext<Messages>({});

export function LocaleProvider({ messages, children }: { messages: Messages; children: ReactNode }) {
  return <LocaleContext.Provider value={messages}>{children}</LocaleContext.Provider>;
}

export function useMessages<T extends Record<string, string>>(namespace: string, defaults: T, overrides?: Partial<T>) {
  const app = useContext(LocaleContext)[namespace] as Partial<T> | undefined;
  return (key: keyof T) => overrides?.[key] ?? app?.[key] ?? defaults[key];
}
