export function ContextBar() {
  const signals = [
    { icon: "🌧️", text: "11°C · Light rain" },
    { icon: "📍", text: "Stuttgart, Old Town" },
    { icon: "🕐", text: "Tuesday · 12:14 PM" },
    {
      icon: "📊",
      node: (
        <>
          Café traffic: <span className="text-foreground font-medium">LOW</span>{" "}
          <span className="text-destructive font-medium">(-23%)</span>
        </>
      ),
    },
  ];

  return (
    <div className="h-11 bg-card border-b border-border">
      <div className="h-full max-w-[1440px] mx-auto px-6 flex items-center gap-4 text-[12px] text-muted-foreground overflow-hidden">
        <div className="flex items-center gap-2 pr-4 border-r border-border">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-70 animate-ping" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
          </span>
          <span className="text-[10.5px] font-semibold tracking-[0.12em] text-primary">LIVE</span>
        </div>

        {signals.map((s, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="text-[13px] leading-none">{s.icon}</span>
              <span>{s.node ?? s.text}</span>
            </div>
            {i < signals.length - 1 && <span className="h-3 w-px bg-border" />}
          </div>
        ))}
      </div>
    </div>
  );
}
