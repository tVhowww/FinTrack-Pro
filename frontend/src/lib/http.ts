import axios from "axios";
import Cookies from "js-cookie";

const http = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor: Tự động gắn Token vào Header nếu có
http.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("accessToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response Interceptor: Xử lý khi Token hết hạn (Lỗi 401)
http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Nếu lỗi là 401 và chưa từng thử refresh trước đó (tránh vòng lặp vô tận)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Đánh dấu là đã thử refresh

      try {
        // Lấy access token hiện tại
        const currentToken = localStorage.getItem("accessToken");

        if (!currentToken) {
          throw new Error("No token to refresh");
        }

        // Gọi API Refresh Token (Lưu ý: Dùng axios gốc để tránh lặp interceptor)
        const response = await axios.post(
          "http://localhost:8888/identity/auth/refresh",
          {
            token: currentToken,
          },
        );

        // Lấy token mới từ response
        const { token: newAccessToken } = response.data.result;

        // Lưu lại token mới vào LocalStorage và Cookie
        localStorage.setItem("accessToken", newAccessToken);
        Cookies.set("accessToken", newAccessToken, { expires: 1 / 24 }); // 1 giờ

        // Gắn token mới vào header của request cũ
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        // Gọi lại request ban đầu với token mới
        return http(originalRequest);
      } catch (refreshError) {
        // Nếu refresh cũng thất bại (VD: Refresh token hết hạn nốt)
        // -> Xóa sạch dữ liệu và đá về Login
        localStorage.removeItem("accessToken");
        Cookies.remove("accessToken");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default http;
