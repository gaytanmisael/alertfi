import { redirect } from "next/navigation";

import { globalGETRateLimit } from "@/server/auth/request";
import { getCurrentSession } from "@/server/auth/session";
import { getUserEmailVerificationRequestFromRequest } from "@/server/auth/email-verification";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  EmailVerificationForm,
  ResendEmailVerificationCodeForm,
} from "./_components/form";

export default async function Page() {
  if (!(await globalGETRateLimit())) return "Too many requests.";

  const { user } = await getCurrentSession();
  if (user === null) return redirect("/sign-in");

  const verificationRequest =
    await getUserEmailVerificationRequestFromRequest();
  if (verificationRequest === null && user.emailVerified) return redirect("/");

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Verify Email</CardTitle>
          <CardDescription>
            We sent an 8-digit code to{" "}
            <strong>{verificationRequest?.email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <EmailVerificationForm />
          <ResendEmailVerificationCodeForm />
        </CardContent>
      </Card>
    </>
  );
}
