import { AppLayout } from "@/components/layout/AppLayout";
import { StatCard } from "@/components/StatCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  LineChart, Line, Legend,
} from "recharts";
import { Users, GraduationCap, BookOpen, AlertTriangle, Download } from "lucide-react";
import { toast } from "sonner";
import { useStoreSelector } from "@/lib/useStore";
import { downloadCSV, getDepartmentSummary, getRankedStudents } from "@/lib/dataStore";

const tooltipStyle = {
  contentStyle: { background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "0.5rem", fontSize: "12px" },
};

const SEMESTER_TREND = [
  { sem: "S1 '23", gpa: 3.05, pass: 87 },
  { sem: "S2 '23", gpa: 3.12, pass: 88 },
  { sem: "S1 '24", gpa: 3.18, pass: 90 },
  { sem: "S2 '24", gpa: 3.21, pass: 91 },
];

export default function DepartmentReport() {
  const summary = useStoreSelector(getDepartmentSummary);
  const ranked = useStoreSelector(getRankedStudents);

  // Group students by year for the program/year breakdown
  const byYear = ["Year 1", "Year 2", "Year 3"].map((year) => {
    const ys = ranked.filter((r) => r.record.year === year);
    const avg = ys.length ? Math.round(ys.reduce((s, r) => s + r.avgMarks, 0) / ys.length) : 0;
    return {
      program: year,
      students: ys.length,
      avg,
      atRisk: ys.filter((r) => r.level !== "Low").length,
    };
  });

  const handleExport = () => {
    downloadCSV("department-report.csv", byYear);
    toast.success("Department report exported");
  };

  return (
    <AppLayout title="Department Report" subtitle={summary.name}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Students"     value={summary.totalStudents} icon={Users}         accent="primary" />
        <StatCard label="Faculty"      value={summary.totalFaculty}  icon={GraduationCap} accent="info" />
        <StatCard label="Courses"      value={summary.totalCourses}  icon={BookOpen}      accent="success" />
        <StatCard label="At-Risk Rate" value={`${summary.atRiskRate}%`} icon={AlertTriangle} accent="danger" hint={`Pass rate ${summary.passRate}%`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
        <Card className="p-5 bg-gradient-card border-border/60 shadow-soft">
          <h3 className="font-semibold text-foreground">Performance by year</h3>
          <p className="text-xs text-muted-foreground mb-4">Average score and at-risk count per cohort</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byYear} margin={{ left: -10, right: 10, top: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="program" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip {...tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="avg" radius={[6, 6, 0, 0]} fill="hsl(var(--primary))" name="Avg score" />
                <Bar dataKey="atRisk" radius={[6, 6, 0, 0]} fill="hsl(var(--danger))" name="At risk" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5 bg-gradient-card border-border/60 shadow-soft">
          <h3 className="font-semibold text-foreground">Semester trend</h3>
          <p className="text-xs text-muted-foreground mb-4">Department GPA & pass rate</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={SEMESTER_TREND} margin={{ left: -10, right: 10, top: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="sem" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis yAxisId="l" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} domain={[2.8, 3.4]} />
                <YAxis yAxisId="r" orientation="right" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} domain={[80, 100]} />
                <Tooltip {...tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line yAxisId="l" type="monotone" dataKey="gpa" stroke="hsl(var(--primary))" strokeWidth={2.5} name="Avg GPA" />
                <Line yAxisId="r" type="monotone" dataKey="pass" stroke="hsl(var(--success))" strokeWidth={2.5} name="Pass %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="mt-6 p-5 bg-gradient-card border-border/60 shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-foreground">Cohort breakdown</h3>
            <p className="text-xs text-muted-foreground">Detailed metrics per year group</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1.5" /> Export CSV
          </Button>
        </div>
        <div className="overflow-x-auto -mx-5 px-5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cohort</TableHead>
                <TableHead className="text-right">Students</TableHead>
                <TableHead className="text-right">Avg Score</TableHead>
                <TableHead className="text-right">At-Risk</TableHead>
                <TableHead className="text-right hidden md:table-cell">% At-Risk</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {byYear.map((p) => (
                <TableRow key={p.program}>
                  <TableCell className="font-medium">{p.program}</TableCell>
                  <TableCell className="text-right">{p.students}</TableCell>
                  <TableCell className="text-right">{p.avg}%</TableCell>
                  <TableCell className="text-right">{p.atRisk}</TableCell>
                  <TableCell className="text-right hidden md:table-cell">
                    {p.students ? Math.round((p.atRisk / p.students) * 100) : 0}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </AppLayout>
  );
}
