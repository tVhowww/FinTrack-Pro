import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Danh sách các trang Public (chưa đăng nhập cũng xem được)
// Lưu ý: Login và Register là public, nhưng nếu đã login rồi thì không cho vào nữa
const authPaths = ["/login", "/register", "/forgot-password"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Read the HttpOnly cookie set by the backend (CookieUtils.COOKIE_NAME = "access_token")
  const token = request.cookies.get("access_token")?.value;

  // 2. Kiểm tra logic chặn đường:

  // TRƯỜNG HỢP A: Đã có Token nhưng cố tình vào trang Login/Register
  // -> Đá về trang chủ (Dashboard)
  if (authPaths.some((path) => pathname.startsWith(path)) && token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // TRƯỜNG HỢP B: Chưa có Token nhưng cố tình vào trang nội bộ (Dashboard, Wallet...)
  // Logic: Nếu không phải trang Auth (và không phải file tĩnh) -> Đá về Login
  if (!authPaths.some((path) => pathname.startsWith(path)) && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 3. Hợp lệ -> Cho đi tiếp
  return NextResponse.next();
}

// Cấu hình phạm vi hoạt động (Matcher)
export const config = {
  matcher: [
    // Áp dụng cho mọi đường dẫn, TRỪ các file tĩnh (ảnh, font, css...)
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
