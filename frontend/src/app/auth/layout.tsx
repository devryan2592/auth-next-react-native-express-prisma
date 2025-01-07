import { GalleryVerticalEnd } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-3 lg:grid-cols-2">
      <div className="col-span-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">{children}</div>
      </div>
      <div className="hidden md:col-span-2 lg:col-span-1 md:flex bg-muted items-center justify-center p-8">
        <div className="relative flex flex-col items-center gap-8">
          <div className="flex items-center justify-center gap-2 text-xl font-medium">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <GalleryVerticalEnd className="h-8 w-8" />
            </div>
            <span className="text-3xl font-bold">CRM Admin</span>
          </div>
          <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
            Streamline your business operations with our comprehensive CRM
            solution. Manage contacts, track deals, and boost productivity all
            in one place.
          </p>
        </div>
      </div>
    </div>
  );
}
