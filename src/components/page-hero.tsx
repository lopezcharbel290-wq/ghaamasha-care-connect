import type { ReactNode } from "react";

export function PageHero({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <section className="bg-gradient-hero text-primary-foreground">
      <div className="container-page py-12 md:py-16">
        {eyebrow ? (
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary-foreground/75">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-2 max-w-3xl text-3xl font-extrabold sm:text-4xl md:text-5xl">{title}</h1>
        {description ? (
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-primary-foreground/85">
            {description}
          </p>
        ) : null}
        {children ? <div className="mt-7">{children}</div> : null}
      </div>
    </section>
  );
}
