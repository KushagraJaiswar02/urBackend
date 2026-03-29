interface UrBackendConfig {
    apiKey: string;
    baseUrl?: string;
}
interface RequestOptions {
    body?: unknown;
    token?: string;
    isMultipart?: boolean;
}
interface SignUpPayload {
    email: string;
    password: string;
    name?: string;
}
interface LoginPayload {
    email: string;
    password: string;
}
interface AuthUser {
    _id: string;
    email: string;
    name?: string;
    [key: string]: unknown;
}
interface AuthResponse {
    token: string;
    user: AuthUser;
}
interface DocumentData {
    _id: string;
    [key: string]: unknown;
}
interface InsertPayload {
    [key: string]: unknown;
}
interface UpdatePayload {
    [key: string]: unknown;
}
interface UploadResponse {
    url: string;
    path: string;
}
interface ApiResponse<T> {
    data: T;
    success: boolean;
    message?: string;
}

declare class AuthModule {
    private client;
    private sessionToken?;
    constructor(client: UrBackendClient);
    /**
     * Create a new user account
     */
    signUp(payload: SignUpPayload): Promise<AuthUser>;
    /**
     * Log in an existing user and store the session token
     */
    login(payload: LoginPayload): Promise<AuthResponse>;
    /**
     * Get the current authenticated user's profile
     */
    me(token?: string): Promise<AuthUser>;
    /**
     * Clear the local session token
     */
    logout(): void;
}

declare class DatabaseModule {
    private client;
    constructor(client: UrBackendClient);
    /**
     * Fetch all documents from a collection
     */
    getAll<T extends DocumentData>(collection: string): Promise<T[]>;
    /**
     * Fetch a single document by its ID
     */
    getOne<T extends DocumentData>(collection: string, id: string): Promise<T>;
    /**
     * Insert a new document into a collection
     */
    insert<T extends DocumentData>(collection: string, data: InsertPayload): Promise<T>;
    /**
     * Update an existing document by its ID
     */
    update<T extends DocumentData>(collection: string, id: string, data: UpdatePayload): Promise<T>;
    /**
     * Delete a document by its ID
     */
    delete(collection: string, id: string): Promise<{
        deleted: boolean;
    }>;
}

declare class StorageModule {
    private client;
    constructor(client: UrBackendClient);
    /**
     * Upload a file to storage
     */
    upload(file: unknown, filename?: string): Promise<UploadResponse>;
    /**
     * Delete a file from storage by its path
     */
    deleteFile(path: string): Promise<{
        deleted: boolean;
    }>;
}

declare class UrBackendClient {
    private apiKey;
    private baseUrl;
    private _auth?;
    private _db?;
    private _storage?;
    constructor(config: UrBackendConfig);
    get auth(): AuthModule;
    get db(): DatabaseModule;
    get storage(): StorageModule;
    /**
     * Internal request handler
     */
    request<T>(method: string, path: string, options?: RequestOptions): Promise<T>;
}

declare class UrBackendError extends Error {
    message: string;
    statusCode: number;
    endpoint: string;
    constructor(message: string, statusCode: number, endpoint: string);
}
declare class AuthError extends UrBackendError {
    constructor(message: string, statusCode: number, endpoint: string);
}
declare class NotFoundError extends UrBackendError {
    constructor(message: string, endpoint: string);
}
declare class RateLimitError extends UrBackendError {
    retryAfter?: number;
    constructor(message: string, endpoint: string, retryAfter?: number);
}
declare class StorageError extends UrBackendError {
    constructor(message: string, statusCode: number, endpoint: string);
}
declare class ValidationError extends UrBackendError {
    constructor(message: string, endpoint: string);
}
declare function parseApiError(response: Response): Promise<UrBackendError>;

/**
 * Factory function to create a new urBackend client
 */
declare function urBackend(config: UrBackendConfig): UrBackendClient;

export { type ApiResponse, AuthError, type AuthResponse, type AuthUser, type DocumentData, type InsertPayload, type LoginPayload, NotFoundError, RateLimitError, type RequestOptions, type SignUpPayload, StorageError, type UpdatePayload, type UploadResponse, UrBackendClient, type UrBackendConfig, UrBackendError, ValidationError, urBackend as default, parseApiError };
