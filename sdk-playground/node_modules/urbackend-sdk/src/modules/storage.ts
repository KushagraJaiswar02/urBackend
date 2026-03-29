/// <reference lib="dom" />
import { UrBackendClient } from '../client';
import { UploadResponse } from '../types';

export class StorageModule {
  constructor(private client: UrBackendClient) {}

  /**
   * Upload a file to storage
   */
  public async upload(file: unknown, filename?: string): Promise<UploadResponse> {
    const formData = new FormData();

    if (
      typeof window === 'undefined' &&
      typeof Buffer !== 'undefined' &&
      Buffer.isBuffer(file)
    ) {
      // In Node.js environment, convert Buffer to Blob for standard FormData
      const blob = new Blob([file as unknown as BlobPart]);
      formData.append('file', blob, filename || 'file');
    } else {
      // Browser File/Blob or Node.js Blob/File
      formData.append('file', file as unknown as Blob, filename);
    }

    return this.client.request<UploadResponse>('POST', '/api/storage/upload', {
      body: formData,
      isMultipart: true,
    });
  }

  /**
   * Delete a file from storage by its path
   */
  public async deleteFile(path: string): Promise<{ deleted: boolean }> {
    return this.client.request<{ deleted: boolean }>('DELETE', '/api/storage/file', {
      body: { path },
    });
  }
}
