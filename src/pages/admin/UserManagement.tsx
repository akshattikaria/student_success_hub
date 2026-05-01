import { useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatCard } from "@/components/StatCard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Users, GraduationCap, HeartHandshake, ShieldCheck, Download, Power, UserPlus } from "lucide-react";
import { roleLabel, type Role } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useStoreSelector } from "@/lib/useStore";
import { addUser, downloadCSV, getUsers, setUserStatus } from "@/lib/dataStore";

const roleStyle: Record<Role, string> = {
  student: "bg-info/10 text-info",
  teacher: "bg-primary/10 text-primary",
  advisor: "bg-warning/10 text-warning",
  admin:   "bg-accent/10 text-accent",
};

export default function UserManagement() {
  const users = useStoreSelector(getUsers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const filtered = useMemo(() => users.filter((u) => {
    const matchesSearch = [u.name, u.email, u.id].some((v) => v.toLowerCase().includes(search.toLowerCase()));
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  }), [users, search, roleFilter]);

  const counts = {
    student: users.filter((u) => u.role === "student").length,
    teacher: users.filter((u) => u.role === "teacher").length,
    advisor: users.filter((u) => u.role === "advisor").length,
    admin:   users.filter((u) => u.role === "admin").length,
  };

  const toggleStatus = (id: string, current: "active" | "inactive") => {
    setUserStatus(id, current === "active" ? "inactive" : "active");
    toast.success("User status updated");
  };

  const handleExport = () => {
    downloadCSV("users.csv", filtered);
    toast.success("User list exported");
  };

  // Create user form state
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<{ name: string; email: string; role: Role; password: string }>({
    name: "", email: "", role: "student", password: "demo1234",
  });

  const submitCreate = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const u = addUser({
        name: form.name,
        email: form.email,
        role: form.role,
        password: form.password || undefined,
      });
      toast.success(`Created ${roleLabel(u.role)} ${u.name}`);
      setForm({ name: "", email: "", role: "student", password: "demo1234" });
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create user");
    }
  };

  return (
    <AppLayout
      title="User Management"
      subtitle="Manage all university accounts"
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search users…"
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Students" value={counts.student} icon={GraduationCap} accent="info" />
        <StatCard label="Teachers" value={counts.teacher} icon={Users}         accent="primary" />
        <StatCard label="Advisors" value={counts.advisor} icon={HeartHandshake} accent="warning" />
        <StatCard label="Admins"   value={counts.admin}   icon={ShieldCheck}    accent="danger" />
      </div>

      <Card className="mt-6 p-5 bg-gradient-card border-border/60 shadow-soft">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-semibold text-foreground">Directory ({filtered.length})</h3>
            <p className="text-xs text-muted-foreground">All registered users</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="teacher">Teacher</SelectItem>
                <SelectItem value="advisor">Advisor</SelectItem>
                <SelectItem value="admin">Admin / HOD</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={handleExport} disabled={!filtered.length}>
              <Download className="h-4 w-4 mr-1.5" /> Export CSV
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-gradient-primary text-primary-foreground">
                  <UserPlus className="h-4 w-4 mr-1.5" /> Create user
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create new user</DialogTitle>
                  <DialogDescription>
                    The user can sign in immediately with the email and password below.
                    Students also get an initial academic record.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={submitCreate} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="cu-name">Full name</Label>
                    <Input id="cu-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Jane Doe" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="cu-email">Email</Label>
                    <Input id="cu-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="jane.doe@university.edu" required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Role</Label>
                      <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as Role })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="teacher">Teacher</SelectItem>
                          <SelectItem value="advisor">Advisor</SelectItem>
                          <SelectItem value="admin">Admin / HOD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="cu-pass">Password</Label>
                      <Input id="cu-pass" type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="demo1234" minLength={6} required />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button type="submit" className="bg-gradient-primary text-primary-foreground">Create user</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="overflow-x-auto -mx-5 px-5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="hidden md:table-cell">Status</TableHead>
                <TableHead className="hidden md:table-cell">Joined</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-secondary text-xs">{u.avatar}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{u.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("border-0", roleStyle[u.role])}>{roleLabel(u.role)}</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant="secondary" className={cn(
                      "capitalize",
                      u.status === "active" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                    )}>
                      {u.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {new Date(u.joined).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => toggleStatus(u.id, u.status)}>
                      <Power className="h-3 w-3 mr-1" />
                      {u.status === "active" ? "Deactivate" : "Activate"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">
                    No users match your filters
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </AppLayout>
  );
}
