// 1. Cập nhật UserResponse (Thêm avatar, phone, city)
export interface UserResponse {
  id: string;
  username: string;
  email: string;
  fullName: string;
  dob: string;
  phoneNumber?: string;
  city?: string;
  avatar?: string;
}

// 2. Request Update Profile
export interface ProfileUpdateRequest {
  fullName?: string;
  dob?: string;
  phoneNumber?: string;
  city?: string;
}

// 3. Request Change Password
export interface PasswordChangeRequest {
  oldPassword: string;
  newPassword: string;
}

// 4. Request Upload Avatar không cần interface vì dùng FormData
