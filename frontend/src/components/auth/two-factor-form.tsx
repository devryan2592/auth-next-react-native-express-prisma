"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";

import { authService } from "@/lib/services/auth";
import { useAuthStore } from "@/lib/stores/auth";
import { useMutation } from "@tanstack/react-query";

const formSchema = z.object({
  otp: z.string().length(6, "Please enter a valid 6-digit code"),
});

type FormData = z.infer<typeof formSchema>;

export function TwoFactorForm() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      otp: "",
    },
  });

  const verifyTwoFactorMutation = useMutation({
    mutationFn: (otp: string) => authService.verifyTwoFactor(otp),
    onSuccess: (response) => {
      if (response.data?.user) {
        setUser(response.data.user);
        toast.success("Two-factor authentication successful");
        router.push("/dashboard");
      }
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to verify code");
    },
  });

  async function onSubmit(data: FormData) {
    verifyTwoFactorMutation.mutate(data.otp);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="otp"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New Password</FormLabel>
              <FormControl>
            <InputOTP maxLength={6} {...field}>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup>
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
                </InputOTP>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Verifying..." : "Verify Code"}
        </Button>
      </form>
    </Form>
  );
}
