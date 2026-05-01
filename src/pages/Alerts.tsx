import { useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AlertOctagon, AlertTriangle, Info, CheckCircle2, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { useStoreSelector } from "@/lib/useStore";
import {
  dismissAlert, generateAlertsFor, getDismissedAlerts, getStudentData,
  type AlertItem,
} from "@/lib/dataStore";

const sevConfig = {
  high:   { icon: AlertOctagon,  color: "text-danger",  bg: "bg-danger/10",  border: "border-l-danger",  label: "High" },
  medium: { icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10", border: "border-l-warning", label: "Medium" },
  low:    { icon: Info,          color: "text-info",    bg: "bg-info/10",    border: "border-l-info",    label: "Low" },
  info:   { icon: CheckCircle2,  color: "text-success", bg: "bg-success/10", border: "border-l-success", label: "Info" },
} as const;

function AlertList({ items, onDismiss }: { items: AlertItem[]; onDismiss: (id: string) => void }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground py-12 text-center">No alerts in this category 🎉</p>;
  }
  return (
    <div className="space-y-3">
      {items.map((a) => {
        const c = sevConfig[a.severity];
        const Icon = c.icon;
        return (
          <Card key={a.id} className={cn("p-4 md:p-5 border-l-4 bg-gradient-card border-border/60 shadow-soft hover:shadow-elegant transition-base", c.border)}>
            <div className="flex items-start gap-4">
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg shrink-0", c.bg)}>
                <Icon className={cn("h-5 w-5", c.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="font-semibold text-foreground">{a.title}</h4>
                  <Badge variant="secondary" className="text-[10px] h-5">{a.category}</Badge>
                  <Badge className={cn("text-[10px] h-5 border-0", c.bg, c.color)}>{c.label}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1.5">{a.description}</p>
                <div className="flex items-center gap-3 mt-3">
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {new Date(a.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                  <Button
                    variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground"
                    onClick={() => { onDismiss(a.id); toast.success("Alert dismissed"); }}
                  >Dismiss</Button>
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

export default function AlertsPage() {
  const { user } = useAuth();
  const record = useStoreSelector(() => (user ? getStudentData(user.id) : undefined));
  const dismissed = useStoreSelector(getDismissedAlerts);

  const items = useMemo(
    () => generateAlertsFor(record).filter((a) => !dismissed.includes(a.id)),
    [record, dismissed],
  );

  const [search, setSearch] = useState("");
  const filtered = items.filter((a) =>
    [a.title, a.description, a.category].some((s) => s.toLowerCase().includes(search.toLowerCase())),
  );
  const high = filtered.filter((a) => a.severity === "high");
  const others = filtered.filter((a) => a.severity !== "high");

  return (
    <AppLayout
      title="Alerts"
      subtitle="Important notifications about your academic progress"
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search alerts…"
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {(["high", "medium", "low", "info"] as const).map((sev) => {
          const count = items.filter((a) => a.severity === sev).length;
          const c = sevConfig[sev];
          return (
            <Card key={sev} className={cn("p-4 bg-gradient-card border-border/60 shadow-soft")}>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">{c.label}</span>
                <c.icon className={cn("h-4 w-4", c.color)} />
              </div>
              <p className={cn("text-2xl font-bold mt-1", c.color)}>{count}</p>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All ({filtered.length})</TabsTrigger>
          <TabsTrigger value="high">Critical ({high.length})</TabsTrigger>
          <TabsTrigger value="other">Other ({others.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4"><AlertList items={filtered} onDismiss={dismissAlert} /></TabsContent>
        <TabsContent value="high" className="mt-4"><AlertList items={high} onDismiss={dismissAlert} /></TabsContent>
        <TabsContent value="other" className="mt-4"><AlertList items={others} onDismiss={dismissAlert} /></TabsContent>
      </Tabs>
    </AppLayout>
  );
}
