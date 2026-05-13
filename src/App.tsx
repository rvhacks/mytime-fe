import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useThemeStore } from '@/store/themeStore';
import { useAuthStore } from '@/store/authStore';
import { AppLayout } from '@/components/layout/AppLayout';

// Auth pages
import LoginPage from '@/pages/auth/LoginPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';
import OTPVerificationPage from '@/pages/auth/OTPVerificationPage';
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage';

// App pages
import Dashboard from '@/pages/Dashboard';
import Timesheet from '@/pages/Timesheet';
import Reports from '@/pages/Reports';
import MyProjects from '@/pages/MyProjects';
import ProjectDetail from '@/pages/ProjectDetail';
import ProjectTeam from '@/pages/ProjectTeam';
import Approvals from '@/pages/Approvals';
import Profile from '@/pages/Profile';

// Management pages (admin)
import Designations from '@/pages/management/Designations';
import Employees from '@/pages/management/Employees';
import ManageProjects from '@/pages/management/Projects';
import Assignments from '@/pages/management/Assignments';
import Milestones from '@/pages/management/Milestones';

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function ThemeInitializer() {
  const { theme } = useThemeStore();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeInitializer />
      <Routes>
        {/* Public Auth Routes */}
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
        <Route path="/verify-otp" element={<PublicRoute><OTPVerificationPage /></PublicRoute>} />
        <Route path="/reset-password" element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />

        {/* Protected App Routes */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route
            path="/timesheet"
            element={
              <ProtectedRoute allowedRoles={['employee', 'admin']}>
                <Timesheet />
              </ProtectedRoute>
            }
          />
          <Route path="/reports" element={<Reports />} />
          <Route path="/projects" element={<MyProjects />} />
          <Route path="/projects/:projectId" element={<ProjectDetail />} />
          <Route path="/projects/:projectId/team" element={<ProjectTeam />} />
          <Route
            path="/approvals"
            element={
              <ProtectedRoute>
                <Approvals />
              </ProtectedRoute>
            }
          />
          <Route path="/profile" element={<Profile />} />

          {/* Management Routes — Admin Only */}
          <Route
            path="/management/designations"
            element={<ProtectedRoute allowedRoles={['admin']}><Designations /></ProtectedRoute>}
          />
          <Route
            path="/management/employees"
            element={<ProtectedRoute allowedRoles={['admin']}><Employees /></ProtectedRoute>}
          />
          <Route
            path="/management/projects"
            element={<ProtectedRoute allowedRoles={['admin']}><ManageProjects /></ProtectedRoute>}
          />
          <Route
            path="/management/assignments"
            element={<ProtectedRoute allowedRoles={['admin']}><Assignments /></ProtectedRoute>}
          />
          <Route
            path="/management/milestones"
            element={<ProtectedRoute allowedRoles={['admin']}><Milestones /></ProtectedRoute>}
          />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
