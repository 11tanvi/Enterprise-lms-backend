import React from "react";
import { Navigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ("admin" | "teacher" | "student")[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { showToast, userRole, currentUser } = useApp();
  
  // 1. Checks localStorage for the current user's JWT / token
  const token = localStorage.getItem("token");
  if (!token || !currentUser) {
    // If no JWT or currentUser exists, redirect to login
    return <Navigate to="/login" replace />;
  }

  // 2. Extract and validate user role from the single source of truth (AppContext)
  const resolvedRole = userRole;

  if (!resolvedRole) {
    // If role cannot be verified, send to login
    return <Navigate to="/login" replace />;
  }

  // 3. Check role boundaries against requested allowedRoles
  if (allowedRoles && !allowedRoles.includes(resolvedRole)) {
    // Show a warning toast
    setTimeout(() => {
      showToast("Access Denied: You do not have permission to view that page.", "error");
    }, 100);
    
    // Redirect to the 403 Forbidden page
    return <Navigate to="/403" replace />;
  }

  return <>{children}</>;
};

