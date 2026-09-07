import { createContext, useContext } from "react";

import type { AgendaPrefill } from "@/components/appointment-form";

export type AgendaContextValue = {
  openAgenda: (prefill?: AgendaPrefill) => void;
};

export const AgendaContext = createContext<AgendaContextValue | null>(null);

export function useAgenda(): AgendaContextValue {
  const ctx = useContext(AgendaContext);
  if (!ctx) {
    // Fallback: sin proveedor (p. ej. durante recarga en caliente) no rompemos la página.
    return { openAgenda: () => {} };
  }
  return ctx;
}
