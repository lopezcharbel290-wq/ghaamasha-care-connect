import { CalendarPlus, MessageCircle, Phone } from "lucide-react";

import { useSede } from "@/components/sede-context";
import { useAgenda } from "@/components/agenda-context";
import { MENSAJE_WA_DEFAULT, waLink } from "@/lib/clinic-data";

export function FloatingActions() {
  const { sede } = useSede();
  const { openAgenda } = useAgenda();

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 md:inset-x-auto md:right-5 md:bottom-6">
      <div className="pointer-events-auto border-t border-border bg-card/95 p-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] backdrop-blur md:flex-col md:rounded-3xl md:border md:p-2.5 md:shadow-lift">
        <div className="mx-auto grid max-w-lg grid-cols-3 gap-2 md:flex md:flex-col md:gap-2">
          <a
            href={`tel:${sede.telefonoLink}`}
            className="flex flex-col items-center justify-center gap-1 rounded-2xl bg-secondary px-3 py-2 text-xs font-bold text-secondary-foreground transition-colors hover:bg-primary-soft md:flex-row md:gap-2 md:px-4 md:py-2.5 md:text-sm"
          >
            <Phone className="size-4" aria-hidden /> Llamar
          </a>
          <a
            href={waLink(sede, MENSAJE_WA_DEFAULT)}
            target="_blank"
            rel="noreferrer"
            className="flex flex-col items-center justify-center gap-1 rounded-2xl bg-whatsapp px-3 py-2 text-xs font-bold text-whatsapp-foreground transition-all hover:brightness-105 md:flex-row md:gap-2 md:px-4 md:py-2.5 md:text-sm"
          >
            <MessageCircle className="size-4" aria-hidden /> WhatsApp
          </a>
          <button
            type="button"
            onClick={() => openAgenda({ origen: "boton_flotante" })}
            className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl bg-accent px-3 py-2 text-xs font-bold text-accent-foreground transition-all hover:brightness-105 md:flex-row md:gap-2 md:px-4 md:py-2.5 md:text-sm"
          >
            <CalendarPlus className="size-4" aria-hidden /> Agendar
          </button>
        </div>
      </div>
    </div>
  );
}
