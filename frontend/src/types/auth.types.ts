export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'employee';
  isActive: boolean;
  phone?: string;
}
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}