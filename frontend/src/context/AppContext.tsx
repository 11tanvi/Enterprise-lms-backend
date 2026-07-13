import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import enrollmentService from "../services/enrollmentService";

// 1. Define what a Toast notification looks like
export interface ToastState {
  message: string;
  type: "success" | "error" | "info";
}

interface AppContextProps {
  wizardCourseId: number | null;
  wizardStep: number;

  // TOAST NOTIFICATION ACTIONS
  toast: ToastState | null;
  showToast: (message: string, type: "success" | "error" | "info") => void;
  hideToast: () => void;

  setWizardStep: (step: number) => void;
  setWizardCourseId: (id: number | null) => void;
  showSmartTagsToast: boolean;
  setShowSmartTagsToast: (show: boolean) => void;

  // SIDEBAR COLLAPSIBLE & MOBILE DRAWER STATE
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: (open: boolean) => void;

  // USER AUTH & ENROLLMENT ROLE-BASED ACCESS
  userRole: "admin" | "teacher" | "student" | null;
  currentUser: {
    id: number;
    fullName: string;
    email: string;
    role: "admin" | "teacher" | "student";
    profilePicture?: string;
  } | null;
  enrolledCourseIds: number[];
  isEnrollmentsLoading: boolean;
  login: (
    userData:
      | "admin"
      | "teacher"
      | "student"
      | {
          id: number;
          fullName: string;
          email: string;
          role: "admin" | "teacher" | "student";
          profilePicture?: string;
        },
  ) => void;
  logout: () => void;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const isMockMode = import.meta.env.VITE_USE_MOCK_API !== "false";

  // 2. Setup the state for our Toast
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error" | "info") => {
    setToast({ message, type });
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  const [wizardCourseId, setWizardCourseId] = useState<number | null>(() => {
    const saved = localStorage.getItem("educorp_wizard_id");
    return saved ? parseInt(saved, 10) : null;
  });

  const [wizardStep, _setWizardStep] = useState<number>(() => {
    const saved = localStorage.getItem("educorp_wizard_step");
    return saved ? parseInt(saved, 10) : 1;
  });

  const [showSmartTagsToast, setShowSmartTagsToast] = useState<boolean>(false);

