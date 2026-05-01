import React, { useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatCard } from "@/components/StatCard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Users, TrendingUp, CalendarCheck, AlertTriangle, ArrowRight } from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { cn } from "@/lib/utils";
import { useStoreSelector } from "@/lib/useStore";
import {
  getClassSummary, getRankedStudents, getScoreDistribution,
} from "@/lib/dataStore";
import { StudentDataUpdater } from "@/components/StudentDataUpdater";
import { InterventionManager } from "@/components/InterventionManager";
import { CounselingManager } from "@/components/CounselingManager";
const riskBadge = {
  Low:    "bg-success/10 text-success",
  Medium: "bg-warning/10 text-warning",
  High:   "bg-danger/10 text-danger",
} as const;

const tooltipStyle = {
  contentStyle: { background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "0.5rem", fontSize: "12px" },
};

export default function TeacherDashboard() {
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const summary = useStoreSelector(getClassSummary);
  const distribution = useStoreSelector(getScoreDistribution);
  const ranked = useStoreSelector(getRankedStudents);

  const filteredAll = ranked.filter((r) =>
    [r.user.name, r.user.id].some((v) => v.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <AppLayout
      title="Teacher Dashboard"
      subtitle={summary.className}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search students…"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Students"        value={summary.totalStudents} icon={Users}         accent="primary" />
        <StatCard label="Class Average"   value={`${summary.average}%`} icon={TrendingUp}    accent="success" />
        <StatCard label="Avg Attendance"  value={`${summary.attendanceAvg}%`} icon={CalendarCheck} accent="info" />
        <StatCard label="At-Risk Students" value={summary.atRisk} icon={AlertTriangle} accent="danger"
          hint={summary.totalStudents ? `${Math.round(summary.atRisk / summary.totalStudents * 100)}% of class` : "—"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
        <Card className="p-5 bg-gradient-card border-border/60 shadow-soft">
          <h3 className="font-semibold text-foreground">Score distribution</h3>
          <p className="text-xs text-muted-foreground mb-4">Number of students per score range</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distribution} margin={{ left: -10, right: 10, top: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="range" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="students" radius={[6, 6, 0, 0]} fill="hsl(var(--accent))" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5 bg-gradient-card border-border/60 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-foreground">All students</h3>
              <p className="text-xs text-muted-foreground">Risk level by student</p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/teacher/at-risk">At-risk view <ArrowRight className="h-3 w-3 ml-1" /></Link>
            </Button>
          </div>
          <div className="h-72 overflow-auto pr-1">
           <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                  <TableHead className="text-center">Actions</TableHead> {/* New Header */}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAll.map((r) => (
                  <React.Fragment key={r.user.id}>
                    <TableRow>
                      <TableCell className="text-sm">{r.user.name}</TableCell>
                      <TableCell>
                        <Badge className={cn("border-0", riskBadge[r.level])}>{r.level}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">{Math.round(r.avgMarks)}%</TableCell>
                      <TableCell className="text-center">
                        {/* New Action Button */}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setExpandedId(expandedId === r.user.id ? null : r.user.id)}
                        >
                          {expandedId === r.user.id ? "Close" : "Update"}
                        </Button>
                      </TableCell>
                    </TableRow>
                    
                    {/* New Expandable Updater Row */}
                    {expandedId === r.user.id && (
                      <TableRow>
                        <TableCell colSpan={4} className="p-0 border-b">
                          <div className="bg-muted/30 p-4">
                            <StudentDataUpdater 
                              studentId={r.user.id} 
                              onUpdateSuccess={() => {
                                setExpandedId(null);
                                // Optional: If your dataStore doesn't auto-poll, force a page reload to see new risk scores
                                window.location.reload(); 
                              }} 
                            />
                            <InterventionManager studentId={r.user.id} />

                            <CounselingManager studentId={r.user.id} />
                            
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
                {filteredAll.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-6">
                    {ranked.length === 0 ? "No students yet" : `No students match "${search}"`}
                  </TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
