import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import ErrorState from "../components/ErrorState";
import { LayersIcon, TrendUpIcon } from "../components/Icons";
import LoadingState from "../components/LoadingState";
import SectionCard from "../components/SectionCard";
import { formatCompactCurrency, formatNumber, formatPercent } from "../lib/formatters";
import { useApi } from "../lib/hooks";

const heatLevels = [
  { threshold: 80, className: "bg-success/30 text-white" },
  { threshold: 60, className: "bg-accent/35 text-white" },
  { threshold: 40, className: "bg-warning/30 text-white" },
  { threshold: 0, className: "bg-danger/25 text-white" }
];

export default function CohortAnalysis() {
  const retention = useApi("/api/cohorts/retention-matrix", []);
  const plans = useApi("/api/cohorts/plan-analysis", []);

  if (retention.loading || plans.loading) {
    return <LoadingState label="Loading cohort analysis..." />;
  }

  if (retention.error || plans.error) {
    return <ErrorState message={retention.error || plans.error} />;
  }

  return (
    <div className="space-y-6">
      <SectionCard title="Retention Heatmap" subtitle="Monthly cohort durability across key lifecycle checkpoints." icon={<LayersIcon className="h-5 w-5" />}>
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-2 text-sm">
            <thead>
              <tr className="text-left text-muted">
                <th className="px-3 py-2">Cohort</th>
                <th className="px-3 py-2">Size</th>
                <th className="px-3 py-2">M0</th>
                <th className="px-3 py-2">M1</th>
                <th className="px-3 py-2">M3</th>
                <th className="px-3 py-2">M6</th>
                <th className="px-3 py-2">M12</th>
              </tr>
            </thead>
            <tbody>
              {retention.data.map((row) => (
                <tr key={row.cohort_month} className="panel-soft">
                  <td className="rounded-l-2xl px-3 py-3 text-white">{String(row.cohort_month).slice(0, 10)}</td>
                  <td className="px-3 py-3 text-white">{formatNumber(row.cohort_size)}</td>
                  {["retention_month_0_pct", "retention_month_1_pct", "retention_month_3_pct", "retention_month_6_pct", "retention_month_12_pct"].map(
                    (key, index, arr) => (
                      <td
                        key={key}
                        className={`px-3 py-3 ${index === arr.length - 1 ? "rounded-r-2xl" : ""}`}
                      >
                        <span className={`inline-flex min-w-24 justify-center rounded-xl px-3 py-2 ${heatClass(row[key])}`}>
                          {formatPercent(row[key])}
                        </span>
                      </td>
                    )
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title="Plan Comparison" subtitle="Commercial and health posture across plan segments." icon={<TrendUpIcon className="h-5 w-5" />}>
        <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={plans.data}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="plan" stroke="#8f97b2" />
                <YAxis stroke="#8f97b2" />
                <Tooltip contentStyle={{ background: "#111118", border: "1px solid rgba(255,255,255,0.08)" }} />
                <Bar dataKey="avg_health_score" fill="#6366f1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-3">
            {plans.data.map((plan) => (
              <div key={plan.plan} className="panel-soft animate-enter p-4">
                <div className="flex items-center justify-between">
                  <p className="text-lg font-semibold text-white">{plan.plan}</p>
                  <p className="text-sm text-muted">{formatNumber(plan.customer_count)} customers</p>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <MiniMetric label="Total MRR" value={formatCompactCurrency(plan.total_mrr)} />
                  <MiniMetric label="Avg Health" value={formatNumber(plan.avg_health_score)} />
                  <MiniMetric label="Churn Signal" value={formatNumber(plan.avg_churn_signal_score)} />
                  <MiniMetric label="MRR At Risk" value={formatCompactCurrency(plan.mrr_at_risk)} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Plan Risk Composition" subtitle="Healthy, at-risk, and critical customer mix across plan tiers." icon={<TrendUpIcon className="h-5 w-5" />}>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={plans.data}>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis dataKey="plan" stroke="#8f97b2" />
              <YAxis stroke="#8f97b2" />
              <Tooltip contentStyle={{ background: "#111118", border: "1px solid rgba(255,255,255,0.08)" }} />
              <Legend />
              <Bar dataKey="healthy_customers" stackId="risk" fill="#22c55e" radius={[8, 8, 0, 0]} />
              <Bar dataKey="at_risk_customers" stackId="risk" fill="#f59e0b" />
              <Bar dataKey="critical_customers" stackId="risk" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>
    </div>
  );
}

function heatClass(value) {
  const score = Number(value || 0);
  return heatLevels.find((level) => score >= level.threshold)?.className || "bg-white/10 text-white";
}

function MiniMetric({ label, value }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.25em] text-muted">{label}</p>
      <p className="mt-2 text-base font-medium text-white">{value}</p>
    </div>
  );
}
