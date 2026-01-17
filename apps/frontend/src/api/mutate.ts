import { ZodType } from "zod";
import axios, { AxiosRequestConfig, AxiosError } from "axios";
import { apiClient } from "./client";
import { ApiError } from "./error";
import { formatZodError } from "./zod-error";

export async function mutate<TResponse, TRequest>({
  config,
  requestSchema,
  responseSchema,
  data,
}: {
  config: AxiosRequestConfig;
  requestSchema?: ZodType<TRequest>;
  responseSchema: ZodType<TResponse>;
  data?: TRequest;
}): Promise<TResponse> {
  if (requestSchema) {
    const parsedRequest = requestSchema.safeParse(data);
    if (!parsedRequest.success) {
      throw new ApiError(formatZodError(parsedRequest.error));
    }
  }
  try {
    const response = await apiClient.request({
      ...config,
      data,
    });
    const parsedResponse = responseSchema.safeParse(response.data);
    if (!parsedResponse.success) {
      throw new ApiError("Invalid API response");
    }
    return parsedResponse.data;
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    if (axios.isAxiosError(err)) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Something went wrong";
      throw new ApiError(message, err.response?.status);
    }
    throw new ApiError("Unexpected error occurred");
  }
}
