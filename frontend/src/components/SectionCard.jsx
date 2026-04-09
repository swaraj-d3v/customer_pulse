export default function SectionCard({ title, subtitle, children, className = "", icon }) {
  return (
    <section className={`panel animate-enter p-5 ${className}`}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            {icon ? <span className="glass-dot h-10 w-10 text-accent">{icon}</span> : null}
            <h3 className="section-title">{title}</h3>
          </div>
          {subtitle ? <p className="section-subtitle mt-1">{subtitle}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}
