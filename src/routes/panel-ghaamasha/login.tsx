import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/panel-ghaamasha/login")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Panel interno | GHAAMASHA" },
      { name: "robots", content: "noindex, nofollow" },
      { name: "description", content: "Panel interno de la clínica." },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/panel-ghaamasha", replace: true });
  },
});
