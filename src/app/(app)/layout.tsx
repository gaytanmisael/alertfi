import { AuthProvider } from "@/context/AuthProvider";
import { redirect } from "next/navigation";

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
        <SidebarInset>{children}</SidebarInset>
      </SidebarProvider>
    </AuthProvider>
  );
}
