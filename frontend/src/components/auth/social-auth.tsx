"use client";

import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { authService } from "@/services/auth.service";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

export function SocialAuth() {
  const router = useRouter();

  const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID as string;

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      // 1. Lấy ID Token từ Google trả về
      const idToken = credentialResponse.credential;

      // 2. Ném xuống Backend của mình để kiểm tra và lấy Token nội bộ
      const data = await authService.loginGoogle(idToken);
      const token = data.result.token;

      // 3. Lưu JWT và chuyển hướng (Y hệt login thường)
      localStorage.setItem("accessToken", token);
      Cookies.set("accessToken", token, { expires: 1 / 24 });

      toast.success("Đăng nhập bằng Google thành công!");
      router.push("/");
    } catch (error: any) {
      console.error("Google Login Error:", error);
      toast.error("Lỗi xác thực từ máy chủ!");
    }
  };

  return (
    <div className="w-full">
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Hoặc tiếp tục với
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-4 w-full">
        {/* Nút Google */}
        <div className="w-full flex justify-center [&>div]:w-full">
          <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => {
                toast.error("Đăng nhập Google thất bại!");
              }}
              size="large"
              width="100%"
              text="continue_with"
            />
          </GoogleOAuthProvider>
        </div>

        {/* Nút Facebook tạm khóa */}
        <Button
          variant="outline"
          type="button"
          className="w-full h-[40px]"
          disabled
        >
          <Icons.facebook
            className="mr-2 h-4 w-4 text-blue-600"
            fill="currentColor"
          />
          Facebook (Bảo trì)
        </Button>
      </div>
    </div>
  );
}
