"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import {
  verifyValidateOTPSchema,
  type VerifyValidateOTPSchema,
} from "@/models/Auth";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp";
import { toast } from "sonner";

import {
  verifyEmailAction,
  resendEmailVerificationCodeAction,
} from "../actions";

export function EmailVerificationForm() {
  const form = useForm<VerifyValidateOTPSchema>({
    resolver: zodResolver(verifyValidateOTPSchema),
    defaultValues: {
      code: "",
    },
  });

  async function onSubmit(value: VerifyValidateOTPSchema) {
    const result = await verifyEmailAction({ message: "" }, value);
    if (result?.message) {
      toast.error("Oopps... something went wrong", {
        description: result?.message,
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Code</FormLabel>
              <FormControl>
                <InputOTP maxLength={8} {...field}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                    <InputOTPSlot index={6} />
                    <InputOTPSlot index={7} />
                  </InputOTPGroup>
                </InputOTP>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Loading..." : "Verify"}
        </Button>
      </form>
    </Form>
  );
}

export function ResendEmailVerificationCodeForm() {
  const form = useForm({
    defaultValues: {
      code: "",
    },
  });

  async function onSubmit() {
    const result = await resendEmailVerificationCodeAction();
    if (result?.message) {
      toast.error("Oopps... something went wrong.", {
        description: result?.message,
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
        <Button
          type="submit"
          variant="link"
          disabled={form.formState.isSubmitting}
        >
          Resend Code
        </Button>
      </form>
    </Form>
  );
}
