import { UrBackendClient } from '../client';
import { DocumentData, InsertPayload, UpdatePayload } from '../types';
import { NotFoundError } from '../errors';

export class DatabaseModule {
  constructor(private client: UrBackendClient) {}

  /**
   * Fetch all documents from a collection
   */
  public async getAll<T extends DocumentData>(collection: string): Promise<T[]> {
    try {
      return await this.client.request<T[]>('GET', `/api/data/${collection}`);
    } catch (e) {
      if (e instanceof NotFoundError) {
        return [] as T[];
      }
      throw e;
    }
  }

  /**
   * Fetch a single document by its ID
   */
  public async getOne<T extends DocumentData>(collection: string, id: string): Promise<T> {
    return this.client.request<T>('GET', `/api/data/${collection}/${id}`);
  }

  /**
   * Insert a new document into a collection
   */
  public async insert<T extends DocumentData>(collection: string, data: InsertPayload): Promise<T> {
    return this.client.request<T>('POST', `/api/data/${collection}`, { body: data });
  }

  /**
   * Update an existing document by its ID
   */
  public async update<T extends DocumentData>(
    collection: string,
    id: string,
    data: UpdatePayload,
  ): Promise<T> {
    return this.client.request<T>('PUT', `/api/data/${collection}/${id}`, { body: data });
  }

  /**
   * Delete a document by its ID
   */
  public async delete(collection: string, id: string): Promise<{ deleted: boolean }> {
    return this.client.request<{ deleted: boolean }>('DELETE', `/api/data/${collection}/${id}`);
  }
}
