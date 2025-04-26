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

export const forgotPasswordSchema = loginSchema.pick({ email: true });
export type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;

export const verifyValidateOTPSchema = z.object({
  code: z
    .string()
    .min(8, { message: "Verification Code is 8 characters long" }),
});
export type VerifyValidateOTPSchema = z.infer<typeof verifyValidateOTPSchema>;

export const newPasswordSchema = z
  .object({
    password: z.string().min(8, {
      message: "Your password is too short. It should be 8 or more characters.",
    }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type NewPasswordSchema = z.infer<typeof newPasswordSchema>;
