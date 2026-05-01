import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Shield, AlertTriangle, AlertOctagon } from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine,
} from "recharts";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useStoreSelector } from "@/lib/useStore";
import { assessRisk, avgMarksOf, getStudentData, type RiskLevel } from "@/lib/dataStore";

const levelConfig: Record<RiskLevel, { color: string; bg: string; ring: string; icon: typeof Shield; label: string }> = {
  Low:    { color: "text-success", bg: "bg-success/10", ring: "ring-success/30", icon: Shield,        label: "Low risk" },
  Medium: { color: "text-warning", bg: "bg-warning/10", ring: "ring-warning/30", icon: AlertTriangle, label: "Medium risk" },
  High:   { color: "text-danger",  bg: "bg-danger/10",  ring: "ring-danger/30",  icon: AlertOctagon,  label: "High risk" },
};

export default function RiskScore() {
  const { user } = useAuth();
  const record = useStoreSelector(() => (user ? getStudentData(user.id) : undefined));

  if (!user) return null;
  if (!record) {
    return (
      <AppLayout title="Risk Score" subtitle="No academic data available">
        <Card className="p-6 bg-gradient-card border-border/60 shadow-soft">
          <p className="text-sm text-muted-foreground">No risk data is available for this account.</p>
        </Card>
      </AppLayout>
    );
  }

  const avg = avgMarksOf(record);
  const risk = assessRisk(record.attendance, avg);
  const cfg = levelConfig[risk.level];
  const Icon = cfg.icon;

  const factors = [
    { name: "Attendance",   value: record.attendance, weight: "High", impact: record.attendance < 75 ? "negative" : "positive" },
    { name: "Recent Marks", value: Math.round(avg),   weight: "High", impact: avg < 65 ? "negative" : avg >= 75 ? "positive" : "neutral" },
  ] as const;

  // Override the latest week with the live-computed score so the trend reflects current data
  const trend = [
    ...record.riskTrend.slice(0, -1),
    { week: record.riskTrend[record.riskTrend.length - 1]?.week ?? "Now", score: risk.score },
  ];

  return (
    <AppLayout title="Risk Score" subtitle="Predicted academic risk based on attendance, performance and engagement">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className={cn("p-6 lg:col-span-1 bg-gradient-card border-border/60 shadow-soft ring-2", cfg.ring)}>
          <div className="flex items-center justify-between">
            <Badge className={cn(cfg.bg, cfg.color, "border-0")}>{cfg.label}</Badge>
          </div>

          <div className="flex flex-col items-center justify-center py-8">
            <div className={cn("flex h-20 w-20 items-center justify-center rounded-full mb-4", cfg.bg)}>
              <Icon className={cn("h-10 w-10", cfg.color)} />
            </div>
            <p className={cn("text-6xl font-bold tracking-tight", cfg.color)}>{risk.score}</p>
            <p className="text-sm text-muted-foreground mt-2">Risk score (0–100)</p>
          </div>

          <div className="relative h-3 rounded-full overflow-hidden bg-secondary">
            <div className="absolute inset-0 bg-gradient-to-r from-success via-warning to-danger" />
            <div className="absolute top-0 h-full w-0.5 bg-foreground" style={{ left: `${risk.score}%` }} />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>Low</span><span>Medium</span><span>High</span>
          </div>
        </Card>

        <Card className="p-5 lg:col-span-2 bg-gradient-card border-border/60 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-foreground">Risk trend (7 weeks)</h3>
              <p className="text-xs text-muted-foreground">A rising score indicates increasing academic risk</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ left: -10, right: 10, top: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "0.5rem", fontSize: "12px" }}
                />
                <ReferenceLine y={40} stroke="hsl(var(--success))" strokeDasharray="4 4" label={{ value: "Low", fontSize: 10, fill: "hsl(var(--success))" }} />
                <ReferenceLine y={70} stroke="hsl(var(--danger))" strokeDasharray="4 4" label={{ value: "High", fontSize: 10, fill: "hsl(var(--danger))" }} />
                <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4, fill: "hsl(var(--primary))" }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="mt-6 p-5 bg-gradient-card border-border/60 shadow-soft">
        <h3 className="font-semibold text-foreground mb-1">Contributing factors</h3>
        <p className="text-xs text-muted-foreground mb-5">What's driving your current risk score</p>
        <div className="space-y-5">
          {factors.map((f) => {
            const tone = f.impact === "negative" ? "text-danger" : f.impact === "positive" ? "text-success" : "text-muted-foreground";
            return (
              <div key={f.name}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-foreground">{f.name}</span>
                    <Badge variant="secondary" className="text-[10px] py-0 px-1.5 h-5">{f.weight} impact</Badge>
                  </div>
                  <span className={cn("text-sm font-semibold", tone)}>{f.value}%</span>
                </div>
                <Progress value={f.value} className="h-2" />
              </div>
            );
          })}
        </div>
      </Card>
    </AppLayout>
  );
}
