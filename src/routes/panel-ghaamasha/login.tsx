import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PanelError } from "@/components/panel/panel-ui";
import {
  crearPrimerAdmin,
  existeAdmin,
  iniciarSesionPanel,
} from "@/lib/panel/panel.functions";
import { PANEL_BASE, guardarSesion } from "@/lib/panel/session";

export const Route = createFileRoute("/panel-ghaamasha/login")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Acceso al panel | GHAAMASHA" },
      { name: "robots", content: "noindex, nofollow" },
      { name: "description", content: "Acceso exclusivo para personal de la clínica." },
    ],
  }),
  component: LoginPanel,
});

function LoginPanel() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const admin = useQuery({
    queryKey: ["panel", "existe-admin"],
    queryFn: () => existeAdmin(),
  });
  const modoAlta = admin.data?.existe === false;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      if (modoAlta) {
        await crearPrimerAdmin({ data: { email, password, nombre_completo: nombre } });
        await admin.refetch();
      }
      const sesion = await iniciarSesionPanel({ data: { email, password } });
      guardarSesion(sesion);
      navigate({ to: PANEL_BASE, replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesión");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-lg">
        <div className="mb-6 text-center">
          <span className="mx-auto mb-3 flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Lock className="size-5" aria-hidden />
          </span>
          <h1 className="text-lg font-bold text-foreground">Panel interno GHAAMASHA</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {modoAlta
              ? "Crea la cuenta de administrador para empezar."
              : "Acceso exclusivo para personal de la clínica."}
          </p>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          {modoAlta ? (
            <div className="space-y-1.5">
              <Label htmlFor="nombre">Nombre completo</Label>
              <Input
                id="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                autoComplete="name"
              />
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="email">Correo</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete={modoAlta ? "new-password" : "current-password"}
            />
          </div>

          {error ? <PanelError mensaje={error} /> : null}

          <Button type="submit" className="w-full" disabled={enviando}>
            {enviando ? <Loader2 className="animate-spin" aria-hidden /> : null}
            {modoAlta ? "Crear cuenta y entrar" : "Entrar"}
          </Button>
        </form>
      </div>
    </div>
  );
}
