"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";

import { authService } from "@/lib/services/auth";
// import { useAuthStore } from "@/lib/stores/auth";
import { useMutation } from "@tanstack/react-query";

const formSchema = z.object({
  otp: z.string().length(6, "Please enter a valid 6-digit code"),
});

type FormData = z.infer<typeof formSchema>;

export function TwoFactorForm() {
  // const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  // const setUser = useAuthStore((state) => state.setUser);
  // const setAccessToken = useAuthStore((state) => state.setAccessToken);

  // Get params from URL
  const userId = searchParams.get("userId");
  const type = searchParams.get("type");

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      otp: "",
    },
  });

  const verifyTwoFactorMutation = useMutation({
    mutationFn: (otp: string) =>
      authService.verifyTwoFactor(
        otp,
        userId as string,
        type as "LOGIN" | "PASSWORD_CHANGE"
      ),
    onSuccess: (response) => {
      if ('user' in response && 'session' in response) {
        // const { user, session } = response;
        
        // Update auth store
        // setUser(user);
        // setSession(session);
        
        toast.success("Login successful");
        router.push("/dashboard");
        return;
      }

      // This should never happen if types are correct
      toast.error("Unexpected response format");
    },
    onError: (error: Error) => {
      toast.error(error?.message || "Failed to verify code");
    },
  });

  // Validate required params
  if (!userId || !type) {
    toast.error("Invalid verification request");
    router.push("/auth/login");
    return null;
  }

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
              <FormLabel>Verification Code</FormLabel>
              <FormControl>
                <InputOTP maxLength={6} {...field} autoFocus={true}>
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

        <Button
          type="submit"
          className="w-full"
          disabled={verifyTwoFactorMutation.isPending}
        >
          {verifyTwoFactorMutation.isPending ? "Verifying..." : "Verify Code"}
        </Button>
      </form>
    </Form>
  );
}
