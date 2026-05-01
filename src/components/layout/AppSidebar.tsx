import {
  LayoutDashboard, AlertTriangle, Bell, Lightbulb, Users, GraduationCap, LogOut,
  ClipboardList, HeartHandshake, BarChart3, UserCog,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Role, useAuth, roleLabel } from "@/lib/auth";
import { toast } from "sonner";

type NavItem = { title: string; url: string; icon: typeof LayoutDashboard };

const NAV_BY_ROLE: Record<Role, { label: string; items: NavItem[] }> = {
  student: {
    label: "Student",
    items: [
      { title: "Dashboard", url: "/student", icon: LayoutDashboard },
      { title: "Risk Score", url: "/student/risk", icon: AlertTriangle },
      { title: "Alerts", url: "/student/alerts", icon: Bell },
      { title: "Suggestions", url: "/student/suggestions", icon: Lightbulb },
    ],
  },
  teacher: {
    label: "Teacher",
    items: [
      { title: "Dashboard", url: "/teacher", icon: LayoutDashboard },
      { title: "At-Risk Students", url: "/teacher/at-risk", icon: AlertTriangle },
    ],
  },
  advisor: {
    label: "Advisor",
    items: [
      { title: "Risk Review", url: "/advisor", icon: AlertTriangle },
      { title: "Counseling", url: "/advisor/counseling", icon: HeartHandshake },
      { title: "Interventions", url: "/advisor/interventions", icon: ClipboardList },
    ],
  },
  admin: {
    label: "Admin / HOD",
    items: [
      { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
      { title: "Department Report", url: "/admin/report", icon: BarChart3 },
      { title: "User Management", url: "/admin/users", icon: UserCog },
    ],
  },
  hod: {
    label: "Head of Department",
    items: [
      { title: "Department Overview", url: "/hod/dashboard", icon: LayoutDashboard },
    ],
  },
};

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  if (!user) return null;
  const nav = NAV_BY_ROLE[user.role];

  const handleLogout = () => {
    logout();
    toast.success("Signed out");
    navigate("/", { replace: true });
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-base ${
      isActive
        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
        : "text-sidebar-foreground hover:bg-sidebar-accent/60"
    }`;

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-sidebar-foreground">EduAnalytics</span>
              <span className="text-xs text-muted-foreground">{roleLabel(user.role)} portal</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{nav.label}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {nav.items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={linkClass} end>
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} className="text-sidebar-foreground">
              <LogOut className="h-4 w-4" />
              {!collapsed && <span>Sign out</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
