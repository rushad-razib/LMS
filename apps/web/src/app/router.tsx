import { Navigate, Route, Routes } from "react-router-dom";
import { MarketingLayout } from "@/layouts/MarketingLayout";
import { StudentLayout } from "@/layouts/StudentLayout";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { HomePage } from "@/pages/public/HomePage";
import { CoursesPage } from "@/pages/public/CoursesPage";
import { LoginPage } from "@/pages/public/LoginPage";
import { RegisterPage } from "@/pages/public/RegisterPage";
import { StudentDashboardPage } from "@/pages/student/StudentDashboardPage";
import { AdminDashboardPage } from "@/pages/admin/AdminDashboardPage";
import { TeacherDashboardPage } from "@/pages/teacher/TeacherDashboardPage";

export function AppRouter() {
  return (
    <Routes>
      <Route element={<MarketingLayout />}>
        <Route index element={<HomePage />} />
        <Route path="courses" element={<CoursesPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
      </Route>

      <Route path="student" element={<StudentLayout />}>
        <Route index element={<StudentDashboardPage />} />
      </Route>

      <Route
        path="admin"
        element={
          <DashboardLayout
            portal="admin"
            title="Admin"
            nav={[
              { to: "/admin", label: "Dashboard", end: true },
              { to: "/admin/students", label: "Students" },
              { to: "/admin/courses", label: "Courses" },
              { to: "/admin/batches", label: "Batches" },
              { to: "/admin/orders", label: "Orders" },
              { to: "/admin/settings", label: "Settings" },
            ]}
          />
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="*" element={<Placeholder title="Admin module (Phase 2+)" />} />
      </Route>

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

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function Placeholder({ title }: { title: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface-elevated p-6">
      <h1 className="font-display text-xl font-semibold">{title}</h1>
      <p className="mt-2 text-ink-muted">Route stub for Phase 0.</p>
    </div>
  );
}
