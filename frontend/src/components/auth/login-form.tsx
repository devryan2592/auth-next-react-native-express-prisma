"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { authService } from "@/lib/services/auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import * as z from "zod";
import { useAuthStore } from "@/lib/stores/auth";
import { loginSchema } from "../../lib/schemas/loginSchema";

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const { setUser, setSession } = useAuthStore();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "admin@gmail.com",
      password: "Admin123*",
    },
  });

  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (response) => {
      // Check if it's a two-factor auth response
      if ('status' in response && response.status === 'pending') {
        const { userId, type } = response;
        toast.info(response.message || "Two-factor authentication code sent");
        router.push(`/auth/two-factor?userId=${userId}&type=${type}`);
        return;
      }

      // Type guard for success response
      if ('user' in response && 'session' in response) {
        const { user, session } = response;
        
        // Update auth store
        // setUser(user);
        setSession(session);
        
        toast.success("Login successful");
        router.push("/dashboard");
        return;
      }

      // This should never happen if types are correct
      toast.error("Unexpected response format");
    },
    onError: (error: Error) => {
      const errorMessage =
        error?.message || "Invalid email or password";

      if (errorMessage.includes("verify your email")) {
        toast.error("Please verify your email before logging in", {
          action: {
            label: "Resend verification",
            onClick: () => {
              const email = form.getValues("email");
              router.push(
                `/auth/resend-verification-email?email=${encodeURIComponent(
                  email
                )}`
              );
            },
          },
        });
      } else {
        toast.error(errorMessage);
      }
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  autoComplete="email"
                  disabled={loginMutation.isPending}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
              <FormLabel htmlFor="password">Password</FormLabel>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs text-muted-foreground hover:text-primary"
                >
                  Forgot password?
                </Link>
              </div>
              <FormControl>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    disabled={loginMutation.isPending}
                    {...field}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loginMutation.isPending}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="w-full"
          disabled={loginMutation.isPending}
        >
          {loginMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Logging in...
            </>
          ) : (
            "Login"
          )}
        </Button>
        <div className="space-y-2">
          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/auth/register"
              className="font-medium text-primary hover:underline"
            >
              Register
            </Link>
          </p>
          <p className="text-center text-xs text-muted-foreground">
            <Link
              href="/auth/resend-verification-email"
              className="font-medium text-primary hover:underline"
            >
              Resend verification email
            </Link>
          </p>
        </div>
      </form>
    </Form>
  );
}
