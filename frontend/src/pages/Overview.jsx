import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  Radar,
  RadarChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import ErrorState from "../components/ErrorState";
import { DollarIcon, GridIcon, SparkIcon, WarningIcon } from "../components/Icons";
import KPICard from "../components/KPICard";
import LoadingState from "../components/LoadingState";
import RiskBadge from "../components/RiskBadge";
import SectionCard from "../components/SectionCard";
import { formatCompactCurrency, formatCurrency, formatNumber, formatPercent } from "../lib/formatters";
import { useApi } from "../lib/hooks";

const riskColors = {
  Healthy: "#22c55e",
  "At Risk": "#f59e0b",
  Critical: "#ef4444"
};

export default function Overview() {
  const kpis = useApi("/api/overview/kpis", {});
  const topAtRisk = useApi("/api/overview/top-at-risk?limit=8", []);
  const customerSample = useApi("/api/customers/search?limit=200&q=", []);

  if (kpis.loading || topAtRisk.loading || customerSample.loading) {
    return <LoadingState label="Loading overview metrics..." />;
  }

  if (kpis.error || topAtRisk.error || customerSample.error) {
    return <ErrorState message={kpis.error || topAtRisk.error || customerSample.error} />;
  }

  const riskDonut = [
    { name: "At Risk", value: Number(kpis.data.at_risk_customers || 0) },
    { name: "Critical", value: Number(kpis.data.critical_customers || 0) },
    {
      name: "Healthy",
      value: Math.max(
        Number(kpis.data.total_customers || 0) -
          Number(kpis.data.at_risk_customers || 0) -
          Number(kpis.data.critical_customers || 0),
        0
      )
    }
  ];

  const healthDistribution = [
    { bucket: "0-24", count: 0 },
    { bucket: "25-49", count: 0 },
    { bucket: "50-74", count: 0 },
    { bucket: "75-100", count: 0 }
  ];

  for (const customer of customerSample.data) {
    const score = Number(customer.health_score || 0);
    if (score < 25) healthDistribution[0].count += 1;
    else if (score < 50) healthDistribution[1].count += 1;
    else if (score < 75) healthDistribution[2].count += 1;
    else healthDistribution[3].count += 1;
  }

  const riskMomentum = topAtRisk.data.slice(0, 6).map((customer) => ({
    customer_id: customer.customer_id,
    expected_loss: Number(customer.expected_monthly_loss || 0),
    health_score: Number(customer.health_score || 0),
    churn_signal: Number(customer.churn_signal_score || 0)
  }));

  return (
    <div className="space-y-6">
      <section className="panel animate-enter overflow-hidden p-6">
        <div className="grid gap-5 lg:grid-cols-[1.5fr,1fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-accent/80">CustomerPulse intelligence</p>
            <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight text-white">
              A premium SaaS cockpit for churn pressure, retention quality, and revenue exposure.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted">
              CustomerPulse surfaces the accounts that are slipping, quantifies the revenue at stake, and gives teams a
              single narrative across health, cohorts, and monetization.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <div className="panel-soft p-4">
              <p className="text-sm text-muted">Portfolio MRR</p>
              <p className="mt-2 text-2xl font-semibold text-white">{formatCompactCurrency(kpis.data.total_mrr)}</p>
            </div>
            <div className="panel-soft p-4">
              <p className="text-sm text-muted">1M retention</p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {formatPercent(kpis.data.latest_month_1_retention_pct)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KPICard label="Total Customers" value={formatNumber(kpis.data.total_customers)} tone="info" icon={<GridIcon className="h-5 w-5" />} eyebrow="Portfolio" className="stagger-1" />
        <KPICard label="Average Health" value={formatNumber(kpis.data.avg_health_score)} tone="success" icon={<SparkIcon className="h-5 w-5" />} eyebrow="Pulse" className="stagger-2" />
        <KPICard label="MRR At Risk" value={formatCompactCurrency(kpis.data.mrr_at_risk)} tone="danger" icon={<WarningIcon className="h-5 w-5" />} eyebrow="Exposure" className="stagger-3" />
        <KPICard
          label="Expected Monthly Loss"
          value={formatCompactCurrency(kpis.data.expected_monthly_loss)}
          tone="accent"
          icon={<DollarIcon className="h-5 w-5" />}
          eyebrow="Forecast"
          className="stagger-4"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <SectionCard title="Health Distribution" subtitle="Binned across the currently fetched customer population." icon={<SparkIcon className="h-5 w-5" />}>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={healthDistribution}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="bucket" stroke="#8f97b2" />
                <YAxis stroke="#8f97b2" allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.03)" }}
                  contentStyle={{ background: "#111118", border: "1px solid rgba(255,255,255,0.08)" }}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]} fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Risk Mix" subtitle="Portfolio distribution by health tier." icon={<WarningIcon className="h-5 w-5" />}>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskDonut}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={72}
                  outerRadius={108}
                  paddingAngle={4}
                >
                  {riskDonut.map((entry) => (
                    <Cell key={entry.name} fill={riskColors[entry.name]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "#111118", border: "1px solid rgba(255,255,255,0.08)" }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
        <SectionCard title="Risk Signal Radar" subtitle="A quick read on the balance between health, churn pressure, and expected loss." icon={<SparkIcon className="h-5 w-5" />}>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart
                data={[
                  { metric: "Health", value: Number(kpis.data.avg_health_score || 0) },
                  { metric: "At Risk", value: Number(kpis.data.at_risk_customers || 0) },
                  { metric: "Critical", value: Number(kpis.data.critical_customers || 0) },
                  { metric: "MRR Risk", value: Number(kpis.data.mrr_at_risk || 0) / 1000 },
                  { metric: "Loss", value: Number(kpis.data.expected_monthly_loss || 0) / 1000 }
                ]}
              >
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis dataKey="metric" stroke="#8f97b2" />
                <PolarRadiusAxis stroke="rgba(255,255,255,0.15)" />
                <Radar dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.35} />
                <Tooltip contentStyle={{ background: "#111118", border: "1px solid rgba(255,255,255,0.08)" }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Top-Risk Momentum" subtitle="Expected loss compared with current health and churn signal strength." icon={<DollarIcon className="h-5 w-5" />}>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskMomentum}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="customer_id" stroke="#8f97b2" interval={0} angle={-25} textAnchor="end" height={70} />
                <YAxis stroke="#8f97b2" />
                <Tooltip contentStyle={{ background: "#111118", border: "1px solid rgba(255,255,255,0.08)" }} />
                <Legend />
                <Bar dataKey="expected_loss" name="Expected Loss" fill="#6366f1" radius={[8, 8, 0, 0]} />
                <Bar dataKey="health_score" name="Health Score" fill="#22c55e" radius={[8, 8, 0, 0]} />
                <Bar dataKey="churn_signal" name="Churn Signal" fill="#f59e0b" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Top Customers At Risk" subtitle="Highest expected monthly loss ranked by revenue exposure." icon={<DollarIcon className="h-5 w-5" />}>
        <div className="overflow-x-auto">
          <table className="data-table min-w-full text-left text-sm">
            <thead className="text-muted">
              <tr className="border-b border-white/5">
                <th className="px-3 py-3 font-medium">Customer</th>
                <th className="px-3 py-3 font-medium">CSM</th>
                <th className="px-3 py-3 font-medium">Plan</th>
                <th className="px-3 py-3 font-medium">Risk</th>
                <th className="px-3 py-3 font-medium">MRR</th>
                <th className="px-3 py-3 font-medium">Expected Loss</th>
              </tr>
            </thead>
            <tbody>
              {topAtRisk.data.map((customer) => (
                <tr key={customer.customer_id} className="border-b border-white/5 text-white/90">
                  <td className="px-3 py-3">{customer.customer_id}</td>
                  <td className="px-3 py-3">{customer.csm_owner}</td>
                  <td className="px-3 py-3">{customer.plan}</td>
                  <td className="px-3 py-3">
                    <RiskBadge value={customer.risk_tier} />
                  </td>
                  <td className="px-3 py-3">{formatCurrency(customer.mrr)}</td>
                  <td className="px-3 py-3">{formatCurrency(customer.expected_monthly_loss)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
