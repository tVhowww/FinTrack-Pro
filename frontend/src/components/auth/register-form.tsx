"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import { RegisterBody, RegisterSchema } from "@/lib/schemas";
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
import { SocialAuth } from "./social-auth";

export function RegisterForm() {
  const router = useRouter();
  const form = useForm<RegisterBody>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      username: "",
      email: "",
      fullName: "",
      dob: "",
      password: "",
      confirmPassword: "",
    },
  });

  const mutation = useMutation({
    mutationFn: authService.register,
    onSuccess: () => {
      toast.success("Tạo tài khoản thành công! Hãy đăng nhập.");
      router.push("/login");
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || "Đăng ký thất bại";
      toast.error(`Lỗi: ${msg}`);
    },
  });

  const onSubmit = (values: RegisterBody) => {
    const { confirmPassword, ...requestData } = values;
    const payload = { ...requestData, dob: requestData.dob || undefined };
    mutation.mutate(payload);
  };

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="space-y-1 pb-2">
        <CardTitle className="text-2xl font-bold text-center text-primary">
          Đăng Ký
        </CardTitle>
        <CardDescription className="text-center">
          Tạo tài khoản mới
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username (*)</FormLabel>
                  <FormControl>
                    <Input placeholder="user123" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email (*)</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="email@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Hàng 1: Họ tên + Ngày sinh */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Họ tên</FormLabel>
                    <FormControl>
                      <Input placeholder="Nguyen Van A" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dob"
                render={({ field }) => (
                  <FormItem className="w-full sm:w-1/3">
                    <FormLabel>Ngày sinh</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Hàng 2: Password + Confirm (Tiết kiệm diện tích) */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Mật khẩu (*)</FormLabel>
                    <FormControl>
                      <PasswordInput placeholder="••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Nhập lại (*)</FormLabel>
                    <FormControl>
                      <PasswordInput placeholder="••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="pt-2">
              <Button
                className="w-full"
                type="submit"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? (
                  <Loader2 className="animate-spin mr-2 h-4 w-4" />
                ) : (
                  "Đăng Ký"
                )}
              </Button>
              <p className="text-[10px] text-center text-muted-foreground mt-2 px-4 leading-tight">
                Bằng việc đăng ký, bạn đồng ý với{" "}
                <Link href="/terms" className="underline hover:text-primary">
                  Điều khoản
                </Link>{" "}
                và{" "}
                <Link href="/privacy" className="underline hover:text-primary">
                  Chính sách bảo mật
                </Link>
                .
              </p>
            </div>
          </form>
        </Form>

        <SocialAuth />
      </CardContent>

      <CardFooter className="justify-center py-2 pb-4">
        <p className="text-sm text-muted-foreground">
          Đã có tài khoản?{" "}
          <Link
            href="/login"
            className="font-medium text-primary hover:underline"
          >
            Đăng nhập
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
