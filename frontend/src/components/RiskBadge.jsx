const styles = {
  Healthy: "bg-success/15 text-success ring-success/25",
  "At Risk": "bg-warning/15 text-warning ring-warning/25",
  Critical: "bg-danger/15 text-danger ring-danger/25",
  High: "bg-danger/15 text-danger ring-danger/25",
  Medium: "bg-warning/15 text-warning ring-warning/25",
  Low: "bg-success/15 text-success ring-success/25",
  P1: "bg-danger/15 text-danger ring-danger/25",
  P2: "bg-warning/15 text-warning ring-warning/25",
  P3: "bg-info/15 text-info ring-info/25"
};

export default function RiskBadge({ value }) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${styles[value] || "bg-white/10 text-white ring-white/10"}`}>
      {value || "Unknown"}
    </span>
  );
}
