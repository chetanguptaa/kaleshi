import { ZodSchema } from "zod";
import { AxiosRequestConfig } from "axios";
import { apiClient } from "./client";
import { toast } from "sonner";

export async function fetcher<T>({
  config,
  schema,
}: {
  config: AxiosRequestConfig;
  schema: ZodSchema<T>;
}): Promise<T> {
  const response = await apiClient.request(config);
  const parsed = schema.safeParse(response.data);
  if (!parsed.success) {
    console.error("API response validation failed", parsed.error);
    toast("API response validation failed");
    throw new Error("Invalid API response");
  }
  return parsed.data;
}
