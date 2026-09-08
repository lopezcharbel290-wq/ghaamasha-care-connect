import { refrescarSesionPanel, type SesionPanel } from "./panel.functions";

const CLAVE = "ghaamasha_panel_sesion";

export const PANEL_BASE = "/panel-ghaamasha";

export function leerSesion(): SesionPanel | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CLAVE);
    return raw ? (JSON.parse(raw) as SesionPanel) : null;
  } catch {
    return null;
  }
}

export function guardarSesion(sesion: SesionPanel) {
  window.localStorage.setItem(CLAVE, JSON.stringify(sesion));
  window.dispatchEvent(new Event("panel-sesion"));
}

export function borrarSesion() {
  window.localStorage.removeItem(CLAVE);
  window.dispatchEvent(new Event("panel-sesion"));
}

/** Devuelve un access token vigente, renovándolo si está por vencer. */
export async function obtenerToken(): Promise<string> {
  const sesion = leerSesion();
  if (!sesion) throw new Error("SIN_SESION");
  if (sesion.expires_at - Date.now() > 60_000) return sesion.access_token;
  try {
    const nueva = await refrescarSesionPanel({
      data: { refresh_token: sesion.refresh_token },
    });
    guardarSesion(nueva);
    return nueva.access_token;
  } catch {
    borrarSesion();
    throw new Error("SIN_SESION");
  }
}
