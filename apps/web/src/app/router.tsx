import { Navigate, Route, Routes } from "react-router-dom";
import { MarketingLayout } from "@/layouts/MarketingLayout";
import { StudentLayout } from "@/layouts/StudentLayout";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { HomePage } from "@/pages/public/HomePage";
import { CoursesPage } from "@/pages/public/CoursesPage";
import { LoginPage } from "@/pages/public/LoginPage";
import { RegisterPage } from "@/pages/public/RegisterPage";
import { VerifyEmailPage } from "@/pages/public/VerifyEmailPage";
import { ForgotPasswordPage } from "@/pages/public/ForgotPasswordPage";
import { ResetPasswordPage } from "@/pages/public/ResetPasswordPage";
import { SetPasswordPage } from "@/pages/public/SetPasswordPage";
import { StudentDashboardPage } from "@/pages/student/StudentDashboardPage";
import { AdminDashboardPage } from "@/pages/admin/AdminDashboardPage";
import { AdminSettingsPage, AdminUsersPage } from "@/pages/admin/AdminSettingsPage";
import { TeacherDashboardPage } from "@/pages/teacher/TeacherDashboardPage";
import { RequireAuth, RequireStudentVerified } from "@/features/auth/guards";

export function AppRouter() {
  return (
    <Routes>
      <Route element={<MarketingLayout />}>
        <Route index element={<HomePage />} />
        <Route path="courses" element={<CoursesPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="verify-email" element={<VerifyEmailPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="reset-password" element={<ResetPasswordPage />} />
        <Route path="set-password" element={<SetPasswordPage />} />
      </Route>

      <Route element={<RequireStudentVerified />}>
        <Route path="student" element={<StudentLayout />}>
          <Route index element={<StudentDashboardPage />} />
        </Route>
      </Route>

      <Route element={<RequireAuth roles={["ADMIN"]} />}>
        <Route
          path="admin"
          element={
            <DashboardLayout
              portal="admin"
              title="Admin"
              nav={[
                { to: "/admin", label: "Dashboard", end: true },
                { to: "/admin/users", label: "Users" },
                { to: "/admin/settings", label: "Settings" },
                { to: "/admin/students", label: "Students" },
                { to: "/admin/courses", label: "Courses" },
                { to: "/admin/batches", label: "Batches" },
                { to: "/admin/orders", label: "Orders" },
              ]}
            />
          }
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
          <Route path="*" element={<Placeholder title="Admin module (Phase 2+)" />} />
        </Route>
      </Route>

      <Route element={<RequireAuth roles={["TEACHER"]} />}>
        <Route
          path="teacher"
          element={
            <DashboardLayout
              portal="teacher"
              title="Teacher"
              nav={[
                { to: "/teacher", label: "My Batches", end: true },
                { to: "/teacher/profile", label: "Profile" },
              ]}
            />
          }
        >
          <Route index element={<TeacherDashboardPage />} />
          <Route path="*" element={<Placeholder title="Teacher module (Phase 5)" />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function Placeholder({ title }: { title: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface-elevated p-6">
      <h1 className="font-display text-xl font-semibold">{title}</h1>
      <p className="mt-2 text-ink-muted">Coming in a later phase.</p>
    </div>
  );
}
