import axios from "axios";
import { BACKEND_URL } from "@/constants";

export const apiClient = axios.create({
  baseURL: BACKEND_URL,
  withCredentials: true,
});
