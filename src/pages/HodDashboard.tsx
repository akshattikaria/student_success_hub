import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatCard } from "@/components/StatCard";
import { Card } from "@/components/ui/card";
import { GraduationCap, AlertTriangle, ShieldAlert, ShieldCheck, Activity } from "lucide-react";

const API_BASE = "http://localhost:5000";

interface HodOverview {
  total:        number;
  high:         number;
  medium:       number;
  low:          number;
  avgRiskScore: number;
}

export default function HodDashboard() {
  const [data,    setData]    = useState<HodOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("edu_auth_token");
    fetch(`${API_BASE}/api/hod/overview`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error(`Server returned ${r.status}`);
        return r.json();
      })
      .then((d: HodOverview) => { setData(d); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <AppLayout title="HOD Overview" subtitle="Department risk summary">
        <p className="text-sm text-muted-foreground py-12 text-center">Loading…</p>
      </AppLayout>
    );
  }

  if (error || !data) {
    return (
      <AppLayout title="HOD Overview" subtitle="Department risk summary">
        <p className="text-sm text-danger py-12 text-center">{error ?? "Failed to load data."}</p>
      </AppLayout>
    );
  }

  const atRiskPct = data.total
    ? Math.round(((data.high + data.medium) / data.total) * 100)
    : 0;

  return (
    <AppLayout title="HOD Overview" subtitle="Department-wide student risk summary">

      {/* ── Stat cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Students"
          value={data.total}
          icon={GraduationCap}
          accent="primary"
        />
        <StatCard
          label="High Risk"
          value={data.high}
          icon={AlertTriangle}
          accent="danger"
          hint={data.total ? `${Math.round((data.high / data.total) * 100)}% of cohort` : ""}
        />
        <StatCard
          label="Medium Risk"
          value={data.medium}
          icon={ShieldAlert}
          accent="warning"
          hint={data.total ? `${Math.round((data.medium / data.total) * 100)}% of cohort` : ""}
        />
        <StatCard
          label="Avg Risk Score"
          value={data.avgRiskScore}
          icon={Activity}
          accent={data.avgRiskScore >= 60 ? "danger" : data.avgRiskScore >= 35 ? "warning" : "success"}
          hint="0 = no risk · 100 = max risk"
        />
      </div>

      {/* ── Risk breakdown card ───────────────────────────────────────────── */}
      <Card className="p-5 bg-gradient-card border-border/60 shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-foreground">Risk breakdown</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {atRiskPct}% of students require attention
            </p>
          </div>
          <ShieldCheck className="h-5 w-5 text-muted-foreground" />
        </div>

        <div className="space-y-3">
          {/* High */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium text-danger">High risk</span>
              <span className="text-muted-foreground">{data.high} / {data.total}</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-danger transition-all"
                style={{ width: data.total ? `${(data.high / data.total) * 100}%` : "0%" }}
              />
            </div>
          </div>

          {/* Medium */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium text-warning">Medium risk</span>
              <span className="text-muted-foreground">{data.medium} / {data.total}</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-warning transition-all"
                style={{ width: data.total ? `${(data.medium / data.total) * 100}%` : "0%" }}
              />
            </div>
          </div>

          {/* Low */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium text-success">Low risk</span>
              <span className="text-muted-foreground">{data.low} / {data.total}</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-success transition-all"
                style={{ width: data.total ? `${(data.low / data.total) * 100}%` : "0%" }}
              />
            </div>
          </div>
        </div>
      </Card>

    </AppLayout>
  );
}
