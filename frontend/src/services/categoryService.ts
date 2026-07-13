import apiClient from "../lib/apiClient";
import { Category } from "../types";

/**
 * Category Administration Service
 * Communicates with Spring Boot's `/categories` REST endpoints for LMS Category Management.
 */
export const categoryService = {
  /**
   * Fetch all categories
   * GET /categories
   * @returns {Promise<Category[]>} List of Category objects
   */
  async getAll(): Promise<Category[]> {
    const response = await apiClient.get<Category[]>("/categories");
    return response.data;
  },

  /**
   * Retrieve a single category details by ID
   * GET /categories/{id}
   * @param {number} id - Category unique identifier
   * @returns {Promise<Category>} Category details object
   */
  async getById(id: number): Promise<Category> {
    const response = await apiClient.get<Category>(`/categories/${id}`);
    return response.data;
  },

  /**
   * Create a new category
   * POST /categories
   * @param {Partial<Category>} data - Category fields (name, icon, description, color)
   * @returns {Promise<Category>} The newly created Category record with its database-generated ID
   */
  async create(data: Partial<Category>): Promise<Category> {
    const response = await apiClient.post<Category>("/categories", data);
    return response.data;
  },

  /**
   * Update an existing category by ID
   * PUT /categories/{id}
   * @param {number} id - Category unique identifier
   * @param {Partial<Category>} data - Category fields to update
   * @returns {Promise<Category>} The updated Category record
   */
  async update(id: number, data: Partial<Category>): Promise<Category> {
    const response = await apiClient.put<Category>(`/categories/${id}`, data);
    return response.data;
  },

  /**
   * Delete / Soft delete a category by ID
   * DELETE /categories/{id}
   * @param {number} id - Category unique identifier
   * @returns {Promise<void>} Resolves when delete operation completes
   */
  async delete(id: number): Promise<void> {
    await apiClient.delete(`/categories/${id}`);
  },
};

export default categoryService;
