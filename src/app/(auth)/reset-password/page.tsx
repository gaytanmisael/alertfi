import { redirect } from "next/navigation";

import { globalGETRateLimit } from "@/server/auth/request";
import { validatePasswordResetSessionRequest } from "@/server/auth/password-reset";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { NewPasswordForm } from "./_components/form";

export default async function Page() {
  if (!(await globalGETRateLimit())) return "Too many requests.";

  const { session } = await validatePasswordResetSessionRequest();
  if (session === null) return redirect("/forgot-password");

  if (!session.emailVerified) {
    return redirect("/reset-password/verify-email");
  }

  return (
    <Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">New Password</CardTitle>
          <CardDescription>Enter your new password.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <NewPasswordForm />
        </CardContent>
      </Card>
    </Card>
  );
}
