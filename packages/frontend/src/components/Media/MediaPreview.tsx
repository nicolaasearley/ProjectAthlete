import { MediaFile } from '../../services/media.service';
import { mediaService } from '../../services/media.service';

interface MediaPreviewProps {
  mediaFile: MediaFile;
  className?: string;
  showDelete?: boolean;
  onDelete?: (id: string) => void;
}

export default function MediaPreview({
  mediaFile,
  className = '',
  showDelete = false,
  onDelete,
}: MediaPreviewProps) {
  const mediaUrl = mediaService.getMediaUrl(mediaFile);
  const isImage = mediaFile.mimeType.startsWith('image/');
  const isVideo = mediaFile.mimeType.startsWith('video/');

  const handleDelete = () => {
    if (onDelete && window.confirm('Are you sure you want to delete this file?')) {
      onDelete(mediaFile.id);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {isImage && (
        <img
          src={mediaUrl}
          alt={mediaFile.originalFilename}
          className="w-full h-full object-cover rounded-lg"
        />
      )}
      {isVideo && (
        <video
          src={mediaUrl}
          controls
          className="w-full h-full object-cover rounded-lg"
        >
          Your browser does not support the video tag.
        </video>
      )}
      {showDelete && onDelete && (
        <button
          onClick={handleDelete}
          className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-2 hover:bg-red-700 transition-colors"
          title="Delete"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

