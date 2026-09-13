import { Navigate, Route, Routes } from "react-router-dom";
import { MarketingLayout } from "@/layouts/MarketingLayout";
import { StudentLayout } from "@/layouts/StudentLayout";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { HomePage } from "@/pages/public/HomePage";
import { CoursesPage } from "@/pages/public/CoursesPage";
import { CourseDetailPage } from "@/pages/public/CourseDetailPage";
import { CheckoutResultPage } from "@/pages/public/CheckoutResultPage";
import { LoginPage } from "@/pages/public/LoginPage";
import { RegisterPage } from "@/pages/public/RegisterPage";
import { VerifyEmailPage } from "@/pages/public/VerifyEmailPage";
import { ForgotPasswordPage } from "@/pages/public/ForgotPasswordPage";
import { ResetPasswordPage } from "@/pages/public/ResetPasswordPage";
import { SetPasswordPage } from "@/pages/public/SetPasswordPage";
import { StudentDashboardPage } from "@/pages/student/StudentDashboardPage";
import { StudentCoursesPage } from "@/pages/student/StudentCoursesPage";
import {
  StudentCourseHubPage,
  StudentCourseOverview,
} from "@/pages/student/StudentCourseHubPage";
import { StudentSessionsPage } from "@/pages/student/StudentSessionsPage";
import { StudentMaterialsPage } from "@/pages/student/StudentMaterialsPage";
import { StudentAnnouncementsPage } from "@/pages/student/StudentAnnouncementsPage";
import { StudentOrdersPage } from "@/pages/student/StudentOrdersPage";
import { StudentProfilePage } from "@/pages/student/StudentProfilePage";
import { AdminDashboardPage } from "@/pages/admin/AdminDashboardPage";
import { AdminSettingsPage } from "@/pages/admin/AdminSettingsPage";
import { AdminUsersPage } from "@/pages/admin/AdminUsersPage";
import { AdminCoursesPage } from "@/pages/admin/AdminCoursesPage";
import { AdminCourseBatchesPage } from "@/pages/admin/AdminCourseBatchesPage";
import { AdminBatchesPage } from "@/pages/admin/AdminBatchesPage";
import { AdminOrdersPage } from "@/pages/admin/AdminOrdersPage";
import { TeacherDashboardPage } from "@/pages/teacher/TeacherDashboardPage";
import {
  TeacherBatchHubPage,
  TeacherBatchOverview,
} from "@/pages/teacher/TeacherBatchHubPage";
import { TeacherSessionsPage } from "@/pages/teacher/TeacherSessionsPage";
import { TeacherMaterialsPage } from "@/pages/teacher/TeacherMaterialsPage";
import { TeacherAnnouncementsPage } from "@/pages/teacher/TeacherAnnouncementsPage";
import { TeacherProfilePage } from "@/pages/teacher/TeacherProfilePage";
import { RequireAuth, RequireStudentVerified } from "@/features/auth/guards";

export function AppRouter() {
  return (
    <Routes>
      <Route element={<MarketingLayout />}>
        <Route index element={<HomePage />} />
        <Route path="courses" element={<CoursesPage />} />
        <Route path="courses/:slug" element={<CourseDetailPage />} />
        <Route
          path="checkout/success"
          element={<CheckoutResultPage kind="success" />}
        />
        <Route path="checkout/fail" element={<CheckoutResultPage kind="fail" />} />
        <Route
          path="checkout/cancel"
          element={<CheckoutResultPage kind="cancel" />}
        />
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
          <Route path="courses" element={<StudentCoursesPage />} />
          <Route path="courses/:slug" element={<StudentCourseHubPage />}>
            <Route index element={<StudentCourseOverview />} />
            <Route path="sessions" element={<StudentSessionsPage />} />
            <Route path="materials" element={<StudentMaterialsPage />} />
            <Route path="announcements" element={<StudentAnnouncementsPage />} />
          </Route>
          <Route path="orders" element={<StudentOrdersPage />} />
          <Route path="profile" element={<StudentProfilePage />} />
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
                { to: "/admin/courses", label: "Courses" },
                { to: "/admin/batches", label: "Batches" },
                { to: "/admin/orders", label: "Orders" },
                { to: "/admin/settings", label: "Settings" },
              ]}
            />
          }
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
          <Route path="courses" element={<AdminCoursesPage />} />
          <Route path="courses/:courseId" element={<AdminCourseBatchesPage />} />
          <Route path="batches" element={<AdminBatchesPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="*" element={<Placeholder title="Coming in a later phase" />} />
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
          <Route path="batches/:id" element={<TeacherBatchHubPage />}>
            <Route index element={<TeacherBatchOverview />} />
            <Route path="sessions" element={<TeacherSessionsPage />} />
            <Route path="materials" element={<TeacherMaterialsPage />} />
            <Route path="announcements" element={<TeacherAnnouncementsPage />} />
          </Route>
          <Route path="profile" element={<TeacherProfilePage />} />
          <Route path="*" element={<Placeholder title="Coming in a later phase" />} />
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
      <p className="mt-2 text-ink-muted">Route reserved for an upcoming phase.</p>
    </div>
  );
}
