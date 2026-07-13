import { useMemo } from "react";
import { useApp } from "../../../context/AppContext";
import { Assignment, Submission } from "../types";
import { useAuthenticatedQuery } from "../api/useAuthenticatedQuery";
import { assignmentService } from "../api/assignmentService";

export const useStudentAssignments = () => {
  const { enrolledCourseIds = [] } = useApp();

  // Load assignments via authenticated query
  const {
    data: allAssignments,
    isLoading: isAssignmentsLoading,
    error: assignmentsError,
    refetch: refetchAssignments,
  } = useAuthenticatedQuery<Assignment[]>(
    () => assignmentService.getStudentAssignments(),
    []
  );

  // Load submissions via authenticated query
  const {
    data: allSubmissions,
    isLoading: isSubmissionsLoading,
    error: submissionsError,
    refetch: refetchSubmissions,
  } = useAuthenticatedQuery<Submission[]>(
    () => assignmentService.getStudentSubmissions(),
    []
  );

  const assignments = useMemo(() => {
    if (!allAssignments) return [];
    return allAssignments.filter((a) => a.status !== "Draft");
  }, [allAssignments]);

  const submissions = allSubmissions || [];
  const isLoading = isAssignmentsLoading || isSubmissionsLoading;
  const isError = !!assignmentsError || !!submissionsError;

  const refreshAssignments = async () => {
    await Promise.all([refetchAssignments(), refetchSubmissions()]);
  };

  return {
    assignments,
    submissions,
    isLoading,
    isError,
    refreshAssignments,
  };
};
