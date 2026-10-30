import { createContext, useContext } from "react";

import type { Perfil } from "@/lib/panel/panel.functions";

export const PanelSesionContext = createContext<Perfil | null>(null);

export function usePerfil(): Perfil {
  const perfil = useContext(PanelSesionContext);
  if (!perfil) {
    return { id: "", nombre_completo: "", rol: "recepcion", sede_id: null };
  }
  return perfil;
}
