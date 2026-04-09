import { NavLink } from "react-router-dom";
import { DollarIcon, GridIcon, LayersIcon, SearchIcon, SparkIcon } from "./Icons";

const links = [
  { to: "/overview", label: "Overview", short: "01", icon: GridIcon },
  { to: "/customers", label: "Customer Explorer", short: "02", icon: SearchIcon },
  { to: "/cohorts", label: "Cohort Analysis", short: "03", icon: LayersIcon },
  { to: "/revenue", label: "Revenue Risk", short: "04", icon: DollarIcon }
];

export default function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-72 flex-col border-r border-white/5 bg-[#0b0b14]/80 px-5 py-6 backdrop-blur-xl lg:flex">
      <div className="panel mb-8 p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent text-lg font-semibold text-white shadow-lg shadow-accent/30">
            <SparkIcon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-accent/80">CustomerPulse</p>
            <h1 className="text-xl font-semibold">Revenue Command</h1>
          </div>
        </div>
        <p className="text-sm leading-6 text-muted">
          Monitor health, churn pressure, cohort durability, and revenue exposure in one control center.
        </p>
      </div>

      <nav className="space-y-2">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `group flex items-center justify-between rounded-2xl border px-4 py-3 transition ${
                isActive
                  ? "border-accent/40 bg-accent/15 text-white shadow-glow"
                  : "border-transparent bg-white/[0.03] text-muted hover:border-white/10 hover:bg-white/[0.06] hover:text-white"
              }`
            }
          >
            <span className="flex items-center gap-3 font-medium">
              <span className="glass-dot h-9 w-9">
                <link.icon className="h-4 w-4" />
              </span>
              {link.label}
            </span>
            <span className="text-xs tracking-[0.25em] text-white/45 group-hover:text-white/60">{link.short}</span>
          </NavLink>
        ))}
      </nav>

      <div className="panel-soft mt-auto p-4">
        <p className="text-xs uppercase tracking-[0.3em] text-accent/80">Now Tracking</p>
        <p className="mt-2 text-sm text-white">Health trends, retention quality, and revenue exposure in real time.</p>
      </div>
    </aside>
  );
}
