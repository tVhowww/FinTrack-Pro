// Định dạng chung cho mọi response từ Backend (Wrapper)
export interface ApiResponse<T> {
  code: number;
  message?: string;
  result: T;
}

// 1. Login
export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  authenticated: boolean;
}

// 2. Register (Khớp với UserCreationRequest bên Java)
export interface RegisterRequest {
  username: string;
  password: string;
  email: string;
  fullName?: string;
  dob?: string; // Định dạng YYYY-MM-DD
}

// User Info sau khi tạo xong
export interface UserResponse {
  id: string;
  username: string;
  email: string;
  fullName: string;
  dob: string;
}