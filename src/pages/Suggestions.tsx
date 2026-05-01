import { useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar, Target, Users, UserCheck, BookOpen, Clock, Sparkles, ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { useStoreSelector } from "@/lib/useStore";
import { generateSuggestionsFor, getStudentData } from "@/lib/dataStore";

const iconMap = {
  calendar: Calendar,
  target: Target,
  users: Users,
  "user-check": UserCheck,
  "book-open": BookOpen,
  clock: Clock,
};

const priorityStyle = {
  High:   "bg-danger/10 text-danger",
  Medium: "bg-warning/10 text-warning",
  Low:    "bg-info/10 text-info",
} as const;

export default function Suggestions() {
  const { user } = useAuth();
  const record = useStoreSelector(() => (user ? getStudentData(user.id) : undefined));
  const items = useMemo(() => generateSuggestionsFor(record), [record]);

  const [taken, setTaken] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");

  const filtered = items.filter((s) =>
    [s.title, s.description, s.priority].some((v) => v.toLowerCase().includes(search.toLowerCase())),
  );
  const highCount = items.filter((s) => s.priority === "High").length;

  return (
    <AppLayout
      title="Suggestions"
      subtitle="Personalised recommendations to help you stay on track"
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search suggestions…"
    >
      <Card className="p-6 mb-6 bg-gradient-primary text-primary-foreground border-0 shadow-glow overflow-hidden relative">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm shrink-0">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold">You have {highCount} high-priority actions</h3>
            <p className="text-sm text-primary-foreground/85 mt-1">Acting on these now can lower your risk score by up to 25 points.</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((s) => {
          const Icon = iconMap[s.icon as keyof typeof iconMap] ?? Sparkles;
          const isTaken = taken.has(s.id);
          return (
            <Card key={s.id} className={cn(
              "p-5 bg-gradient-card border-border/60 shadow-soft hover:shadow-elegant hover:-translate-y-0.5 transition-base",
              isTaken && "opacity-70"
            )}>
              <div className="flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <Badge className={cn("border-0", priorityStyle[s.priority])}>
                  {s.priority}
                </Badge>
              </div>
              <h4 className="font-semibold text-foreground mt-4">{s.title}</h4>
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{s.description}</p>
              <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {s.estimate}
                </span>
                <Button
                  variant="ghost" size="sm" className="h-7 text-xs"
                  disabled={isTaken}
                  onClick={() => {
                    setTaken((cur) => new Set(cur).add(s.id));
                    toast.success(`"${s.title}" added to your plan`);
                  }}
                >
                  {isTaken ? "Added" : <>Take action <ArrowRight className="h-3 w-3 ml-1" /></>}
                </Button>
              </div>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <p className="col-span-full text-sm text-muted-foreground py-12 text-center">No suggestions match "{search}"</p>
        )}
      </div>
    </AppLayout>
  );
}
