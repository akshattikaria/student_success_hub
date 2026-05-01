import { useState, FormEvent, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { GraduationCap, Mail, Lock, Loader2, GraduationCap as Cap, Briefcase, HeartHandshake, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Role, ROLE_OPTIONS, ROLE_HOME, useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const ROLE_ICONS: Record<Role, typeof Cap> = {
  student: Cap,
  teacher: Briefcase,
  advisor: HeartHandshake,
  admin: ShieldCheck,
  hod: Briefcase,
};

export default function Login() {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [role, setRole] = useState<Role>("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Pre-fill the email with the first active user of the chosen role
  useEffect(() => {
    if (user) navigate(ROLE_HOME[user.role], { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.includes("@") || password.length < 6) {
      toast.error("Please enter a valid email and a password of 6+ characters.");
      return;
    }
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.ok === false) {
      toast.error(result.error);
      return;
    }
    toast.success(`Welcome, ${result.user.name}`);
    navigate(ROLE_HOME[result.user.role], { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-secondary/40 to-background">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Brand panel */}
        <div className="hidden lg:block animate-fade-in">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
              <GraduationCap className="h-7 w-7 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-bold">EduAnalytics</h2>
              <p className="text-xs text-muted-foreground">University Learning Insights</p>
            </div>
          </div>
          <h1 className="text-4xl xl:text-5xl font-bold leading-tight tracking-tight">
            See learning <span className="bg-gradient-primary bg-clip-text text-transparent">clearly.</span><br />
            Act on it early.
          </h1>
          <p className="mt-4 text-muted-foreground text-lg max-w-md">
            Role-based dashboards for students, teachers, advisors and department heads.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-4 max-w-md">
            {[
              { value: "12k+", label: "Students" },
              { value: "94%", label: "Pass rate" },
              { value: "320+", label: "Courses" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-card border border-border p-4 shadow-soft">
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <Card className="p-6 md:p-8 shadow-elegant border-border/60 animate-scale-in">
          <div className="lg:hidden flex items-center gap-2 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-semibold">EduAnalytics</span>
          </div>
          <h2 className="text-2xl font-bold">Sign in</h2>
          <p className="text-sm text-muted-foreground mt-1">Choose a role to autofill a demo account, or sign in with any account on file.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label>Demo role</Label>
              <div className="grid grid-cols-2 gap-2">
                {ROLE_OPTIONS.map((opt) => {
                  const Icon = ROLE_ICONS[opt.value];
                  const active = role === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setRole(opt.value)}
                      className={cn(
                        "flex items-start gap-2 rounded-lg border p-3 text-left transition-base",
                        active
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-border hover:bg-secondary/60"
                      )}
                    >
                      <div className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-md shrink-0",
                        active ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                      )}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium leading-tight">{opt.label}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{opt.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9" placeholder="you@university.edu" required />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="password" type="password" value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9" placeholder="••••••••" required />
              </div>
            </div>
            <Button type="submit" disabled={loading}
              className="w-full bg-gradient-primary hover:opacity-90 shadow-glow text-primary-foreground">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Signing in…</> : "Sign in"}
            </Button>
            <p className="text-center text-xs text-muted-foreground pt-2">
              Demo mode · sign in with any account in the directory (6+ char password)
            </p>
          </form>
        </Card>
      </div>
    </div>
  );
}
