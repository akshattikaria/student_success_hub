import { AppLayout } from "@/components/layout/AppLayout";
import { StatCard } from "@/components/StatCard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Award, BookOpen, CalendarCheck, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar,
} from "recharts";
import { useAuth } from "@/lib/auth";
import { useStoreSelector } from "@/lib/useStore";
import { assessRisk, avgMarksOf, getStudentData } from "@/lib/dataStore";

const chartTooltipStyle = {
  contentStyle: {
    background: "hsl(var(--popover))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "0.5rem",
    fontSize: "12px",
  },
  labelStyle: { color: "hsl(var(--foreground))", fontWeight: 600 },
};

export default function StudentDashboard() {
  const { user } = useAuth();
  const record = useStoreSelector(() => (user ? getStudentData(user.id) : undefined));

  if (!user) return null;
  if (!record) {
    return (
      <AppLayout title="Welcome" subtitle="No academic record found for this account">
        <Card className="p-6 bg-gradient-card border-border/60 shadow-soft">
          <p className="text-sm text-muted-foreground">
            Your account doesn't have any academic data yet. Please contact the administrator.
          </p>
        </Card>
      </AppLayout>
    );
  }

  const firstName = user.name.split(" ")[0];
  const avg = Math.round(avgMarksOf(record));
  const risk = assessRisk(record.attendance, avg);
  const attendanceData = record.subjects.map((s) => ({ subject: s.short, attendance: s.attendance }));

  return (
    <AppLayout
      title={`Welcome back, ${firstName} 👋`}
      subtitle={`${record.program} · ${record.year} · ${user.id}`}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Overall GPA"   value={record.gpa.toFixed(2)} icon={Award}         accent="primary" hint={`Rank #${record.rank} in cohort`} />
        <StatCard label="Attendance"    value={`${record.attendance}%`} icon={CalendarCheck} accent={record.attendance < 75 ? "warning" : "success"} hint={record.attendance < 85 ? "Below target (85%)" : "On target"} />
        <StatCard label="Credits Earned" value={record.credits} icon={BookOpen}     accent="info" hint="of 120 total" />
        <StatCard label="Avg Performance" value={`${avg}%`} icon={TrendingUp}        accent={risk.level === "Low" ? "success" : risk.level === "High" ? "danger" : "warning"} hint={`${risk.level} risk`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
        <Card className="lg:col-span-2 p-5 bg-gradient-card border-border/60 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-foreground">Performance Trend</h3>
              <p className="text-xs text-muted-foreground">Your monthly score vs class average</p>
            </div>
            <Badge variant="secondary" className="bg-primary/10 text-primary border-0">Last 8 months</Badge>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={record.performanceTrend} margin={{ left: -10, right: 10, top: 10 }}>
                <defs>
                  <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip {...chartTooltipStyle} />
                <Area type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#scoreFill)" name="Your score" />
                <Area type="monotone" dataKey="average" stroke="hsl(var(--muted-foreground))" strokeWidth={1.5} strokeDasharray="4 4" fill="transparent" name="Class avg" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5 bg-gradient-card border-border/60 shadow-soft">
          <h3 className="font-semibold text-foreground">Attendance by subject</h3>
          <p className="text-xs text-muted-foreground mb-4">Current semester</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceData} margin={{ left: -10, right: 10, top: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="subject" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip {...chartTooltipStyle} />
                <Bar dataKey="attendance" radius={[6, 6, 0, 0]} fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="mt-6 p-5 bg-gradient-card border-border/60 shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-foreground">Recent Marks</h3>
            <p className="text-xs text-muted-foreground">Latest assessment scores by subject</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {record.subjects.map((s) => (
            <div key={s.subject} className="rounded-xl border border-border bg-card p-4 hover:shadow-elegant transition-base">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">{s.subject}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Grade {s.grade}</p>
                </div>
                <div className={`flex items-center gap-1 text-xs font-medium ${s.trend === "up" ? "text-success" : "text-danger"}`}>
                  {s.trend === "up" ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                </div>
              </div>
              <div className="mt-3 flex items-end justify-between">
                <span className="text-2xl font-bold text-foreground">{s.marks}</span>
                <span className="text-xs text-muted-foreground">/ 100</span>
              </div>
              <Progress value={s.marks} className="mt-3 h-1.5" />
            </div>
          ))}
        </div>
      </Card>
    </AppLayout>
  );
}
