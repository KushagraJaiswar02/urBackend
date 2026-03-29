"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  AuthError: () => AuthError,
  NotFoundError: () => NotFoundError,
  RateLimitError: () => RateLimitError,
  StorageError: () => StorageError,
  UrBackendClient: () => UrBackendClient,
  UrBackendError: () => UrBackendError,
  ValidationError: () => ValidationError,
  default: () => urBackend,
  parseApiError: () => parseApiError
});
module.exports = __toCommonJS(index_exports);

// src/errors.ts
var UrBackendError = class extends Error {
  constructor(message, statusCode, endpoint) {
    super(message);
    this.message = message;
    this.statusCode = statusCode;
    this.endpoint = endpoint;
    this.name = "UrBackendError";
  }
};
var AuthError = class extends UrBackendError {
  constructor(message, statusCode, endpoint) {
    super(message, statusCode, endpoint);
    this.name = "AuthError";
  }
};
var NotFoundError = class extends UrBackendError {
  constructor(message, endpoint) {
    super(message, 404, endpoint);
    this.name = "NotFoundError";
  }
};
var RateLimitError = class extends UrBackendError {
  constructor(message, endpoint, retryAfter) {
    super(message, 429, endpoint);
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
  }
};
var StorageError = class extends UrBackendError {
  constructor(message, statusCode, endpoint) {
    super(message, statusCode, endpoint);
    this.name = "StorageError";
  }
};
var ValidationError = class extends UrBackendError {
  constructor(message, endpoint) {
    super(message, 400, endpoint);
    this.name = "ValidationError";
  }
};
async function parseApiError(response) {
  const endpoint = new URL(response.url).pathname;
  let message = "An unexpected error occurred";
  let data;
  try {
    data = await response.json();
    if (typeof data === "object" && data !== null && "message" in data) {
      message = data.message || message;
    }
  } catch {
    message = response.statusText || message;
  }
  const status = response.status;
  if (status === 401 || status === 403) {
    return new AuthError(message, status, endpoint);
  }
  if (status === 404) {
    return new NotFoundError(message, endpoint);
  }
  if (status === 429) {
    const retryAfter = response.headers.get("Retry-After");
    return new RateLimitError(message, endpoint, retryAfter ? parseInt(retryAfter, 10) : void 0);
  }
  if (status === 400) {
    return new ValidationError(message, endpoint);
  }
  if (endpoint.includes("/api/storage")) {
    return new StorageError(message, status, endpoint);
  }
  return new UrBackendError(message, status, endpoint);
}

// src/modules/auth.ts
var AuthModule = class {
  constructor(client) {
    this.client = client;
  }
  /**
   * Create a new user account
   */
  async signUp(payload) {
    return this.client.request("POST", "/api/userAuth/signup", { body: payload });
  }
  /**
   * Log in an existing user and store the session token
   */
  async login(payload) {
    const response = await this.client.request("POST", "/api/userAuth/login", {
      body: payload
    });
    this.sessionToken = response.token;
    return response;
  }
  /**
   * Get the current authenticated user's profile
   */
  async me(token) {
    const activeToken = token || this.sessionToken;
    if (!activeToken) {
      throw new AuthError("Authentication token is required for /me endpoint", 401, "/api/userAuth/me");
    }
    return this.client.request("GET", "/api/userAuth/me", { token: activeToken });
  }
  /**
   * Clear the local session token
   */
  logout() {
    this.sessionToken = void 0;
  }
};

// src/modules/database.ts
var DatabaseModule = class {
  constructor(client) {
    this.client = client;
  }
  /**
   * Fetch all documents from a collection
   */
  async getAll(collection) {
    try {
      return await this.client.request("GET", `/api/data/${collection}`);
    } catch (e) {
      if (e instanceof NotFoundError) {
        return [];
      }
      throw e;
    }
  }
  /**
   * Fetch a single document by its ID
   */
  async getOne(collection, id) {
    return this.client.request("GET", `/api/data/${collection}/${id}`);
  }
  /**
   * Insert a new document into a collection
   */
  async insert(collection, data) {
    return this.client.request("POST", `/api/data/${collection}`, { body: data });
  }
  /**
   * Update an existing document by its ID
   */
  async update(collection, id, data) {
    return this.client.request("PUT", `/api/data/${collection}/${id}`, { body: data });
  }
  /**
   * Delete a document by its ID
   */
  async delete(collection, id) {
    return this.client.request("DELETE", `/api/data/${collection}/${id}`);
  }
};

// src/modules/storage.ts
var StorageModule = class {
  constructor(client) {
    this.client = client;
  }
  /**
   * Upload a file to storage
   */
  async upload(file, filename) {
    const formData = new FormData();
    if (typeof window === "undefined" && typeof Buffer !== "undefined" && Buffer.isBuffer(file)) {
      const blob = new Blob([file]);
      formData.append("file", blob, filename || "file");
    } else {
      formData.append("file", file, filename);
    }
    return this.client.request("POST", "/api/storage/upload", {
      body: formData,
      isMultipart: true
    });
  }
  /**
   * Delete a file from storage by its path
   */
  async deleteFile(path) {
    return this.client.request("DELETE", "/api/storage/file", {
      body: { path }
    });
  }
};

// src/client.ts
var UrBackendClient = class {
  constructor(config) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || "https://api.urbackend.bitbros.in";
    if (typeof window !== "undefined") {
      console.warn(
        "\u26A0\uFE0F urbackend-sdk: Avoid exposing your API key in client-side code. This can lead to unauthorized access to your account and data."
      );
    }
  }
  get auth() {
    if (!this._auth) {
      this._auth = new AuthModule(this);
    }
    return this._auth;
  }
  get db() {
    if (!this._db) {
      this._db = new DatabaseModule(this);
    }
    return this._db;
  }
  get storage() {
    if (!this._storage) {
      this._storage = new StorageModule(this);
    }
    return this._storage;
  }
  /**
   * Internal request handler
   */
  async request(method, path, options = {}) {
    const url = `${this.baseUrl}${path}`;
    const headers = {
      "x-api-key": this.apiKey,
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      "Origin": "https://urbackend.bitbros.in",
      "Referer": "https://urbackend.bitbros.in/"
    };
    if (options.token) {
      headers["Authorization"] = `Bearer ${options.token}`;
    }
    let requestBody;
    if (options.isMultipart) {
      requestBody = options.body;
    } else if (options.body) {
      headers["Content-Type"] = "application/json";
      requestBody = JSON.stringify(options.body);
    }
    try {
      const response = await fetch(url, {
        method,
        headers,
        body: requestBody
      });
      if (!response.ok) {
        throw await parseApiError(response);
      }
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const json = await response.json();
        return json.data !== void 0 ? json.data : json;
      }
      return await response.text();
    } catch (error) {
      if (error instanceof UrBackendError) {
        throw error;
      }
      throw new UrBackendError(
        error instanceof Error ? error.message : "Network request failed",
        0,
        path
      );
    }
  }
};

// src/index.ts
function urBackend(config) {
  return new UrBackendClient(config);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AuthError,
  NotFoundError,
  RateLimitError,
  StorageError,
  UrBackendClient,
  UrBackendError,
  ValidationError,
  parseApiError
});
//# sourceMappingURL=index.js.map