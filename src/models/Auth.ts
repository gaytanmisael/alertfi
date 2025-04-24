import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email({
    message: "The email address you entered doesn’t seem to be valid.",
  }),
  password: z.string().min(8, {
    message: "Your password is too short. It should be 8 or more characters.",
  }),
});
export type Login = z.infer<typeof loginSchema>;
