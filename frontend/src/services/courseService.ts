import apiClient from "../lib/apiClient";
import { Course } from "../types";

/**
 * Course Management Service
 * Communicates with Spring Boot's `/admin/courses` REST endpoints for LMS Admin Course Authoring.
 */
export const courseService = {
  /**
   * Fetch courses (all admin courses for admins, public active courses for students/guests)
   * @param {string} [role] - User role ("admin" or "student")
   * @returns {Promise<Course[]>} List of Courses
   */
  async getAll(role?: string | null): Promise<Course[]> {
    const endpoint = role === "admin" ? "/admin/courses" : "/courses/active";
    const response = await apiClient.get<Course[]>(endpoint);
    return response.data;
  },

  /**
   * Fetch a course by ID
   * GET /admin/courses/{id}
   * @param {string|number} id - Course ID
   * @returns {Promise<Course>} The course details
   */
  async getById(id: string | number): Promise<Course> {
    const response = await apiClient.get<Course>(`/admin/courses/${id}`);
    return response.data;
  },

  /**
   * Create a new course
   * POST /admin/courses
   * @param {Partial<Course>} data - Course definition fields
   * @returns {Promise<Course>} The newly created Course record from the backend
   */
  async create(data: Partial<Course>): Promise<Course> {
    const response = await apiClient.post<Course>("/admin/courses", data);
    return response.data;
  },

  /**
   * Update an existing course
   * PUT /admin/courses/{id}
   * @param {string|number} id - Course ID
   * @param {Partial<Course>} data - Course fields to update
   * @returns {Promise<Course>} The updated Course record
   */
  async update(id: string | number, data: Partial<Course>): Promise<Course> {
    const response = await apiClient.put<Course>(`/admin/courses/${id}`, data);
    return response.data;
  },

  /**
   * Delete a course by ID (supports optional hard delete)
   * DELETE /admin/courses/{id}
   * @param {string|number} id - Course ID
   * @param {boolean} [hard=false] - True to permanently delete, false to soft-delete/deactivate
   * @returns {Promise<void>} Resolves when delete operation completes
   */
  async delete(id: string | number, hard: boolean = false): Promise<void> {
    await apiClient.delete(`/admin/courses/${id}`, {
      params: { hard },
    });
  },
};

export default courseService;
