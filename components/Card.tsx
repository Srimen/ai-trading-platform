import type { ReactNode } from "react";

export default function Card({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-lg border border-line bg-panel p-5 ${className}`}>
      <h2 className="mb-3 text-base font-medium">{title}</h2>
      {children}
    </section>
  );
}
