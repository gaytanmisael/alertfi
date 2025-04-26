import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email({
    message: "The email address you entered doesn’t seem to be valid.",
  }),
  password: z.string().min(8, {
    message: "Your password is too short. It should be 8 or more characters.",
  }),
});
export type LoginSchema = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  first_name: z.string().min(2, { message: "First name is required." }),
  last_name: z.string().min(2, { message: "Last name is required." }),
  email: z.string().email({
    message: "The email address you entered doesn’t seem to be valid.",
  }),
  password: z.string().min(8, {
    message: "Your password is too short. It should be 8 or more characters.",
  }),
});
export type RegisterSchema = z.infer<typeof registerSchema>;
