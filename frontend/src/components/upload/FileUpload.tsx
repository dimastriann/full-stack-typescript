import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { UPLOAD_FILE } from '../../features/attachments/gql/attachment.graphql';
import Logger from '../../lib/logger';

interface FileUploadProps {
  relationId: number;
  relationType: 'project' | 'task';
  onUploadSuccess?: () => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  relationId,
  relationType,
  onUploadSuccess,
}) => {
  const [uploadFile] = useMutation(UPLOAD_FILE);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      await uploadFile({
        variables: {
          file,
          relationId,
          relationType,
        },
      });
      if (onUploadSuccess) onUploadSuccess();
    } catch (error) {
      Logger.error('Error uploading file:', error);
      alert('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="file-upload space-y-4">
      <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
        Attachments
      </h3>
      <div className="relative group">
        <input
          type="file"
          onChange={handleFileChange}
          disabled={uploading}
          className="block w-full text-sm text-gray-500 dark:text-gray-400
            file:mr-4 file:py-2.5 file:px-4
            file:rounded-xl file:border-0
            file:text-sm file:font-bold
            file:bg-primary-50 file:text-primary-700
            dark:file:bg-primary-900/20 dark:file:text-primary-400
            hover:file:bg-primary-100 dark:hover:file:bg-primary-900/30
            transition-all cursor-pointer disabled:opacity-50"
        />
        {uploading && (
          <div className="mt-3 flex items-center gap-2 text-xs font-bold text-primary-600 dark:text-primary-400 animate-pulse uppercase tracking-widest">
            <div className="w-4 h-4 border-2 border-primary-600 dark:border-primary-400 border-t-transparent rounded-full animate-spin"></div>
            Uploading...
          </div>
        )}
      </div>
    </div>
  );
};
