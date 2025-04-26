import { redirect } from "next/navigation";

import { globalGETRateLimit } from "@/server/auth/request";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmailVerificationForm } from "./_components/form";
import { validatePasswordResetSessionRequest } from "@/server/auth/password-reset";

export default async function Page() {
  if (!(await globalGETRateLimit())) return "Too many requests";

  const { session } = await validatePasswordResetSessionRequest();
  if (session === null) return redirect("/forgot-password");

  if (session.emailVerified) return redirect("/reset-password");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Verify Email</CardTitle>
        <CardDescription>
          We sent an 8-digit code to <strong>{session?.email}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <EmailVerificationForm />
      </CardContent>
    </Card>
  );
}
