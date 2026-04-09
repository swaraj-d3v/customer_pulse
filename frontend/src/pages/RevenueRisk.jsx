import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import ErrorState from "../components/ErrorState";
import { DollarIcon, WarningIcon } from "../components/Icons";
import KPICard from "../components/KPICard";
import LoadingState from "../components/LoadingState";
import RiskBadge from "../components/RiskBadge";
import SectionCard from "../components/SectionCard";
import { formatCompactCurrency, formatCurrency, formatNumber } from "../lib/formatters";
import { useApi } from "../lib/hooks";

const priorityColors = ["#ef4444", "#f59e0b", "#38bdf8"];

export default function RevenueRisk() {
  const summary = useApi("/api/revenue/at-risk-summary", {});
  const priorityList = useApi("/api/revenue/priority-list?limit=20", []);

  if (summary.loading || priorityList.loading) {
    return <LoadingState label="Loading revenue risk data..." />;
  }

  if (summary.error || priorityList.error) {
    return <ErrorState message={summary.error || priorityList.error} />;
  }

  const priorityMix = [
    { name: "P1", value: Number(summary.data.priority_p1_customers || 0) },
    { name: "P2", value: Number(summary.data.priority_p2_customers || 0) },
    { name: "P3", value: Number(summary.data.priority_p3_customers || 0) }
  ];

  const lossBars = priorityList.data.slice(0, 8).map((item) => ({
    customer_id: item.customer_id,
    expected_monthly_loss: Number(item.expected_monthly_loss || 0)
  }));

  const scatterData = priorityList.data.map((item) => ({
    customer_id: item.customer_id,
    mrr_at_risk: Number(item.mrr_at_risk || 0),
    expected_monthly_loss: Number(item.expected_monthly_loss || 0),
    priority: item.revenue_priority
  }));

  const tierMix = Object.values(
    priorityList.data.reduce((acc, item) => {
      const key = item.risk_tier || "Unknown";
      acc[key] = acc[key] || { name: key, count: 0 };
      acc[key].count += 1;
      return acc;
    }, {})
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KPICard label="Total MRR" value={formatCompactCurrency(summary.data.total_mrr)} tone="info" icon={<DollarIcon className="h-5 w-5" />} eyebrow="Portfolio" className="stagger-1" />
        <KPICard label="MRR At Risk" value={formatCompactCurrency(summary.data.total_mrr_at_risk)} tone="danger" icon={<WarningIcon className="h-5 w-5" />} eyebrow="Exposure" className="stagger-2" />
        <KPICard
          label="Expected Monthly Loss"
          value={formatCompactCurrency(summary.data.total_expected_monthly_loss)}
          tone="accent"
          icon={<DollarIcon className="h-5 w-5" />}
          eyebrow="Forecast"
          className="stagger-3"
        />
        <KPICard label="Priority P1 Accounts" value={formatNumber(summary.data.priority_p1_customers)} tone="warning" icon={<WarningIcon className="h-5 w-5" />} eyebrow="Priority" className="stagger-4" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr,1.1fr]">
        <SectionCard title="Priority Mix" subtitle="Current revenue intervention queue by priority band." icon={<WarningIcon className="h-5 w-5" />}>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={priorityMix} dataKey="value" nameKey="name" outerRadius={110} innerRadius={65}>
                  {priorityMix.map((item, index) => (
                    <Cell key={item.name} fill={priorityColors[index]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "#111118", border: "1px solid rgba(255,255,255,0.08)" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Expected Loss by Account" subtitle="Highest loss exposure in the current portfolio." icon={<DollarIcon className="h-5 w-5" />}>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={lossBars}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="customer_id" stroke="#8f97b2" interval={0} angle={-25} textAnchor="end" height={72} />
                <YAxis stroke="#8f97b2" />
                <Tooltip contentStyle={{ background: "#111118", border: "1px solid rgba(255,255,255,0.08)" }} />
                <Bar dataKey="expected_monthly_loss" fill="#6366f1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.85fr,1.15fr]">
        <SectionCard title="Risk Tier Distribution" subtitle="Count of priority accounts by current health tier." icon={<WarningIcon className="h-5 w-5" />}>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={tierMix} dataKey="count" nameKey="name" outerRadius={108} innerRadius={58}>
                  {tierMix.map((item) => (
                    <Cell
                      key={item.name}
                      fill={item.name === "Healthy" ? "#22c55e" : item.name === "At Risk" ? "#f59e0b" : "#ef4444"}
                    />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "#111118", border: "1px solid rgba(255,255,255,0.08)" }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Loss vs Exposure" subtitle="Expected monthly loss plotted against MRR at risk for priority accounts." icon={<DollarIcon className="h-5 w-5" />}>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="mrr_at_risk" stroke="#8f97b2" name="MRR At Risk" />
                <YAxis dataKey="expected_monthly_loss" stroke="#8f97b2" name="Expected Loss" />
                <Tooltip cursor={{ strokeDasharray: "3 3" }} contentStyle={{ background: "#111118", border: "1px solid rgba(255,255,255,0.08)" }} />
                <Scatter data={scatterData} fill="#6366f1" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Priority Accounts" subtitle="Sorted by priority, expected monthly loss, and churn urgency." icon={<WarningIcon className="h-5 w-5" />}>
        <div className="overflow-x-auto">
          <table className="data-table min-w-full text-left text-sm">
            <thead className="text-muted">
              <tr className="border-b border-white/5">
                <th className="px-3 py-3 font-medium">Customer</th>
                <th className="px-3 py-3 font-medium">Priority</th>
                <th className="px-3 py-3 font-medium">Risk</th>
                <th className="px-3 py-3 font-medium">CSM</th>
                <th className="px-3 py-3 font-medium">MRR At Risk</th>
                <th className="px-3 py-3 font-medium">Expected Loss</th>
              </tr>
            </thead>
            <tbody>
              {priorityList.data.map((row) => (
                <tr key={row.customer_id} className="border-b border-white/5">
                  <td className="px-3 py-3 text-white">
                    <p>{row.customer_id}</p>
                    <p className="text-xs text-muted">
                      {row.plan} • {row.region} • {row.industry}
                    </p>
                  </td>
                  <td className="px-3 py-3">
                    <RiskBadge value={row.revenue_priority} />
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-col gap-2">
                      <RiskBadge value={row.risk_tier} />
                      <RiskBadge value={row.churn_risk_band} />
                    </div>
                  </td>
                  <td className="px-3 py-3 text-white">{row.csm_owner}</td>
                  <td className="px-3 py-3 text-white">{formatCurrency(row.mrr_at_risk)}</td>
                  <td className="px-3 py-3 text-white">{formatCurrency(row.expected_monthly_loss)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