  // Sidebar collapsible & mobile overlay states
  const [sidebarCollapsed, setSidebarCollapsedState] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("educorp_sidebar_collapsed");
      return saved === "true";
    }
    return false;
  });

  const setSidebarCollapsed = useCallback((collapsed: boolean) => {
    setSidebarCollapsedState(collapsed);
    localStorage.setItem("educorp_sidebar_collapsed", String(collapsed));
  }, []);

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  // Auth & Enrollment States
  const [currentUser, setCurrentUser] = useState<{
    id: number;
    fullName: string;
    email: string;
    role: "admin" | "teacher" | "student";
    profilePicture?: string;
  } | null>(() => {
    const saved = localStorage.getItem("educorp_user_profile");
    if (saved && !localStorage.getItem("token")) {
      try {
        const parsed = JSON.parse(saved);
        localStorage.setItem("token", parsed.token || `mock-token-${parsed.role || "student"}`);
      } catch (e) {}
    }
    return saved ? JSON.parse(saved) : null;
  });

  const [userRole, setUserRole] = useState<"admin" | "teacher" | "student" | null>(() => {
    const saved = localStorage.getItem("educorp_user_role");
    return saved === "admin" || saved === "teacher" || saved === "student" ? saved : null;
  });

  const queryClient = useQueryClient();

  // NOTE: Do NOT use `initialData: []` here. QueryProvider sets a global
  // staleTime of 60s, and providing static initialData stamps the query's
  // dataUpdatedAt as "now" - React Query then treats it as fresh and skips
  // the refetch-on-mount, so right after login this rendered an empty
  // enrollment list (and showed "Enroll" instead of "Continue Learning")
  // for up to a minute. Defaulting via destructuring instead avoids the
  // undefined flash without suppressing the mount-time fetch.
  const { data: enrollments = [], isLoading: isEnrollmentsLoading } = useQuery({
    queryKey: ["myEnrollments", currentUser?.id],
    queryFn: () => enrollmentService.getMyEnrollments(),
    enabled: !!currentUser && userRole === "student",
  });

  const enrolledCourseIds = useMemo(() => {
    if (userRole === "admin") {
      return [];
    }
    return enrollments.map((e) => e.courseId);
  }, [userRole, enrollments]);


  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("educorp_user_profile", JSON.stringify(currentUser));
      setUserRole(currentUser.role);
    } else {
      localStorage.removeItem("educorp_user_profile");
      setUserRole(null);
    }
  }, [currentUser]);

  useEffect(() => {
    if (userRole) {
      localStorage.setItem("educorp_user_role", userRole);
    } else {
      localStorage.removeItem("educorp_user_role");
    }
  }, [userRole]);

  const login = useCallback((
    userData:
      | "admin"
      | "teacher"
      | "student"
      | {
          id: number;
          fullName: string;
          email: string;
          role: "admin" | "teacher" | "student";
          profilePicture?: string;
        },
  ) => {
    if (typeof userData === "string") {
      const mockProfile = {
        id: userData === "admin" ? 1 : userData === "teacher" ? 3 : 2,
        fullName:
          userData === "admin"
            ? "Alex Rivera"
            : userData === "teacher"
              ? "Teacher User"
              : "Student Learner",
        email:
          userData === "admin"
            ? "admin@educorp.com"
            : userData === "teacher"
              ? "teacher@educorp.com"
              : "student@educorp.com",
        role: userData,
      };

      localStorage.setItem("token", `mock-token-${userData}`);
      setCurrentUser(mockProfile);
      setUserRole(userData);
      showToast(
        `Logged in as ${
          userData === "admin"
            ? "Administrator"
            : userData === "teacher"
              ? "Teacher"
              : "Student"
        } successfully.`,
        "success",
      );
    } else {
      setCurrentUser(userData);
      setUserRole(userData.role);
      if ((userData as any).token) {
        localStorage.setItem("token", (userData as any).token);
      } else {
        localStorage.setItem("token", `mock-token-${userData.role}`);
      }
      const roleName =
        userData.role === "admin"
          ? "Administrator"
          : userData.role === "teacher"
            ? "Teacher"
            : "Student";
      showToast(
        `Welcome back, ${userData.fullName}! Logged in as ${roleName} successfully.`,
        "success",
      );
    }

    queryClient.invalidateQueries({ queryKey: ["myEnrollments"] });
  }, [showToast, queryClient]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    setUserRole(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    // Drop any cached enrollment data so a different account logging in next
    // never has a chance to render a previous user's stale enrollment state.
    queryClient.removeQueries({ queryKey: ["myEnrollments"] });
    showToast("Signed out successfully.", "info");
  }, [showToast, queryClient]);

  useEffect(() => {
    if (wizardCourseId !== null) {
      localStorage.setItem("educorp_wizard_id", wizardCourseId.toString());
    } else {
      localStorage.removeItem("educorp_wizard_id");
    }
  }, [wizardCourseId]);

  const setWizardStep = useCallback((step: number) => {
    _setWizardStep(step);
    localStorage.setItem("educorp_wizard_step", step.toString());
  }, []);

  const contextValue = useMemo(() => ({
        wizardCourseId,
        wizardStep,
        toast,
        showToast,
        hideToast,
        setWizardStep,
        setWizardCourseId,
        showSmartTagsToast,
        setShowSmartTagsToast,
        sidebarCollapsed,
        setSidebarCollapsed,
        mobileSidebarOpen,
        setMobileSidebarOpen,
        userRole,
        currentUser,
        enrolledCourseIds,
        isEnrollmentsLoading,
        login,
        logout,
  }), [
        wizardCourseId,
        wizardStep,
        toast,
        showToast,
        hideToast,
        setWizardStep,
        setWizardCourseId,
        showSmartTagsToast,
        setShowSmartTagsToast,
        sidebarCollapsed,
        setSidebarCollapsed,
        mobileSidebarOpen,
        setMobileSidebarOpen,
        userRole,
        currentUser,
        enrolledCourseIds,
        isEnrollmentsLoading,
        login,
        logout,
  ]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
