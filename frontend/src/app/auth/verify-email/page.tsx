"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authService } from "@/lib/services/auth";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");
  const token = searchParams.get("token");

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        if (!userId || !token) {
          toast.error("Invalid verification link");
          router.push("/auth/login");
          return;
        }

        const response = await authService.verifyEmail(userId, token);
        toast.success(response.message);
        setTimeout(() => {
          router.push("/auth/login");
        }, 2000);
      } catch (error: any) {
        toast.error(
          error?.response?.data?.message || "Email verification failed"
        );
        setTimeout(() => {
          router.push("/auth/login");
        }, 2000);
      }
    };

    verifyEmail();
  }, [userId, token, router]);

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Email Verification</CardTitle>
        <CardDescription>
          Please wait while we verify your email address
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </CardContent>
    </Card>
  );
}
