import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { AppProvider, useApp } from "./context/AppContext";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { CourseCatalogView } from "./modules/courses/components/CourseCatalogView";
import { CourseDetailView } from "./modules/courses/components/CourseDetailView";
import CategoryManagement from "./modules/courses/pages/CategoryManagement";
import { CourseWizardParent } from "./modules/courses/components/CourseWizard/CourseWizardParent";
import { TeacherDashboard } from "./modules/assignments/pages/teacher/TeacherDashboard";
import { CreateAssignmentWizard } from "./modules/assignments/pages/teacher/CreateAssignmentWizard";
import { ReportsAnalytics } from "./modules/assignments/pages/teacher/ReportsAnalytics";
import { StudentDashboard } from "./modules/assignments/pages/student/StudentDashboard";
import { CourseCatalogPage } from "./modules/courses/pages/CourseCatalogPage";
import { AssignmentAttempt } from "./modules/assignments/pages/student/AssignmentAttempt";
import { ResultPage } from "./modules/assignments/pages/student/ResultPage";
import { StudentCertificatePage } from "./modules/certificates/pages/StudentCertificatePage";
import { BatchDashboard } from "./modules/batches/pages/BatchDashboard";
import { BatchDetails } from "./modules/batches/pages/BatchDetails";
import { CreateBatchWizard } from "./modules/batches/pages/CreateBatchWizard";
import { StudentBatchDashboard } from "./modules/batches/pages/StudentBatchDashboard";
import { StudentBatchDetails } from "./modules/batches/pages/StudentBatchDetails";
import { Toast } from "./components/Toast";
import { Login } from "./pages/Login";
import { Forbidden } from "./pages/Forbidden";
import { ProtectedRoute } from "./components/ProtectedRoute";

// Authenticated Layout wrapper with the Sidebar and Header
const MainLayout: React.FC = () => {
  const { sidebarCollapsed, mobileSidebarOpen, setMobileSidebarOpen } =
    useApp();

  // Prevent background scrolling while the mobile sidebar is open
  React.useEffect(() => {
    if (mobileSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileSidebarOpen]);

  return (
    <div className="min-h-screen bg-gray-50/50 flex font-sans relative overflow-x-hidden">
      {/* Mobile Drawer Backdrop */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 md:hidden animate-fade-in"
        />
      )}

      {/* Sidebar - Fixed Left Rail */}
      <Sidebar />

      {/* Main Panel Content Frame */}
      <div
        className={`flex-1 min-w-0 min-h-screen flex flex-col transition-all duration-300 ${
          sidebarCollapsed ? "md:pl-[80px]" : "md:pl-[280px]"
        } pl-0`}
      >
        {/* Header - Sticky Top Bar */}
        <Header />

        {/* Primary Page Layout view with generous responsive spacing */}
        <main className="flex-grow p-4 sm:p-8 max-w-7xl w-full mx-auto relative transition-all duration-300">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const AppContent: React.FC = () => {
  // Pull toast and hideToast from the AppContext Brain!
  const { toast, hideToast } = useApp();

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Routes>
        {/* Anonymous Route */}
        <Route path="/login" element={<Login />} />
        <Route path="/403" element={<Forbidden />} />

        {/* Protected Dashboard Routes */}
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          {/* Base Redirection */}
          <Route path="/" element={<Navigate to="/courses" replace />} />

          {/* Catalog: Shared access for Admin & Student */}
          <Route path="/courses" element={<CourseCatalogView />} />

          {/* Detail: Shared access, contents are filtered by enrollment status inside the view */}
          <Route path="/course-detail/:id" element={<CourseDetailView />} />

          {/* Categories: Admin Only */}
          <Route
            path="/categories"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <CategoryManagement />
              </ProtectedRoute>
            }
          />

          {/* Admin Dashboard: Admin Only */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <CategoryManagement />
              </ProtectedRoute>
            }
          />

          {/* Assignments separated dashboards */}
          <Route
            path="/teacher/dashboard"
            element={
              <ProtectedRoute allowedRoles={["admin", "teacher"]}>
                <TeacherDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/teacher/reports"
            element={
              <ProtectedRoute allowedRoles={["admin", "teacher"]}>
                <ReportsAnalytics />
              </ProtectedRoute>
            }
          />

          <Route
            path="/teacher/edit-assignment/:id"
            element={
              <ProtectedRoute allowedRoles={["admin", "teacher"]}>
                <CreateAssignmentWizard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/create-assignment"
            element={
              <ProtectedRoute allowedRoles={["admin", "teacher"]}>
                <CreateAssignmentWizard />
              </ProtectedRoute>
            }
          />

          {/* Batches Management and Cohort Details */}
          <Route
            path="/teacher/batches"
            element={
              <ProtectedRoute allowedRoles={["admin", "teacher"]}>
                <BatchDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/teacher/batches/:id"
            element={
              <ProtectedRoute allowedRoles={["admin", "teacher"]}>
                <BatchDetails />
              </ProtectedRoute>
            }
          />

          <Route
            path="/teacher/batches/create"
            element={
              <ProtectedRoute allowedRoles={["admin", "teacher"]}>
                <CreateBatchWizard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/batches"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <StudentBatchDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/batches/:id"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <StudentBatchDetails />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/assignment/:id"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <AssignmentAttempt />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/result/:id"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <ResultPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/certificate/:submissionId"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <StudentCertificatePage />
              </ProtectedRoute>
            }
          />

          {/* Wizard Creation: Admin Only */}
          <Route
            path="/wizard"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <CourseWizardParent />
              </ProtectedRoute>
            }
          />

          {/* Wizard Edition: Admin Only */}
          <Route
            path="/wizard/:id"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <CourseWizardParent />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Fallback Catch-all Route */}
        <Route path="*" element={<Navigate to="/courses" replace />} />
      </Routes>

      {/* GLOBAL TOAST RENDERER */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AppProvider>
  );
}
