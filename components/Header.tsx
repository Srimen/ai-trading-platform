import { TRADING_MODE } from "@/lib/config";

const NAV = [
  { label: "Dashboard", ready: true },
  { label: "Portfolio", ready: false },
  { label: "Orders", ready: false },
];

export default function Header() {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="text-lg font-semibold">AI Trading Platform</span>
          <span className="rounded-md bg-paper px-2 py-0.5 text-xs font-semibold text-ink">
            {TRADING_MODE}
          </span>
        </div>
        <nav className="flex gap-6 text-sm">
          {NAV.map((item) => (
            <span
              key={item.label}
              className={item.ready ? "text-text" : "text-muted"}
              title={item.ready ? undefined : "Coming soon"}
            >
              {item.label}
            </span>
          ))}
        </nav>
      </div>
    </header>
  );
}
