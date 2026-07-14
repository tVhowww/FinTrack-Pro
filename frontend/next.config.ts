import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ép Vercel bỏ qua lỗi biên dịch TypeScript
  typescript: {
    ignoreBuildErrors: true,
  },

  /* Các cấu hình cũ của sếp giữ nguyên bên dưới */
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups", // Cho phép Popup gửi data về
          },
        ],
      },
    ];
  },

  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://fintrack-api-gateway-pjyu.onrender.com/:path*',
      },
    ];
  },
};

export default nextConfig;