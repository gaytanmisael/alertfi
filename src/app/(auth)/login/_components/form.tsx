"use client";

import Link from "next/link";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { api } from "@/trpc/react";

import { loginSchema, type Login } from "@/models/Auth";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import { getErrorMessage } from "utils/errorUtil";

export function LoginForm() {
  const form = useForm<Login>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const utils = api.useUtils();
  const login = api.auth.login.useMutation({
    onSuccess: async () => {
      await utils.auth.invalidate();
      toast.success("You're now logged in!");
      // Optional: redirect to dashboard
      window.location.href = "/dashboard";
    },
    onError: (error) => {
      toast.error("Oops... something went wrong", {
        description: error.message,
      });
    },
  });

  async function onSubmit(values: Login) {
    try {
      await login.mutateAsync(values);
    } catch (e: unknown) {
      toast.error("Oopps... something went wrong", {
        description: getErrorMessage(e),
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input
                  placeholder="you@example.com"
                  autoComplete="email"
                  disabled={form.formState.isSubmitting}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center">
                <FormLabel>Password</FormLabel>
                <Link
                  href="/forgot-password"
                  className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <FormControl>
                <Input
                  type="password"
                  disabled={form.formState.isSubmitting}
                  autoComplete="current-password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Submitting..." : "Sign In"}
        </Button>
      </form>
    </Form>
  );
}
