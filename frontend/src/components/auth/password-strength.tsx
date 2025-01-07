"use client";

import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface PasswordStrengthProps {
  password: string;
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const calculateStrength = (password: string) => {
    let strength = 0;
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    };

    strength = Object.values(checks).filter(Boolean).length;

    return {
      strength,
      checks,
    };
  };

  const { strength, checks } = calculateStrength(password);
  const percentage = (strength / 5) * 100;

  return (
    <div className="space-y-2">
      <Progress
        value={percentage}
        className={cn(
          "h-2",
          percentage <= 20 && "text-destructive",
          percentage > 20 && percentage <= 40 && "text-orange-500",
          percentage > 40 && percentage <= 60 && "text-yellow-500",
          percentage > 60 && percentage <= 80 && "text-lime-500",
          percentage > 80 && "text-green-500"
        )}
      />
      <ul className="text-sm text-muted-foreground space-y-1">
        <li className={checks.length ? "text-green-500" : "text-destructive"}>
          At least 8 characters
        </li>
        <li
          className={checks.lowercase ? "text-green-500" : "text-destructive"}
        >
          One lowercase character
        </li>
        <li
          className={checks.uppercase ? "text-green-500" : "text-destructive"}
        >
          One uppercase character
        </li>
        <li className={checks.number ? "text-green-500" : "text-destructive"}>
          One number
        </li>
        <li className={checks.special ? "text-green-500" : "text-destructive"}>
          One special character
        </li>
      </ul>
    </div>
  );
}
