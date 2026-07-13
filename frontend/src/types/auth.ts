export type UserRole = "admin" | "teacher" | "student";

export interface User {
  id: number;
  fullName: string;
  email: string;
  role: UserRole;
  token?: string;
}

export interface AuthResponse extends User {
  token: string;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: "student";
}
