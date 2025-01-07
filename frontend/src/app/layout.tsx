import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/lib/providers/theme-provider";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "@/components/sidebar/app-sidebar";
import { Header } from "@/components/layout/header";
import { Providers } from "@/lib/providers/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Authentication with Next Express",
  description: "Authentication with Next Express",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          storageKey="crm-theme"
        >
          <Providers>
            <SidebarProvider>
              <AppSidebar />
              <SidebarInset className="flex h-screen flex-col">
                <Header />
                <main className="relative flex-1 overflow-hidden">
                  <div className="absolute inset-0 overflow-auto">
                    <div className="container mx-auto p-4 lg:p-6">
                      {children}
                    </div>
                  </div>
                </main>
              </SidebarInset>
            </SidebarProvider>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
