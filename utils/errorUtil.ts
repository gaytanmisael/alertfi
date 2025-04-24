import { ZodError } from "zod";
import { TRPCClientError } from "@trpc/client";

function getErrorMessage(error: unknown): string {
  if (error instanceof ZodError) {
    const flattenedErrors = error.flatten();
    return flattenedErrors.formErrors.length > 0
      ? flattenedErrors.formErrors[0]!
      : (Object.values(flattenedErrors.fieldErrors)[0]?.[0] ??
          "Validation Errors");
  }

  if (error instanceof TRPCClientError) {
    return error.message || "An unexpected error occurred with tRPC.";
  }

  if (error instanceof Error) {
    return error.message || "An unexpected error occurred.";
  }

  return "An unknown error occurred.";
}

export { getErrorMessage };
