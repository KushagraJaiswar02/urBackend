import { UrBackendClient } from './client';
import { UrBackendConfig } from './types';

export * from './types';
export * from './errors';
export { UrBackendClient };

/**
 * Factory function to create a new urBackend client
 */
export default function urBackend(config: UrBackendConfig): UrBackendClient {
  return new UrBackendClient(config);
}
