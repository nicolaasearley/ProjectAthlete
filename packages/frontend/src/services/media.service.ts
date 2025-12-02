import { apiClient, ApiError } from '../lib/api';

export interface MediaFile {
  id: string;
  userId?: string;
  filename: string;
  originalFilename: string;
  mimeType: string;
  fileSizeBytes: string;
  storagePath: string;
  publicUrlPath: string;
  thumbnailPath?: string;
  width?: number;
  height?: number;
  durationSeconds?: number;
  storageProvider: string;
  checksumMd5?: string;
  createdAt: string;
  updatedAt: string;
}

class MediaService {
  async uploadFile(file: File): Promise<MediaFile> {
    const formData = new FormData();
    formData.append('file', file);

    // Don't set Content-Type header - browser will set it with boundary for FormData
    return await apiClient.post<MediaFile>('/media/upload', formData);
  }

  async getMyMedia(): Promise<MediaFile[]> {
    return await apiClient.get<MediaFile[]>('/media/me');
  }

  async getById(id: string): Promise<MediaFile> {
    return await apiClient.get<MediaFile>(`/media/${id}`);
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/media/${id}`);
  }

  getMediaUrl(mediaFile: MediaFile): string {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://10.1.1.3:3661';
    // Remove leading slash if present
    const urlPath = mediaFile.publicUrlPath.startsWith('/')
      ? mediaFile.publicUrlPath.slice(1)
      : mediaFile.publicUrlPath;
    return `${baseUrl}/${urlPath}`;
  }
}

export const mediaService = new MediaService();

