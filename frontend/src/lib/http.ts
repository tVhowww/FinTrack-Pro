import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import Cookies from "js-cookie";

const http = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// --- CƠ CHẾ KHÓA (LOCKING) ---
// Biến cờ để kiểm soát: Có đang refresh không?
let isRefreshing = false;
// Hàng đợi chứa các request bị lỗi 401 đang chờ token mới
let failedQueue: any[] = [];

// Hàm xử lý hàng đợi: Duyệt qua các request đang chờ và trả về kết quả
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// 1. Interceptor Request: Tự động gắn Token
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
  (error) => Promise.reject(error)
);

// 2. Interceptor Response: Xử lý Lỗi 401 & Refresh Token (Có hàng đợi)
http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Nếu lỗi không phải 401 thì reject luôn
    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // Nếu request này đã từng thử refresh rồi mà vẫn lỗi -> Logout luôn (tránh lặp vô tận)
    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    // --- LOGIC HÀNG ĐỢI ---
    
    // Nếu đang có một tiến trình refresh chạy rồi -> Request này phải XẾP HÀNG CHỜ
    if (isRefreshing) {
      return new Promise(function (resolve, reject) {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          // Khi hàng đợi được giải phóng, lấy token mới gắn vào và chạy lại
          if (originalRequest.headers) {
             originalRequest.headers.Authorization = "Bearer " + token;
          }
          return http(originalRequest);
        })
        .catch((err) => {
          return Promise.reject(err);
        });
    }

    // Nếu chưa ai refresh -> Request này nhận trách nhiệm đi Refresh
    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // Gọi API Refresh (Dùng axios gốc để tránh lặp interceptor)
      const currentToken = localStorage.getItem("accessToken");
      const { data } = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/identity/auth/refresh`,
        { token: currentToken }
      );

      const newAccessToken = data.result.token;

      // 1. Lưu token mới
      localStorage.setItem("accessToken", newAccessToken);
      Cookies.set("accessToken", newAccessToken); 

      // 2. Cập nhật default header cho các request sau này
      http.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`;

      // 3. Xử lý hàng đợi: Báo cho các request đang chờ biết là có token mới rồi
      processQueue(null, newAccessToken);

      // 4. Gọi lại chính request này
      if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      }
      return http(originalRequest);

    } catch (refreshError) {
      // Nếu refresh thất bại (Hết hạn thật sự hoặc lỗi mạng)
      // Báo lỗi cho toàn bộ hàng đợi
      processQueue(refreshError, null);
      
      // Xóa dữ liệu và logout
      localStorage.removeItem("accessToken");
      Cookies.remove("accessToken");
      if (typeof window !== "undefined") {
         window.location.href = "/login";
      }
      return Promise.reject(refreshError);
    } finally {
      // Dù thành công hay thất bại cũng phải mở khóa cho lần sau
      isRefreshing = false;
    }
  }
);

export default http;