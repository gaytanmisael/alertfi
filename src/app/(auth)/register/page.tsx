import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentSession } from "@/server/auth/session";
import { globalGETRateLimit } from "@/server/auth/request";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RegisterForm } from "./_components/form";

export default async function Page() {
  if (!(await globalGETRateLimit())) {
    return "Too many requests.";
  }

  const { session, user } = await getCurrentSession();
  if (session !== null) {
    if (!user.emailVerified) {
      return redirect("/verify-email");
    }
    if (!user.registered2FA) {
      return redirect("/2fa/setup");
    }
    if (!session.twoFactorVerified) {
      return redirect("/2fa");
    }
    return redirect("/");
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Sign Up</CardTitle>
          <CardDescription>
            Enter your email below to create an account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RegisterForm />
          <div className="text-center text-sm">
            Already have an account?{" "}
            <Link
              href="/sign-in"
              className="text-steel-blue-600 hover:text-steel-blue-500 leading-6 font-semibold"
            >
              Sign In
            </Link>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
