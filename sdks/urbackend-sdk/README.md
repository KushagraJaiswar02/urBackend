# urbackend-sdk

Official TypeScript SDK for [urBackend](https://urbackend.bitbros.in) — the instant Backend-as-a-Service for frontend developers.

## Installation
npm install @urbackend/sdk

## Quick Start
```javascript
import urBackend from '@urbackend/sdk';

const client = urBackend({ apiKey: 'YOUR_API_KEY' });

// Auth
await client.auth.signUp({ email, password, name });
await client.auth.login({ email, password });
await client.auth.me();

// Database — collections are auto-created on first insert
await client.db.insert('products', { name: 'Chair', price: 99 });
await client.db.getAll('products');
await client.db.getOne('products', id);
await client.db.update('products', id, { price: 79 });
await client.db.delete('products', id);

// Storage
await client.storage.upload(file);
await client.storage.deleteFile(path);
```

## API Reference

### Client initialization
`urBackend({ apiKey: string, baseUrl?: string })`

### Auth
| Method | Params | Returns |
|--------|--------|---------|
| signUp | { email, password, name? } | AuthUser |
| login  | { email, password } | { token, user } |
| me     | token? | AuthUser |
| logout | — | void |

### Database
| Method | Params | Returns |
|--------|--------|---------|
| getAll<T> | collection | T[] |
| getOne<T> | collection, id | T |
| insert<T> | collection, data | T |
| update<T> | collection, id, data | T |
| delete | collection, id | { deleted: boolean } |

### Storage
| Method | Params | Returns |
|--------|--------|---------|
| upload | file, filename? | { url, path } |
| deleteFile | path | { deleted: boolean } |

## Error Handling
```javascript
import { AuthError, NotFoundError, RateLimitError } from '@urbackend/sdk';

try {
  await client.db.getOne('products', id);
} catch (e) {
  if (e instanceof NotFoundError) console.log('Not found');
  if (e instanceof RateLimitError) console.log('Slow down');
}
```

## TypeScript Support
```typescript
interface Product { _id: string; name: string; price: number; }
const products = await client.db.getAll<Product>('products');
```

## Limits
- Rate limit: 100 requests / 15 mins per IP
- Database: 50 MB per project
- Storage: 100 MB per project
- File upload: 5 MB per file

## Security
⚠️ Never expose your API key in client-side/browser code.
Use environment variables: `process.env.URBACKEND_API_KEY`
