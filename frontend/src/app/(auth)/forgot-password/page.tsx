"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, KeyRound, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";

import {
  ForgotPasswordBody,
  ForgotPasswordSchema,
  ResetPasswordBody,
  ResetPasswordSchema,
} from "@/lib/schemas";
import { authService } from "@/services/auth.service";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

type Step = "EMAIL" | "OTP" | "SUCCESS";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("EMAIL");
  const [savedEmail, setSavedEmail] = useState("");
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // ==========================================
  // FORM 1: NHẬP EMAIL
  // ==========================================
  const emailForm = useForm<ForgotPasswordBody>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const forgotMutation = useMutation({
    mutationFn: (email: string) => authService.forgotPassword(email),
    onSuccess: (_, variables) => {
      setSavedEmail(variables); // Lưu lại email để truyền sang bước 2
      setStep("OTP");
      setCountdown(60);
      toast.success("Mã OTP đã được gửi đến email của bạn!");
    },
    onError: (error: any) => {
      if (error?.response?.status === 429) {
        toast.error(
          "Bạn thao tác quá nhanh. Vui lòng đợi một lát rồi thử lại!",
        );
        // Có thể ép đếm ngược tiếp nếu muốn, nhưng Backend đã chặn rồi nên toast là đủ
      } else {
        const msg =
          error?.response?.data?.message ||
          "Không thể gửi OTP. Vui lòng thử lại.";
        toast.error(msg);
      }
    },
  });

  // ==========================================
  // FORM 2: NHẬP OTP & PASSWORD MỚI
  // ==========================================
  const resetForm = useForm<ResetPasswordBody>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: { otp: "", newPassword: "", confirmPassword: "" },
  });

  const resetMutation = useMutation({
    mutationFn: (data: ResetPasswordBody) =>
      authService.resetPassword({
        email: savedEmail,
        otp: data.otp,
        newPassword: data.newPassword,
      }),
    onSuccess: () => {
      setStep("SUCCESS");
    },
    onError: (error: any) => {
      const msg =
        error?.response?.data?.message ||
        "Mã OTP không hợp lệ hoặc đã hết hạn.";
      toast.error(msg);
    },
  });

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/30 p-4">
      <Card className="w-full max-w-md shadow-lg">
        {/* ========================================== */}
        {/* STEP 1: NHẬP EMAIL */}
        {/* ========================================== */}
        {step === "EMAIL" && (
          <>
            <CardHeader className="space-y-1 items-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                <KeyRound className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-2xl font-bold text-center">
                Quên mật khẩu?
              </CardTitle>
              <CardDescription className="text-center">
                Nhập email của bạn để nhận mã xác nhận đặt lại mật khẩu.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...emailForm}>
                <form
                  onSubmit={emailForm.handleSubmit((data) =>
                    forgotMutation.mutate(data.email),
                  )}
                  className="space-y-4"
                >
                  <FormField
                    control={emailForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email đã đăng ký</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="nguyenvana@gmail.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    className="w-full"
                    type="submit"
                    disabled={forgotMutation.isPending || countdown > 0}
                  >
                    {forgotMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Mail className="mr-2 h-4 w-4" />
                    )}
                    {countdown > 0
                      ? `Vui lòng đợi ${countdown}s`
                      : "Gửi mã xác nhận"}
                  </Button>
                </form>
              </Form>
            </CardContent>
            <CardFooter className="justify-center">
              <Link
                href="/login"
                className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Quay lại đăng nhập
              </Link>
            </CardFooter>
          </>
        )}

        {/* ========================================== */}
        {/* STEP 2: XÁC NHẬN OTP & ĐẶT PASS MỚI */}
        {/* ========================================== */}
        {step === "OTP" && (
          <>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center">
                Đặt lại mật khẩu
              </CardTitle>
              <CardDescription className="text-center">
                Mã xác nhận gồm 6 chữ số đã được gửi tới <br />
                <span className="font-semibold text-foreground">
                  {savedEmail}
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...resetForm}>
                <form
                  onSubmit={resetForm.handleSubmit((data) =>
                    resetMutation.mutate(data),
                  )}
                  className="space-y-4"
                >
                  <FormField
                    control={resetForm.control}
                    name="otp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mã xác nhận (OTP)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Nhập 6 số..."
                            maxLength={6}
                            className="text-center tracking-widest text-lg font-bold"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={resetForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mật khẩu mới</FormLabel>
                        <FormControl>
                          <PasswordInput placeholder="••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={resetForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Xác nhận mật khẩu mới</FormLabel>
                        <FormControl>
                          <PasswordInput placeholder="••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    className="w-full"
                    type="submit"
                    disabled={resetMutation.isPending}
                  >
                    {resetMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Lưu mật khẩu mới
                  </Button>
                </form>
              </Form>

              <div className="mt-6 text-center text-sm text-muted-foreground">
                Chưa nhận được mã?{" "}
                <button
                  type="button"
                  onClick={() => forgotMutation.mutate(savedEmail)}
                  disabled={countdown > 0 || forgotMutation.isPending}
                  className="font-medium text-primary hover:underline disabled:text-muted-foreground disabled:no-underline disabled:cursor-not-allowed"
                >
                  {countdown > 0 ? `Gửi lại sau ${countdown}s` : "Gửi lại mã"}
                </button>
              </div>
            </CardContent>
            <CardFooter className="justify-center">
              <button
                type="button"
                onClick={() => {
                  setStep("EMAIL");
                  setCountdown(0);
                }}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Nhập lại email khác
              </button>
            </CardFooter>
          </>
        )}

        {/* ========================================== */}
        {/* STEP 3: THÀNH CÔNG */}
        {/* ========================================== */}
        {step === "SUCCESS" && (
          <div className="py-8 px-6 flex flex-col items-center text-center space-y-6">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-500" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold">Thành công!</h3>
              <p className="text-muted-foreground">
                Mật khẩu của bạn đã được cập nhật. Bạn có thể sử dụng mật khẩu
                mới để đăng nhập.
              </p>
            </div>
            <Link href="/login" className="w-full">
              <Button className="w-full">Tiếp tục đăng nhập</Button>
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
}
