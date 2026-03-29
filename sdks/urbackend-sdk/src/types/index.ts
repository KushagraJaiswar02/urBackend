export interface UrBackendConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface RequestOptions {
  body?: unknown;
  token?: string;
  isMultipart?: boolean;
}

export interface SignUpPayload {
  email: string;
  password: string;
  name?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthUser {
  _id: string;
  email: string;
  name?: string;
  [key: string]: unknown;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface DocumentData {
  _id: string;
  [key: string]: unknown;
}

export interface InsertPayload {
  [key: string]: unknown;
}

export interface UpdatePayload {
  [key: string]: unknown;
}

export interface UploadResponse {
  url: string;
  path: string;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}
