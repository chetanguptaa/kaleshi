import { ZodError } from "zod";

export function formatZodError(error: ZodError): string {
  const firstIssue = error.issues[0];
  if (!firstIssue) {
    return "Invalid input";
  }
  const field = firstIssue.path[0];
  if (field) {
    return `${capitalize(String(field))}: ${firstIssue.message}`;
  }
  return firstIssue.message;
}

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
