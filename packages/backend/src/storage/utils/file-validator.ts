export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export class FileValidator {
  // Allowed MIME types for images
  private static readonly ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
  ];

  // Allowed MIME types for videos
  private static readonly ALLOWED_VIDEO_TYPES = [
    'video/mp4',
    'video/webm',
    'video/quicktime',
  ];

  // Maximum file sizes (in bytes)
  private static readonly MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
  private static readonly MAX_VIDEO_SIZE = 25 * 1024 * 1024; // 25MB

  /**
   * Validate file based on size, MIME type, and extension
   */
  static validateFile(
    file: { mimetype: string; size: number; originalname: string },
    allowedTypes: 'image' | 'video' | 'both' = 'both',
  ): FileValidationResult {
    if (!file.mimetype || !file.originalname) {
      return {
        valid: false,
        error: 'Invalid file format',
      };
    }
    // Validate file size
    const maxSize = allowedTypes === 'video' 
      ? this.MAX_VIDEO_SIZE 
      : allowedTypes === 'image'
      ? this.MAX_IMAGE_SIZE
      : Math.max(this.MAX_IMAGE_SIZE, this.MAX_VIDEO_SIZE);

    if (file.size > maxSize) {
      const maxMB = Math.round(maxSize / (1024 * 1024));
      return {
        valid: false,
        error: `File size exceeds maximum allowed size of ${maxMB}MB`,
      };
    }

    // Validate MIME type
    let allowedMimeTypes: string[] = [];
    if (allowedTypes === 'image') {
      allowedMimeTypes = this.ALLOWED_IMAGE_TYPES;
    } else if (allowedTypes === 'video') {
      allowedMimeTypes = this.ALLOWED_VIDEO_TYPES;
    } else {
      allowedMimeTypes = [...this.ALLOWED_IMAGE_TYPES, ...this.ALLOWED_VIDEO_TYPES];
    }

    if (!allowedMimeTypes.includes(file.mimetype)) {
      return {
        valid: false,
        error: `File type ${file.mimetype} is not allowed. Allowed types: ${allowedMimeTypes.join(', ')}`,
      };
    }

    // Validate extension matches MIME type
    const ext = file.originalname.split('.').pop()?.toLowerCase();
    if (!this.isValidExtension(file.mimetype, ext || '')) {
      return {
        valid: false,
        error: 'File extension does not match file type',
      };
    }

    return { valid: true };
  }

  /**
   * Check if file extension matches MIME type
   */
  private static isValidExtension(mimeType: string, extension: string): boolean {
    const extensionMap: Record<string, string[]> = {
      'image/jpeg': ['jpg', 'jpeg'],
      'image/png': ['png'],
      'image/gif': ['gif'],
      'image/webp': ['webp'],
      'video/mp4': ['mp4'],
      'video/webm': ['webm'],
      'video/quicktime': ['mov', 'qt'],
    };

    const allowedExtensions = extensionMap[mimeType] || [];
    return allowedExtensions.includes(extension);
  }
}

