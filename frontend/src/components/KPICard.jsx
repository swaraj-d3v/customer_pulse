export default function KPICard({ label, value, tone = "accent", icon, eyebrow, className = "" }) {
  const toneClass = {
    accent: "from-accent/20 to-accent/5",
    danger: "from-danger/20 to-danger/5",
    success: "from-success/20 to-success/5",
    info: "from-info/20 to-info/5",
    warning: "from-warning/20 to-warning/5"
  }[tone];

  return (
    <div className={`panel animate-scale-in relative overflow-hidden p-5 ${className}`}>
      <div className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${toneClass} opacity-70`} />
      <div className="absolute right-4 top-4 h-16 w-16 rounded-full bg-white/[0.04] blur-2xl" />
      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div>
            {eyebrow ? <p className="text-[11px] uppercase tracking-[0.28em] text-white/45">{eyebrow}</p> : null}
            <p className="mt-1 text-sm text-muted">{label}</p>
          </div>
          {icon ? <span className="glass-dot h-11 w-11">{icon}</span> : null}
        </div>
        <p className="mt-3 text-3xl font-semibold tracking-tight text-white">{value}</p>
      </div>
    </div>
  );
}
