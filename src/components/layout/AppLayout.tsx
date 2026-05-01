import { ReactNode, useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth, roleLabel } from "@/lib/auth";

interface AppLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  /** When provided, the header search input updates this value */
  search?: string;
  onSearchChange?: (v: string) => void;
  searchPlaceholder?: string;
}

const roleBadgeStyle: Record<string, string> = {
  student: "bg-info/10 text-info border-0",
  teacher: "bg-primary/10 text-primary border-0",
  advisor: "bg-warning/10 text-warning border-0",
  admin:   "bg-accent/10 text-accent border-0",
};

export function AppLayout({
  children, title, subtitle, search, onSearchChange, searchPlaceholder,
}: AppLayoutProps) {
  const { user } = useAuth();
  const [internalSearch, setInternalSearch] = useState("");
  const searchValue = search !== undefined ? search : internalSearch;
  const handleSearch = onSearchChange ?? setInternalSearch;

  if (!user) return null;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 border-b border-border bg-card/60 backdrop-blur-sm sticky top-0 z-30">
            <div className="flex h-full items-center gap-3 px-4 md:px-6">
              <SidebarTrigger />
              <div className="hidden md:flex items-center gap-2 max-w-md flex-1">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchValue}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder={searchPlaceholder ?? "Search…"}
                    className="pl-9 bg-secondary/60 border-0 focus-visible:ring-1"
                  />
                </div>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-danger" />
                </Button>
                <div className="flex items-center gap-3 pl-2 border-l border-border">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs font-semibold">
                      {user.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:flex flex-col leading-tight">
                    <span className="text-sm font-medium">{user.name}</span>
                    <Badge className={roleBadgeStyle[user.role]}>
                      {roleLabel(user.role)}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 lg:p-8 animate-fade-in">
            <div className="mb-6">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">{title}</h1>
              {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
            </div>
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
