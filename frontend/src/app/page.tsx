import Image from "next/image";
import Link from "next/link";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6 text-center">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-center gap-2 font-medium">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <KeyRound className="h-6 w-6" />
            </div>
            <span className="text-3xl font-bold">AuthFlow</span>
          </div>
          <p className="text-muted-foreground">
            Secure authentication system with Next.js and Express. Simple, fast,
            and reliable.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <Link href="/auth/login">
            <Button className="w-full" size="lg">
              Sign In
            </Button>
          </Link>
          <Link href="/auth/register">
            <Button className="w-full" variant="outline" size="lg">
              Create Account
            </Button>
          </Link>
        </div>
        <p className="text-sm text-muted-foreground">
          Built with Next.js, Express, and Prisma
        </p>
      </div>
    </div>
  );
}
