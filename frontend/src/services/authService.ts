import apiClient from "../lib/apiClient";

export interface User {
  id: number;
  fullName: string;
  email: string;
  role: "admin" | "teacher" | "student";
  token?: string;
}

export interface AuthResponse extends User {
  token: string;
}

export const authService = {
  /**
   * Log in a user with email and password
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>("/auth/login", {
      email,
      password,
    });
    return response.data;
  },

  /**
   * Register a new user with fullName, email, password, and optionally role
   */
  async register(
    fullName: string,
    email: string,
    password: string,
    role?: string,
  ): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>("/auth/register", {
      fullName,
      email,
      password,
      role,
    });
    return response.data;
  },
};

export default authService;

