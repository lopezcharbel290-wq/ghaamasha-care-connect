import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { SEDES, type Sede, type SedeId } from "@/lib/clinic-data";

type SedeContextValue = {
  sedeId: SedeId;
  sede: Sede;
  setSedeId: (id: SedeId) => void;
};

const SedeContext = createContext<SedeContextValue | null>(null);

export function SedeProvider({ children }: { children: ReactNode }) {
  const [sedeId, setSedeId] = useState<SedeId>("tlalnepantla");

  const value = useMemo(
    () => ({ sedeId, sede: SEDES[sedeId], setSedeId }),
    [sedeId],
  );

  return <SedeContext.Provider value={value}>{children}</SedeContext.Provider>;
}

export function useSede() {
  const ctx = useContext(SedeContext);
  if (!ctx) throw new Error("useSede debe usarse dentro de SedeProvider");
  return ctx;
}
