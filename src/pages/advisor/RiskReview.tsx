import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { Download, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { useStoreSelector } from "@/lib/useStore";
import {
  addStudentNote, downloadCSV, getRankedStudents, type RankedStudent,
} from "@/lib/dataStore";

const riskBadge = {
  Low:    "bg-success/10 text-success",
  Medium: "bg-warning/10 text-warning",
  High:   "bg-danger/10 text-danger",
} as const;

export default function AdvisorRiskReview() {
  const { user } = useAuth();
  const ranked = useStoreSelector(getRankedStudents);

  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState<string>("all");
  const [selected, setSelected] = useState<RankedStudent | null>(null);
  const [note, setNote] = useState("");

  const filtered = ranked.filter((r) => {
    const matchesSearch = [r.user.name, r.user.id, r.record.program].some((v) =>
      v.toLowerCase().includes(search.toLowerCase()),
    );
    const matchesRisk = riskFilter === "all" || r.level === riskFilter;
    return matchesSearch && matchesRisk;
  });

  const handleExport = () => {
    const rows = filtered.map((r) => ({
      id: r.user.id, name: r.user.name, risk: r.level, score: r.score,
      attendance: r.attendance, gpa: r.record.gpa,
    }));
    downloadCSV("risk-review.csv", rows);
    toast.success("Exported risk review CSV");
  };

  const saveNote = () => {
    if (!selected || !user) return;
    if (!note.trim()) { toast.error("Note cannot be empty"); return; }
    addStudentNote(selected.user.id, { id: user.id, name: user.name }, note.trim());
    toast.success(`Counseling note saved for ${selected.user.name}`);
    setSelected(null);
    setNote("");
  };

  return (
    <AppLayout
      title="Risk Review"
      subtitle="Review at-risk students and schedule interventions"
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search students…"
    >
      <Card className="p-5 bg-gradient-card border-border/60 shadow-soft">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-semibold text-foreground">Students requiring review</h3>
            <p className="text-xs text-muted-foreground">Filter and act on flagged students</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All risks</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={handleExport} disabled={!filtered.length}>
              <Download className="h-4 w-4 mr-1.5" /> Export CSV
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto -mx-5 px-5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Risk</TableHead>
                <TableHead className="text-right">Score</TableHead>
                <TableHead className="text-right hidden md:table-cell">Attendance</TableHead>
                <TableHead className="text-right hidden md:table-cell">GPA</TableHead>
                <TableHead className="text-right hidden md:table-cell">Notes</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-secondary text-xs">{r.user.avatar}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{r.user.name}</p>
                        <p className="text-xs text-muted-foreground">{r.user.id}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("border-0", riskBadge[r.level])}>{r.level}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold">{r.score}</TableCell>
                  <TableCell className="text-right hidden md:table-cell">{r.attendance}%</TableCell>
                  <TableCell className="text-right hidden md:table-cell">{r.record.gpa.toFixed(2)}</TableCell>
                  <TableCell className="text-right hidden md:table-cell">{r.record.notes.length}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="h-7 text-xs"
                      onClick={() => { setSelected(r); setNote(""); }}>
                      <MessageSquare className="h-3 w-3 mr-1" /> Counsel
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">
                    No students match your filters
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Counseling note · {selected?.user.name}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="rounded-lg bg-secondary/60 p-3">
                  <p className="text-xs text-muted-foreground">Risk</p>
                  <p className="font-semibold">{selected.level}</p>
                </div>
                <div className="rounded-lg bg-secondary/60 p-3">
                  <p className="text-xs text-muted-foreground">Attendance</p>
                  <p className="font-semibold">{selected.attendance}%</p>
                </div>
                <div className="rounded-lg bg-secondary/60 p-3">
                  <p className="text-xs text-muted-foreground">GPA</p>
                  <p className="font-semibold">{selected.record.gpa.toFixed(2)}</p>
                </div>
              </div>

              {selected.record.notes.length > 0 && (
                <div className="rounded-lg border border-border bg-card p-3 max-h-32 overflow-auto">
                  <p className="text-xs font-semibold mb-1.5">Previous notes</p>
                  <ul className="space-y-1.5">
                    {selected.record.notes.map((n) => (
                      <li key={n.id} className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">{n.advisorName}</span> · {n.date} — {n.text}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="note">Add note</Label>
                <Textarea id="note" rows={4} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Discussion summary, action items…" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
            <Button onClick={saveNote} className="bg-gradient-primary text-primary-foreground">Save note</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
