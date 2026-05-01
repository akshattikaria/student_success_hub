import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShieldX, ArrowLeft } from "lucide-react";
import { useAuth, ROLE_HOME } from "@/lib/auth";

export default function Unauthorized() {
  const { user } = useAuth();
  const home = user ? ROLE_HOME[user.role] : "/";

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-secondary/40 to-background">
      <div className="text-center max-w-md animate-fade-in">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-danger/10 mb-6">
          <ShieldX className="h-10 w-10 text-danger" />
        </div>
        <h1 className="text-3xl font-bold">Access denied</h1>
        <p className="text-muted-foreground mt-2">
          You don't have permission to view this page. Your role only grants access to specific sections.
        </p>
        <Button asChild className="mt-6 bg-gradient-primary text-primary-foreground">
          <Link to={home}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to my dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
