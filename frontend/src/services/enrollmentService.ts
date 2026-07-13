import apiClient from "../lib/apiClient";

export interface EnrollmentResponse {
  id: number;
  studentId: number;
  studentName: string;
  studentEmail: string;
  courseId: number;
  courseTitle: string;
  courseSlug: string;
  status: "ACTIVE" | "COMPLETED" | "DROPPED";
  progressPercentage: number;
  enrolledAt: string;
  lastAccessedAt: string | null;
  completedAt: string | null;
}

const isMockMode = (): boolean => {
  return import.meta.env.VITE_USE_MOCK_API !== "false";
};

// Local storage helper for enrollments
const getLocalEnrollments = (): EnrollmentResponse[] => {
  const saved = localStorage.getItem("educorp_enrollments");
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      return [];
    }
  }
  // Default enrollments
  const defaultEnrollments: EnrollmentResponse[] = [
    {
      id: 1,
      studentId: 2,
      studentName: "Student Learner",
      studentEmail: "student@educorp.com",
      courseId: 1,
      courseTitle: "Cybersecurity Essentials",
      courseSlug: "cybersecurity-essentials",
      status: "ACTIVE",
      progressPercentage: 45,
      enrolledAt: new Date().toISOString(),
      lastAccessedAt: null,
      completedAt: null,
    }
  ];
  localStorage.setItem("educorp_enrollments", JSON.stringify(defaultEnrollments));
  return defaultEnrollments;
};

const saveLocalEnrollment = (courseId: number): EnrollmentResponse => {
  const list = getLocalEnrollments();
  const existing = list.find((e) => e.courseId === courseId);
  if (existing) return existing;

  const newId = list.length > 0 ? Math.max(...list.map((e) => e.id)) + 1 : 1;
  const newEnrollment: EnrollmentResponse = {
    id: newId,
    studentId: 2,
    studentName: "Student Learner",
    studentEmail: "student@educorp.com",
    courseId,
    courseTitle:
      courseId === 1
        ? "Cybersecurity Essentials"
        : courseId === 2
          ? "Leadership Principles"
          : courseId === 3
            ? "GDPR & Data Privacy"
            : "Course " + courseId,
    courseSlug:
      courseId === 1
        ? "cybersecurity-essentials"
        : courseId === 2
          ? "leadership-principles"
          : courseId === 3
            ? "gdpr-data-privacy"
            : "course-" + courseId,
    status: "ACTIVE",
    progressPercentage: 0,
    enrolledAt: new Date().toISOString(),
    lastAccessedAt: null,
    completedAt: null,
  };
  list.push(newEnrollment);
  localStorage.setItem("educorp_enrollments", JSON.stringify(list));
  return newEnrollment;
};

export const enrollmentService = {
  /**
   * Enroll the currently authenticated student into a course.
   * POST /enrollments
   * @param {number} courseId - The ID of the course to enroll in
   * @returns {Promise<EnrollmentResponse>} The created enrollment details
   */
  async enroll(courseId: number): Promise<EnrollmentResponse> {
    if (isMockMode()) {
      return saveLocalEnrollment(courseId);
    }
    try {
      const response = await apiClient.post<EnrollmentResponse>("/enrollments", {
        courseId,
      });
      return response.data;
    } catch (error) {
      console.warn("[enrollmentService] Enroll failed, falling back to local storage:", error);
      return saveLocalEnrollment(courseId);
    }
  },

  /**
   * Return all enrollments of the currently authenticated student.
   * GET /enrollments/me
   * @returns {Promise<EnrollmentResponse[]>} List of student's enrollments
   */
  async getMyEnrollments(): Promise<EnrollmentResponse[]> {
    if (isMockMode()) {
      return getLocalEnrollments();
    }
    try {
      const response = await apiClient.get<EnrollmentResponse[]>("/enrollments/me");
      return response.data;
    } catch (error) {
      console.warn("[enrollmentService] Fetch enrollments failed, falling back to local storage:", error);
      return getLocalEnrollments();
    }
  },

  /**
   * Return the enrollment details of the authenticated student for a specific course.
   * GET /enrollments/{courseId}
   * @param {number} courseId - The ID of the course
   * @returns {Promise<EnrollmentResponse>} The enrollment details
   */
  async getEnrollmentByCourse(courseId: number): Promise<EnrollmentResponse> {
    if (isMockMode()) {
      const found = getLocalEnrollments().find((e) => e.courseId === courseId);
      if (!found) throw new Error("Enrollment not found");
      return found;
    }
    try {
      const response = await apiClient.get<EnrollmentResponse>(`/enrollments/${courseId}`);
      return response.data;
    } catch (error) {
      console.warn("[enrollmentService] Fetch enrollment by course failed, falling back to local storage:", error);
      const found = getLocalEnrollments().find((e) => e.courseId === courseId);
      if (!found) throw error;
      return found;
    }
  },

  /**
   * Get eligible students enrolled in the specified courses.
   * GET /enrollments/eligible-students
   * @param {number[]} courseIds - The list of course IDs
   * @returns {Promise<any[]>} List of eligible students
   */
  async getEligibleStudents(courseIds: number[]): Promise<any[]> {
    if (isMockMode()) {
      return [
        { id: 2, fullName: "Emma Watson", email: "student@educorp.com", courseIds: [1], courseTitles: ["AWS Certified Solutions Architect"] },
        { id: 4, fullName: "Alice Smith", email: "alice@educorp.com", courseIds: [1], courseTitles: ["Zero-Trust Network Security"] },
        { id: 5, fullName: "Bob Jones", email: "bob@educorp.com", courseIds: [1], courseTitles: ["Modern Java Backend"] },
        { id: 6, fullName: "Charlie Brown", email: "charlie@educorp.com", courseIds: [1], courseTitles: ["AWS Certified Solutions Architect"] },
        { id: 7, fullName: "Diana Prince", email: "diana@educorp.com", courseIds: [1], courseTitles: ["Google Cloud Platform Fundamentals"] },
        { id: 8, fullName: "Ethan Hunt", email: "ethan@educorp.com", courseIds: [1], courseTitles: ["Certified Ethical Hacker Prep"] },
        { id: 9, fullName: "Fiona Gallagher", email: "fiona@educorp.com", courseIds: [1], courseTitles: ["Modern Java Backend"] },
        { id: 10, fullName: "George Clark", email: "george@educorp.com", courseIds: [1], courseTitles: ["Zero-Trust Network Security"] },
        { id: 11, fullName: "Hannah Abbott", email: "hannah@educorp.com", courseIds: [1], courseTitles: ["Google Cloud Platform Fundamentals"] },
        { id: 12, fullName: "Ian Malcolm", email: "ian@educorp.com", courseIds: [1], courseTitles: ["Certified Ethical Hacker Prep"] }
      ];
    }
    const response = await apiClient.get<any[]>("/enrollments/eligible-students", {
      params: { courseIds: courseIds.join(",") }
    });
    return response.data;
  },
};

export default enrollmentService;
