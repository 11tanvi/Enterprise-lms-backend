import apiClient from "../../../lib/apiClient";
import { Batch, BatchStudent } from "../types/batch";

/**
 * Batch Management API Service
 * Wraps endpoint calls for REST methods located under Spring Boot's `/batches` Controller.
 */
export const batchService = {
  /**
   * Fetch all batches (typically admin/teacher access)
   */
  async getAll(): Promise<Batch[]> {
    const response = await apiClient.get<Batch[]>("/batches");
    return response.data;
  },

  /**
   * Fetch batches owned by the authenticated teacher / user
   */
  async getMyBatches(): Promise<Batch[]> {
    const response = await apiClient.get<Batch[]>("/batches/my");
    return response.data;
  },

  /**
   * Fetch batches belonging to the currently authenticated student
   */
  async getStudentBatches(): Promise<Batch[]> {
    const response = await apiClient.get<Batch[]>("/batches/student/me");
    return response.data;
  },

  /**
   * Fetch details of a specific batch belonging to the authenticated student
   */
  async getStudentBatch(batchId: string | number): Promise<Batch> {
    const response = await apiClient.get<Batch>(`/batches/student/me/${batchId}`);
    return response.data;
  },

  /**
   * Fetch a batch by ID
   */
  async getById(id: string | number): Promise<Batch> {
    const response = await apiClient.get<Batch>(`/batches/${id}`);
    return response.data;
  },

  /**
   * Fetch batches belonging to a specific course
   */
  async getByCourseId(courseId: string | number): Promise<Batch[]> {
    const response = await apiClient.get<Batch[]>(`/batches/course/${courseId}`);
    return response.data;
  },

  /**
   * Create a new batch
   */
  async create(data: Partial<Batch>): Promise<Batch> {
    const response = await apiClient.post<Batch>("/batches", data);
    return response.data;
  },

  /**
   * Update an existing batch details
   */
  async update(id: string | number, data: Partial<Batch>): Promise<Batch> {
    const response = await apiClient.put<Batch>(`/batches/${id}`, data);
    return response.data;
  },

  /**
   * Delete a batch
   */
  async delete(id: string | number): Promise<void> {
    await apiClient.delete(`/batches/${id}`);
  },

  /**
   * Add a student to a batch
   */
  async addStudent(batchId: string | number, studentId: string | number): Promise<BatchStudent> {
    const response = await apiClient.post<BatchStudent>(`/batches/${batchId}/students/${studentId}`);
    return response.data;
  },

  /**
   * Remove a student from a batch
   */
  async removeStudent(batchId: string | number, studentId: string | number): Promise<void> {
    await apiClient.delete(`/batches/${batchId}/students/${studentId}`);
  },

  /**
   * Fetch students enrolled in a specific batch
   */
  async getStudents(batchId: string | number): Promise<any[]> {
    const response = await apiClient.get<any[]>(`/batches/${batchId}/students`);
    return response.data;
  },

  /**
   * Fetch users filtered by role (e.g. STUDENT)
   */
  async getStudentsByRole(role: string = "STUDENT"): Promise<any[]> {
    const response = await apiClient.get<any[]>("/users", {
      params: { role },
    });
    return response.data;
  }
};

export default batchService;
