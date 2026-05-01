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
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { Download, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useStoreSelector } from "@/lib/useStore";
import {
  downloadCSV, getRankedStudents, type RankedStudent,
} from "@/lib/dataStore";

const riskBadge = {
  Low:    "bg-success/10 text-success",
  Medium: "bg-warning/10 text-warning",
  High:   "bg-danger/10 text-danger",
} as const;

export default function AtRiskStudents() {
  const ranked = useStoreSelector(getRankedStudents);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState<"all" | "High" | "Medium">("all");
  const [selected, setSelected] = useState<RankedStudent | null>(null);

  const atRisk = ranked.filter((r) => r.level !== "Low");
  const filtered = atRisk
    .filter((r) => riskFilter === "all" || r.level === riskFilter)
    .filter((r) => [r.user.name, r.user.id].some((v) => v.toLowerCase().includes(search.toLowerCase())));

  const handleExport = () => {
    const rows = filtered.map((r) => ({
      id: r.user.id, name: r.user.name, risk: r.level, score: r.score,
      attendance: r.attendance, gpa: r.record.gpa,
    }));
    downloadCSV("at-risk-students.csv", rows);
    toast.success("Exported at-risk students");
  };

  return (
    <AppLayout
      title="At-Risk Students"
      subtitle={`${atRisk.length} students currently flagged`}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search students…"
    >
      <Card className="p-5 bg-gradient-card border-border/60 shadow-soft">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 text-foreground">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <h3 className="font-semibold">Flagged students</h3>
          </div>
          <div className="flex items-center gap-2">
            <Select value={riskFilter} onValueChange={(v) => setRiskFilter(v as typeof riskFilter)}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All risks</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
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
                  <TableCell><Badge className={cn("border-0", riskBadge[r.level])}>{r.level}</Badge></TableCell>
                  <TableCell className="text-right font-semibold">{r.score}</TableCell>
                  <TableCell className="text-right hidden md:table-cell">{r.attendance}%</TableCell>
                  <TableCell className="text-right hidden md:table-cell">{r.record.gpa.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setSelected(r)}>
                      View details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                    {atRisk.length === 0 ? "No at-risk students" : `No students match "${search}"`}
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
            <DialogTitle>{selected?.user.name} — risk breakdown</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
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
              <div>
                <p className="text-xs font-semibold text-foreground mb-2">Subjects below 65%</p>
                <ul className="space-y-1.5 text-sm">
                  {selected.record.subjects.filter((s) => s.marks < 65).map((s) => (
                    <li key={s.short} className="flex justify-between text-muted-foreground">
                      <span>{s.subject}</span>
                      <span className="text-danger font-medium">{s.marks}%</span>
                    </li>
                  ))}
                  {selected.record.subjects.filter((s) => s.marks < 65).length === 0 && (
                    <li className="text-muted-foreground">None — risk driven by attendance.</li>
                  )}
                </ul>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
