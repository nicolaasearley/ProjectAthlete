export class FileSanitizer {
  /**
   * Sanitize filename to prevent path traversal and unsafe characters
   */
  static sanitizeFilename(filename: string): string {
    // Remove path separators
    let sanitized = filename.replace(/[/\\?%*:|"<>]/g, '_');
    
    // Remove leading/trailing dots and spaces
    sanitized = sanitized.replace(/^[.\s]+|[.\s]+$/g, '');
    
    // Limit length
    if (sanitized.length > 255) {
      const ext = this.getExtension(sanitized);
      const nameWithoutExt = sanitized.slice(0, 255 - ext.length - 1);
      sanitized = nameWithoutExt + '.' + ext;
    }
    
    return sanitized || 'file';
  }

  /**
   * Get file extension from filename
   */
  static getExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    return lastDot > 0 ? filename.slice(lastDot + 1).toLowerCase() : '';
  }

  /**
   * Generate a safe storage path using UUID directory structure
   */
  static generateStoragePath(userId: string, filename: string, uuid: string): string {
    const sanitizedFilename = this.sanitizeFilename(filename);
    const ext = this.getExtension(sanitizedFilename);
    const nameWithoutExt = sanitizedFilename.replace(/\.[^/.]+$/, '');
    
    return `${userId}/${uuid}/${nameWithoutExt}.${ext}`;
  }
}

