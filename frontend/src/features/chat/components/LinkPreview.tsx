import React from 'react';

interface LinkPreviewData {
  url?: string;
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  favicons?: string;
}

interface LinkPreviewProps {
  preview: LinkPreviewData;
}

const LinkPreview: React.FC<LinkPreviewProps> = ({ preview }) => {
  if (!preview || !preview.title) return null;

  return (
    <a
      href={preview.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block mt-2 bg-white/10 hover:bg-white/20 rounded-lg overflow-hidden border border-white/20 transition-colors no-underline text-inherit"
    >
      <div className="flex flex-col sm:flex-row">
        {preview.image && (
          <div className="sm:w-32 h-32 sm:h-auto overflow-hidden flex-shrink-0">
            <img
              src={preview.image}
              alt={preview.title}
              className="w-full h-full object-cover"
              onError={(e) => (e.currentTarget.style.display = 'none')}
            />
          </div>
        )}
        <div className="p-3 flex-1 min-w-0">
          <div className="text-sm font-bold truncate mb-1 text-white">
            {preview.title}
          </div>
          {preview.description && (
            <p className="text-xs line-clamp-2 mb-1 opacity-80 text-white">
              {preview.description}
            </p>
          )}
          <div className="flex items-center gap-2 mt-auto">
            {preview.favicons && (
              <img
                src={preview.favicons}
                alt=""
                className="w-3 h-3 rounded-sm"
              />
            )}
            <span className="text-[10px] uppercase tracking-wider opacity-60 font-semibold text-white">
              {preview.siteName || new URL(preview.url || '').hostname}
            </span>
          </div>
        </div>
      </div>
    </a>
  );
};

export default LinkPreview;
