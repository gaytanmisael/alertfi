import { AuthProvider } from "@/context/AuthProvider";
import { redirect } from "next/navigation";

import { AppSidebar } from "./_components/app-sidebar";
import { SiteHeader } from "./_components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import { getCurrentSession } from "@/server/auth/session";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { session, user } = await getCurrentSession();
  if (!session || !user) return redirect("/login");

  const initData = { user, session };

  return (
    <AuthProvider initialData={initData}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <main className="bg-background relative flex w-full flex-1 flex-col md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow md:peer-data-[state=collapsed]:peer-data-[variant=inset]:ml-2">
            <SiteHeader />
            <div className="flex flex-1 flex-col">
              <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                  {children}
                </div>
              </div>
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </AuthProvider>
  );
}
