function iconProps(className) {
  return {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className
  };
}

export function SparkIcon({ className = "h-5 w-5" }) {
  return (
    <svg {...iconProps(className)}>
      <path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3z" />
      <path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15z" />
    </svg>
  );
}

export function GridIcon({ className = "h-5 w-5" }) {
  return (
    <svg {...iconProps(className)}>
      <rect x="4" y="4" width="6" height="6" rx="1.5" />
      <rect x="14" y="4" width="6" height="6" rx="1.5" />
      <rect x="4" y="14" width="6" height="6" rx="1.5" />
      <rect x="14" y="14" width="6" height="6" rx="1.5" />
    </svg>
  );
}

export function SearchIcon({ className = "h-5 w-5" }) {
  return (
    <svg {...iconProps(className)}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M20 20l-4.2-4.2" />
    </svg>
  );
}

export function LayersIcon({ className = "h-5 w-5" }) {
  return (
    <svg {...iconProps(className)}>
      <path d="M12 4l8 4-8 4-8-4 8-4z" />
      <path d="M4 12l8 4 8-4" />
      <path d="M4 16l8 4 8-4" />
    </svg>
  );
}

export function DollarIcon({ className = "h-5 w-5" }) {
  return (
    <svg {...iconProps(className)}>
      <path d="M12 3v18" />
      <path d="M16.5 7.5c0-1.9-2-3.5-4.5-3.5S7.5 5.6 7.5 7.5 9.5 11 12 11s4.5 1.6 4.5 3.5-2 3.5-4.5 3.5-4.5-1.6-4.5-3.5" />
    </svg>
  );
}

export function PulseIcon({ className = "h-5 w-5" }) {
  return (
    <svg {...iconProps(className)}>
      <path d="M3 12h4l2.5-5 3 10 2.5-5H21" />
    </svg>
  );
}

export function TrendUpIcon({ className = "h-5 w-5" }) {
  return (
    <svg {...iconProps(className)}>
      <path d="M4 15l6-6 4 4 6-7" />
      <path d="M14 6h6v6" />
    </svg>
  );
}

export function WarningIcon({ className = "h-5 w-5" }) {
  return (
    <svg {...iconProps(className)}>
      <path d="M12 4l8 14H4L12 4z" />
      <path d="M12 9v4" />
      <circle cx="12" cy="16.5" r=".5" fill="currentColor" stroke="none" />
    </svg>
  );
}
