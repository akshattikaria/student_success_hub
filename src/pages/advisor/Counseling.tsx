import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { CalendarPlus, CheckCircle2, Clock, RotateCw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useStoreSelector } from "@/lib/useStore";
import {
  addCounselingSession, addStudentNote, getCounselingSessions, getRankedStudents,
  updateCounselingSession,
} from "@/lib/dataStore";
import { useAuth } from "@/lib/auth";

const statusStyle = {
  scheduled: "bg-info/10 text-info",
  completed: "bg-success/10 text-success",
  "follow-up": "bg-warning/10 text-warning",
} as const;

const statusIcon = {
  scheduled: Clock,
  completed: CheckCircle2,
  "follow-up": RotateCw,
} as const;

export default function Counseling() {
  const { user } = useAuth();
  const sessions = useStoreSelector(getCounselingSessions);
  const ranked = useStoreSelector(getRankedStudents);

  const [studentId, setStudentId] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ranked2 = ranked.find((r) => r.user.id === studentId);
    if (!ranked2 || !date) {
      toast.error("Please select a student and a date.");
      return;
    }
    addCounselingSession({
      studentId: ranked2.user.id,
      studentName: ranked2.user.name,
      date,
      status: "scheduled",
      notes: notes || "—",
    });
    if (notes && user) {
      addStudentNote(ranked2.user.id, { id: user.id, name: user.name }, notes);
    }
    setStudentId(""); setDate(""); setNotes("");
    toast.success(`Session scheduled with ${ranked2.user.name}`);
  };

  return (
    <AppLayout title="Counseling" subtitle="Schedule sessions and track outcomes">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-5 bg-gradient-card border-border/60 shadow-soft lg:col-span-1">
          <h3 className="font-semibold text-foreground">New session</h3>
          <p className="text-xs text-muted-foreground mb-4">Book a counseling slot with a student</p>
          <form onSubmit={handleSubmit} className="space-y-3">
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
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Initial notes</Label>
              <Textarea id="notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Topics to discuss…" />
            </div>
            <Button type="submit" className="w-full bg-gradient-primary text-primary-foreground">
              <CalendarPlus className="h-4 w-4 mr-1.5" /> Schedule
            </Button>
          </form>
        </Card>

        <Card className="p-5 bg-gradient-card border-border/60 shadow-soft lg:col-span-2">
          <h3 className="font-semibold text-foreground">Recent sessions</h3>
          <p className="text-xs text-muted-foreground mb-4">{sessions.length} sessions on record</p>
          <div className="space-y-3">
            {sessions.map((s) => {
              const Icon = statusIcon[s.status];
              return (
                <div key={s.id} className="rounded-xl border border-border bg-card p-4 hover:shadow-elegant transition-base">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-sm">{s.studentName}</p>
                      <p className="text-xs text-muted-foreground">{s.studentId} · {new Date(s.date).toLocaleDateString()}</p>
                    </div>
                    <Badge className={cn("border-0 capitalize", statusStyle[s.status])}>
                      <Icon className="h-3 w-3 mr-1" /> {s.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{s.notes}</p>
                  <div className="flex gap-2 mt-3">
                    {s.status !== "completed" && (
                      <Button
                        size="sm" variant="outline" className="h-7 text-xs"
                        onClick={() => {
                          updateCounselingSession(s.id, { status: "completed" });
                          toast.success("Marked as completed");
                        }}
                      >Mark complete</Button>
                    )}
                    {s.status === "scheduled" && (
                      <Button
                        size="sm" variant="ghost" className="h-7 text-xs"
                        onClick={() => {
                          updateCounselingSession(s.id, { status: "follow-up" });
                          toast.success("Moved to follow-up");
                        }}
                      >Needs follow-up</Button>
                    )}
                  </div>
                </div>
              );
            })}
            {sessions.length === 0 && (
              <p className="text-sm text-muted-foreground py-8 text-center">No sessions yet</p>
            )}
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
