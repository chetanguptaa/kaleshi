import { ZodType } from "zod";
import axios from "axios";
import { AxiosRequestConfig } from "axios";
import { apiClient } from "./client";
import { ApiError } from "./error";

export async function fetcher<T>({
  config,
  schema,
}: {
  config: AxiosRequestConfig;
  schema: ZodType<T>;
}): Promise<T> {
  try {
    const response = await apiClient.request(config);
    const parsed = schema.safeParse(response.data);
    if (!parsed.success) {
      console.error("API response validation failed", parsed.error);
      throw new ApiError("Invalid API response");
    }
    return parsed.data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (axios.isAxiosError(error)) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Something went wrong";
      throw new ApiError(message, error.response?.status);
    }
    throw new ApiError("Unexpected error occurred");
  }
}
