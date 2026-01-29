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

// 3. Log out
export interface LogoutRequest {
  token: string;
}
