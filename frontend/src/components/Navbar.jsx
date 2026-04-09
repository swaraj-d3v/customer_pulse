import { NavLink, useLocation } from "react-router-dom";
import { API_BASE } from "../lib/api";
import { PulseIcon } from "./Icons";

const titles = {
  "/overview": "Executive Overview",
  "/customers": "Customer Explorer",
  "/cohorts": "Cohort Analysis",
  "/revenue": "Revenue Risk"
};

const links = [
  { to: "/overview", label: "Overview" },
  { to: "/customers", label: "Customers" },
  { to: "/cohorts", label: "Cohorts" },
  { to: "/revenue", label: "Revenue" }
];

export default function Navbar() {
  const location = useLocation();
  const title = titles[location.pathname] || "CustomerPulse";

  return (
    <header className="sticky top-0 z-20 border-b border-white/5 bg-bg/70 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-accent/80">Control center</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-white">{title}</h2>
        </div>
        <div className="panel-soft flex items-center gap-3 px-4 py-3 text-sm">
          <span className="glass-dot h-9 w-9 text-success">
            <PulseIcon className="h-4 w-4" />
          </span>
          <span className="text-muted">Live API target</span>
          <span className="font-medium text-white">{API_BASE}</span>
        </div>
      </div>
      <div className="mt-4 flex gap-2 overflow-x-auto lg:hidden">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `whitespace-nowrap rounded-full px-4 py-2 text-sm transition ${
                isActive ? "bg-accent text-white" : "bg-white/[0.05] text-muted"
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </div>
    </header>
  );
}
