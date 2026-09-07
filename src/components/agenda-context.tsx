import { useCallback, useMemo, useState, type ReactNode } from "react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { AppointmentForm, type AgendaPrefill } from "@/components/appointment-form";
import { AgendaContext } from "@/components/agenda-context-value";

export { useAgenda } from "@/components/agenda-context-value";

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
        <DialogContent className="max-h-[90dvh] max-w-xl overflow-y-auto rounded-lg p-0">
          <DialogTitle className="sr-only">Agendar cita</DialogTitle>
          <AppointmentForm key={key} prefill={prefill} className="border-0 shadow-none" />
        </DialogContent>
      </Dialog>
    </AgendaContext.Provider>
  );
}
