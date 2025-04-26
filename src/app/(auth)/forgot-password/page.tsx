import Link from "next/link";

import { globalGETRateLimit } from "@/server/auth/request";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ForgotEmailForm } from "./_components/form";

export default async function Page() {
  if (!(await globalGETRateLimit())) return "Too many requests";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Forgot Password</CardTitle>
        <CardDescription>
          Enter your email below to begin process.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ForgotEmailForm />
        <div className="text-center text-sm">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-steel-blue-600 hover:text-steel-blue-500 leading-6 font-semibold"
          >
            Sign In
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
