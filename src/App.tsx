import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, ROLE_HOME, useAuth } from "@/lib/auth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import HodDashboard from "./pages/HodDashboard";
import Login from "./pages/Login";
import StudentDashboard from "./pages/StudentDashboard";
import RiskScore from "./pages/RiskScore";
import AlertsPage from "./pages/Alerts";
import Suggestions from "./pages/Suggestions";
import TeacherDashboard from "./pages/TeacherDashboard";
import AtRiskStudents from "./pages/teacher/AtRiskStudents";
import AdvisorRiskReview from "./pages/advisor/RiskReview";
import Counseling from "./pages/advisor/Counseling";
import Interventions from "./pages/advisor/Interventions";
import AdminDashboard from "./pages/admin/AdminDashboard";
import DepartmentReport from "./pages/admin/DepartmentReport";
import UserManagement from "./pages/admin/UserManagement";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function RoleHomeRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  return <Navigate to={ROLE_HOME[user.role]} replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Student */}
            <Route path="/student" element={
              <ProtectedRoute roles={["student"]}><StudentDashboard /></ProtectedRoute>
            } />
            <Route path="/student/risk" element={
              <ProtectedRoute roles={["student"]}><RiskScore /></ProtectedRoute>
            } />
            <Route path="/student/alerts" element={
              <ProtectedRoute roles={["student"]}><AlertsPage /></ProtectedRoute>
            } />
            <Route path="/student/suggestions" element={
              <ProtectedRoute roles={["student"]}><Suggestions /></ProtectedRoute>
            } />

            {/* Teacher */}
            <Route path="/teacher" element={
              <ProtectedRoute roles={["teacher"]}><TeacherDashboard /></ProtectedRoute>
            } />
            <Route path="/teacher/at-risk" element={
              <ProtectedRoute roles={["teacher"]}><AtRiskStudents /></ProtectedRoute>
            } />

            {/* Advisor */}
            <Route path="/advisor" element={
              <ProtectedRoute roles={["advisor"]}><AdvisorRiskReview /></ProtectedRoute>
            } />
            <Route path="/advisor/counseling" element={
              <ProtectedRoute roles={["advisor"]}><Counseling /></ProtectedRoute>
            } />
            <Route path="/advisor/interventions" element={
              <ProtectedRoute roles={["advisor"]}><Interventions /></ProtectedRoute>
            } />
            <Route path="/hod/dashboard" element={
              <ProtectedRoute roles={["hod", "admin"]}><HodDashboard /></ProtectedRoute>
            } />
            {/* Admin */}
            <Route path="/admin" element={
              <ProtectedRoute roles={["admin"]}><AdminDashboard /></ProtectedRoute>
            } />
            <Route path="/admin/report" element={
              <ProtectedRoute roles={["admin"]}><DepartmentReport /></ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute roles={["admin"]}><UserManagement /></ProtectedRoute>
            } />

            {/* Role-aware redirects */}
            <Route path="/dashboard"   element={<RoleHomeRedirect />} />
            <Route path="/risk"        element={<RoleHomeRedirect />} />
            <Route path="/alerts"      element={<Navigate to="/student/alerts" replace />} />
            <Route path="/suggestions" element={<Navigate to="/student/suggestions" replace />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
