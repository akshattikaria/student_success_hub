import { AppLayout } from "@/components/layout/AppLayout";
import { StatCard } from "@/components/StatCard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users, GraduationCap, HeartHandshake, ShieldCheck, AlertTriangle,
  TrendingUp, ArrowRight, Activity,
} from "lucide-react";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { Link } from "react-router-dom";
import { useStoreSelector } from "@/lib/useStore";
import {
  getDepartmentSummary, getRankedStudents, getUsers,
} from "@/lib/dataStore";
import { roleLabel } from "@/lib/auth";
import { cn } from "@/lib/utils";

const ROLE_COLORS = {
  student: "hsl(var(--info))",
  teacher: "hsl(var(--primary))",
  advisor: "hsl(var(--warning))",
  admin:   "hsl(var(--accent))",
} as const;

const riskBadge = {
  Low:    "bg-success/10 text-success",
  Medium: "bg-warning/10 text-warning",
  High:   "bg-danger/10 text-danger",
} as const;

export default function AdminDashboard() {
  const summary = useStoreSelector(getDepartmentSummary);
  const users = useStoreSelector(getUsers);
  const ranked = useStoreSelector(getRankedStudents);

  const roleDist = (["student", "teacher", "advisor", "admin"] as const).map((r) => ({
    name: roleLabel(r),
    value: users.filter((u) => u.role === r).length,
    color: ROLE_COLORS[r],
  }));

  const riskDist = [
    { level: "Low",    count: ranked.filter((r) => r.level === "Low").length,    color: "hsl(var(--success))" },
    { level: "Medium", count: ranked.filter((r) => r.level === "Medium").length, color: "hsl(var(--warning))" },
    { level: "High",   count: ranked.filter((r) => r.level === "High").length,   color: "hsl(var(--danger))" },
  ];

  const recentUsers = [...users].slice(0, 6);
  const topRisk = ranked.filter((r) => r.level !== "Low").slice(0, 5);

  return (
    <AppLayout title="Admin Dashboard" subtitle={`${summary.name} · system overview`}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users"  value={summary.totalUsers}    icon={Users}         accent="primary" />
        <StatCard label="Students"     value={summary.totalStudents} icon={GraduationCap} accent="info" />
        <StatCard label="Faculty"      value={summary.totalFaculty}  icon={ShieldCheck}   accent="success" />
        <StatCard label="At-Risk Rate" value={`${summary.atRiskRate}%`} icon={AlertTriangle} accent="danger"
          hint={`Pass rate ${summary.passRate}%`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
        <Card className="p-5 bg-gradient-card border-border/60 shadow-soft lg:col-span-1">
          <h3 className="font-semibold text-foreground">Role distribution</h3>
          <p className="text-xs text-muted-foreground mb-4">Active accounts in the system</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={roleDist} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
                  {roleDist.map((d) => <Cell key={d.name} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "0.5rem", fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {roleDist.map((d) => (
              <div key={d.name} className="flex items-center gap-2 text-xs">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                <span className="text-muted-foreground flex-1 truncate">{d.name}</span>
                <span className="font-semibold">{d.value}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 bg-gradient-card border-border/60 shadow-soft lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-foreground">Student risk breakdown</h3>
              <p className="text-xs text-muted-foreground">Distribution across the cohort</p>
            </div>
            <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
              <Activity className="h-3 w-3 mr-1" /> Live
            </Badge>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskDist} margin={{ left: -10, right: 10, top: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="level" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "0.5rem", fontSize: "12px" }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {riskDist.map((d) => <Cell key={d.level} fill={d.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
        <Card className="p-5 bg-gradient-card border-border/60 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-foreground">Recent users</h3>
              <p className="text-xs text-muted-foreground">{users.length} accounts on file</p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/users">Manage <ArrowRight className="h-3 w-3 ml-1" /></Link>
            </Button>
          </div>
          <ul className="space-y-2">
            {recentUsers.map((u) => (
              <li key={u.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{u.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                </div>
                <Badge variant="secondary" className="text-xs">{roleLabel(u.role)}</Badge>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-5 bg-gradient-card border-border/60 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-foreground">Top at-risk students</h3>
              <p className="text-xs text-muted-foreground">{ranked.filter((r) => r.level !== "Low").length} flagged</p>
            </div>
            <Badge variant="secondary" className="bg-warning/10 text-warning border-0">
              <TrendingUp className="h-3 w-3 mr-1" /> needs attention
            </Badge>
          </div>
          <ul className="space-y-2">
            {topRisk.map((r) => (
              <li key={r.user.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{r.user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{r.user.id} · {r.attendance}% att · GPA {r.record.gpa.toFixed(2)}</p>
                </div>
                <Badge className={cn("border-0", riskBadge[r.level])}>{r.level}</Badge>
              </li>
            ))}
            {topRisk.length === 0 && (
              <p className="text-sm text-muted-foreground py-6 text-center">No at-risk students 🎉</p>
            )}
          </ul>
        </Card>
      </div>
    </AppLayout>
  );
}
