import { z } from "zod";

// Schema Đăng nhập
export const LoginSchema = z.object({
  username: z.string().min(1, "Vui lòng nhập tên đăng nhập"),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
});

// Schema Đăng ký
export const RegisterSchema = z
  .object({
    username: z.string().min(4, "Username tối thiểu 4 ký tự"), // Khớp Backend @Size(min=4)
    email: z.string().email("Email không hợp lệ"),
    fullName: z.string().optional(),
    dob: z.string().optional(), // Frontend nhận string date từ input
    password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"), // Khớp Backend @Size(min=6)
    confirmPassword: z.string().min(6, "Vui lòng xác nhận mật khẩu"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

export type LoginBody = z.infer<typeof LoginSchema>;
export type RegisterBody = z.infer<typeof RegisterSchema>;
