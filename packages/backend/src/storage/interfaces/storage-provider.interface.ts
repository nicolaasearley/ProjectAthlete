export interface IStorageProvider {
  /**
   * Save a file to storage
   * @param file Buffer or file stream
   * @param path Storage path
   * @param mimeType MIME type of the file
   * @returns Public URL path
   */
  save(file: Buffer, path: string, mimeType: string): Promise<string>;

  /**
   * Get public URL for a file
   * @param path Storage path
   * @returns Public URL
   */
  getUrl(path: string): string;

  /**
   * Delete a file from storage
   * @param path Storage path
   */
  delete(path: string): Promise<void>;

  /**
   * Check if a file exists
   * @param path Storage path
   */
  exists(path: string): Promise<boolean>;
}

