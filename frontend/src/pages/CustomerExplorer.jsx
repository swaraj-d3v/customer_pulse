import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
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
import { SearchIcon, SparkIcon, TrendUpIcon } from "../components/Icons";
import LoadingState from "../components/LoadingState";
import RiskBadge from "../components/RiskBadge";
import SectionCard from "../components/SectionCard";
import { fetchJson } from "../lib/api";
import { formatCurrency, formatNumber } from "../lib/formatters";

export default function CustomerExplorer() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadSearch() {
      setLoading(true);
      setError("");
      try {
        const data = await fetchJson(`/api/customers/search?q=${encodeURIComponent(query)}&limit=20`);
        if (!active) return;
        setResults(data);
        if (data.length > 0) {
          setSelectedId((current) => current || data[0].customer_id);
        }
      } catch (err) {
        if (active) {
          setError(err.message || "Unable to load customers");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadSearch();
    return () => {
      active = false;
    };
  }, [query]);

  useEffect(() => {
    if (!selectedId) return;
    let active = true;

    async function loadCustomer() {
      setDetailLoading(true);
      try {
        const data = await fetchJson(`/api/customers/${selectedId}`);
        if (active) {
          setCustomer(data);
        }
      } catch (err) {
        if (active) {
          setError(err.message || "Unable to load customer");
        }
      } finally {
        if (active) {
          setDetailLoading(false);
        }
      }
    }

    loadCustomer();
    return () => {
      active = false;
    };
  }, [selectedId]);

  if (loading && results.length === 0) {
    return <LoadingState label="Loading customers..." />;
  }

  if (error && results.length === 0) {
    return <ErrorState message={error} />;
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[420px,1fr]">
      <SectionCard
        title="Search Customer"
        subtitle="Filter by customer, plan, region, industry, or owner."
        icon={<SearchIcon className="h-5 w-5" />}
      >
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search accounts..."
            className="w-full rounded-2xl border border-white/10 bg-white/[0.04] py-3 pl-11 pr-4 text-sm text-white outline-none transition focus:border-accent/50"
          />
        </div>
        <div className="mt-5 space-y-3">
          {results.map((item) => (
            <button
              key={item.customer_id}
              type="button"
              onClick={() => setSelectedId(item.customer_id)}
              className={`animate-enter w-full rounded-2xl border p-4 text-left transition ${
                selectedId === item.customer_id
                  ? "border-accent/40 bg-accent/10 shadow-glow"
                  : "border-white/5 bg-white/[0.03] hover:border-white/10 hover:bg-white/[0.05]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-white">{item.customer_id}</p>
                  <p className="mt-1 text-sm text-muted">
                    {item.plan} • {item.region} • {item.industry}
                  </p>
                </div>
                <RiskBadge value={item.risk_tier} />
              </div>
              <div className="mt-3 flex items-center justify-between text-sm text-muted">
                <span>Health {formatNumber(item.health_score)}</span>
                <span>{formatCurrency(item.mrr)}</span>
              </div>
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Customer Profile"
        subtitle="Profile, health, activity, and revenue context."
        icon={<SparkIcon className="h-5 w-5" />}
      >
        {detailLoading && !customer ? (
          <LoadingState label="Loading customer profile..." />
        ) : customer ? (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricTile label="Health Score" value={formatNumber(customer.health_score)} icon={<SparkIcon className="h-4 w-4" />} />
              <MetricTile label="MRR" value={formatCurrency(customer.mrr)} />
              <MetricTile label="Events (30d)" value={formatNumber(customer.events_30d)} icon={<SearchIcon className="h-4 w-4" />} />
              <MetricTile label="Expected Loss" value={formatCurrency(customer.expected_monthly_loss)} icon={<TrendUpIcon className="h-4 w-4" />} />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="panel-soft p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-muted">Account Snapshot</p>
                <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                  <ProfileField label="Customer ID" value={customer.customer_id} />
                  <ProfileField label="Plan" value={customer.plan} />
                  <ProfileField label="Region" value={customer.region} />
                  <ProfileField label="Industry" value={customer.industry} />
                  <ProfileField label="CSM Owner" value={customer.csm_owner} />
                  <ProfileField label="Contract" value={customer.Contract} />
                  <ProfileField label="Revenue Priority" value={<RiskBadge value={customer.revenue_priority} />} />
                  <ProfileField label="Risk Tier" value={<RiskBadge value={customer.risk_tier} />} />
                </dl>
              </div>

              <div className="panel-soft p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-muted">Product and Payment Signals</p>
                <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                  <ProfileField label="Last Event" value={customer.last_event_at || "No activity"} />
                  <ProfileField label="Distinct Features" value={formatNumber(customer.distinct_features_used)} />
                  <ProfileField label="Login Trend" value={formatNumber(customer.login_trend_pct)} />
                  <ProfileField label="Feature Trend" value={formatNumber(customer.feature_trend_pct)} />
                  <ProfileField label="Payment Method" value={customer.PaymentMethod} />
                  <ProfileField label="NPS Score" value={formatNumber(customer.nps_score)} />
                  <ProfileField label="Churn Risk Band" value={<RiskBadge value={customer.churn_risk_band} />} />
                  <ProfileField label="Revenue At Risk" value={formatCurrency(customer.mrr_at_risk)} />
                </dl>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1fr,1fr]">
              <div className="panel-soft p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-muted">Activity Mix</p>
                <div className="mt-4 h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: "Events", value: Number(customer.events_30d || 0) },
                        { name: "Logins", value: Number(customer.logins_30d || 0) },
                        { name: "Features", value: Number(customer.features_30d || 0) },
                        { name: "Distinct", value: Number(customer.distinct_features_used || 0) }
                      ]}
                    >
                      <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                      <XAxis dataKey="name" stroke="#8f97b2" />
                      <YAxis stroke="#8f97b2" />
                      <Tooltip contentStyle={{ background: "#111118", border: "1px solid rgba(255,255,255,0.08)" }} />
                      <Bar dataKey="value" fill="#6366f1" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="panel-soft p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-muted">Health Profile</p>
                <div className="mt-4 h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart
                      data={[
                        { subject: "Health", score: Number(customer.health_score || 0) },
                        { subject: "NPS", score: Math.max(Number(customer.nps_score || 0), 0) },
                        { subject: "Logins", score: Math.min(Number(customer.logins_30d || 0) * 4, 100) },
                        { subject: "Features", score: Math.min(Number(customer.features_30d || 0) * 5, 100) },
                        { subject: "Revenue", score: Math.min(Number(customer.mrr || 0), 100) }
                      ]}
                    >
                      <PolarGrid stroke="rgba(255,255,255,0.08)" />
                      <PolarAngleAxis dataKey="subject" stroke="#8f97b2" />
                      <PolarRadiusAxis stroke="rgba(255,255,255,0.15)" />
                      <Radar dataKey="score" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.3} />
                      <Tooltip contentStyle={{ background: "#111118", border: "1px solid rgba(255,255,255,0.08)" }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="panel-soft p-8 text-sm text-muted">Select a customer to explore account detail.</div>
        )}
      </SectionCard>
    </div>
  );
}

function MetricTile({ label, value, icon }) {
  return (
    <div className="panel-soft p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted">{label}</p>
        {icon ? <span className="glass-dot h-8 w-8 text-accent">{icon}</span> : null}
      </div>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

function ProfileField({ label, value }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-[0.25em] text-muted">{label}</dt>
      <dd className="mt-2 text-sm text-white">{value}</dd>
    </div>
  );
}
