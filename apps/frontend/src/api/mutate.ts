import { ZodSchema } from "zod";
import { AxiosRequestConfig } from "axios";
import { apiClient } from "./client";
import { toast } from "sonner";

export async function mutate<TResponse, TRequest>({
  config,
  requestSchema,
  responseSchema,
  data,
}: {
  config: AxiosRequestConfig;
  requestSchema?: ZodSchema<TRequest>;
  responseSchema: ZodSchema<TResponse>;
  data?: TRequest;
}): Promise<TResponse> {
  if (requestSchema) {
    const parsedRequest = requestSchema.safeParse(data);
    if (!parsedRequest.success) {
      console.error("Request validation failed", parsedRequest.error);
      toast("Request validation failed");
      throw new Error("Invalid request payload");
    }
  }
  const response = await apiClient.request({
    ...config,
    data,
  });
  const parsedResponse = responseSchema.safeParse(response.data);
  if (!parsedResponse.success) {
    console.error("Response validation failed", parsedResponse.error);
    toast("Response validation failed");
    throw new Error("Invalid API response");
  }
  return parsedResponse.data;
}
