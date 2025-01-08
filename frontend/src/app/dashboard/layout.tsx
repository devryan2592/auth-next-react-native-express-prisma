import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "@/components/sidebar/app-sidebar";
import { Header } from "@/components/layout/header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex h-screen flex-col">
        <Header />
        <main className="relative flex-1 overflow-hidden">
          <div className="absolute inset-0 overflow-auto">
            <div className="container mx-auto p-4 lg:p-6">{children}</div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
