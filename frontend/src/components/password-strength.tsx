import { cn } from "@/lib/utils";

interface PasswordStrengthProps {
  password: string;
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const getStrengthWidth = (password: string) => {
    if (!password) return "0%";

    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const isLongEnough = password.length >= 8;

    const strength =
      [hasLower, hasUpper, hasNumber, hasSpecial, isLongEnough].filter(Boolean)
        .length * 20;

    return `${strength}%`;
  };

  const getStrengthColor = (password: string) => {
    const width = parseInt(getStrengthWidth(password));
    if (width <= 20) return "bg-red-500";
    if (width <= 40) return "bg-orange-500";
    if (width <= 60) return "bg-yellow-500";
    if (width <= 80) return "bg-blue-500";
    return "bg-green-500";
  };

  const getStrengthText = (password: string) => {
    const width = parseInt(getStrengthWidth(password));
    if (!password) return "";
    if (width <= 20) return "Very weak";
    if (width <= 40) return "Weak";
    if (width <= 60) return "Fair";
    if (width <= 80) return "Good";
    return "Strong";
  };

  return (
    <div className="mt-2 space-y-2">
      <div className="h-2 w-full rounded-full bg-secondary">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            getStrengthColor(password)
          )}
          style={{ width: getStrengthWidth(password) }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {getStrengthText(password)}
      </p>
    </div>
  );
}
