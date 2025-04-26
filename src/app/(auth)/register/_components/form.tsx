"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { registerSchema, type RegisterSchema } from "@/models/Auth";

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

import { registerAction } from "../actions";
import { toast } from "sonner";

export function RegisterForm() {
  const form = useForm<RegisterSchema>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: RegisterSchema) {
    const result = await registerAction({ message: "" }, values);
    if (result?.message) {
      toast.error("Oopps... something went wrong", {
        description: result?.message,
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
        <div className="grid grid-cols-2 gap-4"></div>
      </form>
    </Form>
  );
}
