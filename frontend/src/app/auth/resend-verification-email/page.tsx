"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { authService } from "@/lib/services/auth";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import Link from "next/link";

const resendVerificationSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type ResendVerificationFormValues = z.infer<typeof resendVerificationSchema>;

export default function ResendVerificationEmailPage() {
  const form = useForm<ResendVerificationFormValues>({
    resolver: zodResolver(resendVerificationSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ResendVerificationFormValues) => {
    try {
      const response = await authService.resendVerification(data.email);
      toast.success(response.message);
      form.reset();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to resend verification email"
      );
    }
  };

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Resend Verification Email</CardTitle>
        <CardDescription>
          Enter your email address to receive a new verification link
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Resend Verification Email"
              )}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already verified your email?{" "}
              <Link
                href="/auth/login"
                className="font-medium text-primary hover:underline"
              >
                Login
              </Link>
            </p>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
