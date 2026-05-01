import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatCard } from "@/components/StatCard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { ClipboardList, CheckCircle2, PlayCircle, PauseCircle, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useStoreSelector } from "@/lib/useStore";
import {
  addIntervention, getInterventions, getRankedStudents, updateIntervention,
  type Intervention,
} from "@/lib/dataStore";

const statusStyle = {
  active: "bg-info/10 text-info",
  completed: "bg-success/10 text-success",
  paused: "bg-warning/10 text-warning",
} as const;

const TYPES: Intervention["type"][] = ["Tutoring", "Counseling", "Mentoring", "Study Plan"];

export default function Interventions() {
  const items = useStoreSelector(getInterventions);
  const ranked = useStoreSelector(getRankedStudents);
  const [search, setSearch] = useState("");

  // Create-intervention dialog state
  const [open, setOpen] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [type, setType] = useState<Intervention["type"]>("Tutoring");
  const [notes, setNotes] = useState("");

  const filtered = items.filter((i) =>
    [i.studentName, i.type, i.studentId].some((v) => v.toLowerCase().includes(search.toLowerCase())),
  );

  const active = items.filter((i) => i.status === "active").length;
  const completed = items.filter((i) => i.status === "completed").length;
  const avgProgress = items.length ? Math.round(items.reduce((s, i) => s + i.progress, 0) / items.length) : 0;

  const togglePause = (id: string, current: Intervention["status"]) => {
    updateIntervention(id, { status: current === "paused" ? "active" : "paused" });
    toast.success("Intervention status updated");
  };
  const complete = (id: string) => {
    updateIntervention(id, { status: "completed", progress: 100 });
    toast.success("Intervention marked complete");
  };

  const resetForm = () => {
    setStudentId(""); setType("Tutoring"); setNotes("");
  };

  const handleCreate = () => {
    if (!studentId) { toast.error("Please select a student."); return; }
    const created = addIntervention({ studentId, type });
    if (!created) { toast.error("Could not create intervention."); return; }
    toast.success(`Started ${type} for ${created.studentName}${notes ? " (notes saved)" : ""}`);
    setOpen(false);
    resetForm();
  };

  return (
    <AppLayout
      title="Interventions"
      subtitle="Track active support plans and outcomes"
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search interventions…"
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Active"       value={active}            icon={PlayCircle}    accent="info" />
        <StatCard label="Completed"    value={completed}         icon={CheckCircle2}  accent="success" />
        <StatCard label="Avg Progress" value={`${avgProgress}%`} icon={ClipboardList} accent="primary" />
      </div>

      <div className="mt-6 flex items-center justify-between">
        <h3 className="font-semibold text-foreground">All interventions</h3>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-gradient-primary text-primary-foreground">
              <Plus className="h-4 w-4 mr-1.5" /> New intervention
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create intervention</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Student</Label>
                <Select value={studentId} onValueChange={setStudentId}>
                  <SelectTrigger><SelectValue placeholder="Select a student" /></SelectTrigger>
                  <SelectContent>
                    {ranked.map((r) => (
                      <SelectItem key={r.user.id} value={r.user.id}>
                        {r.user.name} · {r.level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={type} onValueChange={(v) => setType(v as Intervention["type"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="i-notes">Initial notes (optional)</Label>
                <Textarea id="i-notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder="Goals, schedule, success criteria…" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} className="bg-gradient-primary text-primary-foreground">Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((i) => (
          <Card key={i.id} className="p-5 bg-gradient-card border-border/60 shadow-soft hover:shadow-elegant transition-base">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="font-semibold text-foreground">{i.studentName}</h4>
                <p className="text-xs text-muted-foreground">{i.studentId} · since {new Date(i.startDate).toLocaleDateString()}</p>
              </div>
              <Badge className={cn("border-0 capitalize", statusStyle[i.status])}>{i.status}</Badge>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">{i.type}</Badge>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-muted-foreground">Progress</span>
                <span className="text-xs font-medium">{i.progress}%</span>
              </div>
              <Progress value={i.progress} className="h-2" />
            </div>
            <div className="mt-4 flex gap-2">
              {i.status !== "completed" && (
                <>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => togglePause(i.id, i.status)}>
                    {i.status === "paused" ? <><PlayCircle className="h-3 w-3 mr-1" /> Resume</> : <><PauseCircle className="h-3 w-3 mr-1" /> Pause</>}
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => complete(i.id)}>
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Complete
                  </Button>
                </>
              )}
            </div>
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="col-span-full text-sm text-muted-foreground py-12 text-center">
            {items.length === 0 ? "No interventions yet — click \"New intervention\" to create one" : `No interventions match "${search}"`}
          </p>
        )}
      </div>
    </AppLayout>
  );
}
