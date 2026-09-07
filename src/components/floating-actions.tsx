import { CalendarPlus, MessageCircle, Phone } from "lucide-react";

import { useSede } from "@/components/sede-context";
import { useAgenda } from "@/components/agenda-context";
import { MENSAJE_WA_DEFAULT, waLink } from "@/lib/clinic-data";

export function FloatingActions() {
  const { sede } = useSede();
  const { openAgenda } = useAgenda();

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-3 z-40 px-3 md:inset-x-auto md:right-5 md:bottom-6 md:px-0">
      <div className="pointer-events-auto mx-auto max-w-lg rounded-2xl border border-primary-foreground/10 bg-primary-deep p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-lift md:flex-col md:rounded-xl">
        <div className="grid grid-cols-[0.8fr_0.9fr_1.3fr] gap-1 md:flex md:flex-col md:gap-1">
          <a
            href={`tel:${sede.telefonoLink}`}
            className="flex flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 text-xs font-semibold text-primary-foreground/80 transition-colors hover:bg-primary-foreground/10 md:flex-row md:gap-2 md:px-4 md:py-2.5 md:text-sm"
          >
            <Phone className="size-4" aria-hidden /> Llamar
          </a>
          <a
            href={waLink(sede, MENSAJE_WA_DEFAULT)}
            target="_blank"
            rel="noreferrer"
            className="flex flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 text-xs font-semibold text-primary-foreground/80 transition-colors hover:bg-primary-foreground/10 md:flex-row md:gap-2 md:px-4 md:py-2.5 md:text-sm"
          >
            <MessageCircle className="size-4" aria-hidden /> WhatsApp
          </a>
          <button
            type="button"
            onClick={() => openAgenda({ origen: "boton_flotante" })}
            className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg bg-accent px-3 py-2 text-xs font-bold text-accent-foreground transition-all hover:brightness-95 md:flex-row md:gap-2 md:px-4 md:py-2.5 md:text-sm"
          >
            <CalendarPlus className="size-4" aria-hidden /> Agendar
          </button>
        </div>
      </div>
    </div>
  );
}
