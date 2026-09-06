import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { AppointmentForm, type AgendaPrefill } from "@/components/appointment-form";

type AgendaContextValue = {
  openAgenda: (prefill?: AgendaPrefill) => void;
};

const AgendaContext = createContext<AgendaContextValue | null>(null);

export function AgendaProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [prefill, setPrefill] = useState<AgendaPrefill | undefined>();
  const [key, setKey] = useState(0);

  const openAgenda = useCallback((next?: AgendaPrefill) => {
    setPrefill(next);
    setKey((k) => k + 1);
    setOpen(true);
  }, []);

  const value = useMemo(() => ({ openAgenda }), [openAgenda]);

  return (
    <AgendaContext.Provider value={value}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90dvh] max-w-xl overflow-y-auto rounded-3xl p-0">
          <DialogTitle className="sr-only">Agendar cita</DialogTitle>
          <AppointmentForm key={key} prefill={prefill} className="border-0 shadow-none" />
        </DialogContent>
      </Dialog>
    </AgendaContext.Provider>
  );
}

export function useAgenda() {
  const ctx = useContext(AgendaContext);
  if (!ctx) throw new Error("useAgenda debe usarse dentro de AgendaProvider");
  return ctx;
}
