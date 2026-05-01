import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
  trend?: number;
  accent?: "primary" | "success" | "warning" | "danger" | "info";
  hint?: string;
}

const accentMap = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-danger/10 text-danger",
  info: "bg-info/10 text-info",
};

export function StatCard({ label, value, icon: Icon, trend, accent = "primary", hint }: StatCardProps) {
  return (
    <Card className="p-5 bg-gradient-card shadow-soft hover:shadow-elegant transition-base border-border/60">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className="mt-2 text-2xl md:text-3xl font-bold text-foreground">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
          {trend !== undefined && (
            <div className={cn("mt-2 inline-flex items-center gap-1 text-xs font-medium",
              trend >= 0 ? "text-success" : "text-danger")}>
              {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(trend)}% vs last month
            </div>
          )}
        </div>
        <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl shrink-0", accentMap[accent])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}
