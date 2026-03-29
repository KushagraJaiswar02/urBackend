# urbackend-sdk

A fully typed, zero-dependency TypeScript SDK for the **urBackend** BaaS platform.

[![npm version](https://img.shields.io/npm/v/urbackend-sdk.svg)](https://www.npmjs.com/package/urbackend-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- 🔐 **Auth**: SignUp, Login, and Session management.
- 📂 **Database**: Full CRUD operations with TypeScript generics.
- ☁️ **Storage**: Easy file uploads and deletions.
- 🛠️ **Fully Typed**: Written in TypeScript with exhaustive interfaces.
- 📦 **Zero Runtime Dependencies**: Uses native `fetch` and `FormData`.
- 🌐 **Isomorphic**: Works in Node.js (18+) and modern browsers.

## Installation

```bash
npm install urbackend-sdk
```

## Quick Start

```typescript
import urBackend from 'urbackend-sdk';

// 1. Initialize the client
const client = urBackend({ 
  apiKey: 'your-api-key' 
});

// 2. Authenticate
const { token, user } = await client.auth.login({
  email: 'user@example.com',
  password: 'securepassword'
});

// 3. Database operations (Typed)
interface Product {
  _id: string;
  name: string;
  price: number;
}

const products = await client.db.getAll<Product>('products');

// 4. File uploads
const file = await client.storage.upload(myFileBlob, 'avatar.jpg');
console.log('File available at:', file.url);
```

## API Reference

### Auth Module (`client.auth`)

| Method | Parameters | Returns | Description |
| --- | --- | --- | --- |
| `signUp` | `payload: SignUpPayload` | `Promise<AuthUser>` | Create a new account. |
| `login` | `payload: LoginPayload` | `Promise<AuthResponse>` | Log in and store session token. |
| `me` | `token?: string` | `Promise<AuthUser>` | Get current user profile. |
| `logout` | - | `void` | Clear session token locally. |

### Database Module (`client.db`)

| Method | Parameters | Returns | Description |
| --- | --- | --- | --- |
| `getAll<T>` | `collection: string` | `Promise<T[]>` | Get all items from a collection. |
| `getOne<T>` | `collection, id` | `Promise<T>` | Get a specific document by ID. |
| `insert<T>` | `collection, data` | `Promise<T>` | Add a new document. |
| `update<T>` | `collection, id, data` | `Promise<T>` | Update an existing document. |
| `delete` | `collection, id` | `Promise<{deleted:boolean}>` | Remove a document. |

### Storage Module (`client.storage`)

| Method | Parameters | Returns | Description |
| --- | --- | --- | --- |
| `upload` | `file: File\|Blob\|Buffer, name?` | `Promise<UploadResponse>` | Upload a file. |
| `deleteFile` | `path: string` | `Promise<{deleted:boolean}>` | Delete a file by its path. |

## Error Handling

The SDK provides typed error classes for better error management:

```typescript
import { AuthError, NotFoundError, RateLimitError } from 'urbackend-sdk';

try {
  await client.db.getOne('products', 'invalid-id');
} catch (error) {
  if (error instanceof NotFoundError) {
    console.error('Item not found');
  } else if (error instanceof RateLimitError) {
    console.error(`Please retry after ${error.retryAfter} seconds`);
  }
}
```

## Security Warning

> [!WARNING]
> **Do not expose your API Key in client-side code.**
> Using this SDK in a browser environment (React, Vue, etc.) without a proxy or proper restrictions may allow users to see your API Key. It is recommended to use the SDK in server-side environments (Next.js API routes, Node.js servers, etc.).

## License

MIT © [BitBros](https://bitbros.in)
