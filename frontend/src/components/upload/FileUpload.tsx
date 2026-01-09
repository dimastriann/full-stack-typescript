import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { UPLOAD_FILE } from '../../features/attachments/gql/attachment.graphql';

interface FileUploadProps {
    relationId: number;
    relationType: 'project' | 'task';
    onUploadSuccess?: () => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ relationId, relationType, onUploadSuccess }) => {
    const [uploadFile] = useMutation(UPLOAD_FILE);
    const [uploading, setUploading] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            // console.log('file', {
            //     file,
            //     relationId,
            //     relationType,
            // });
            await uploadFile({
                variables: {
                    file,
                    relationId,
                    relationType,
                },
            });
            if (onUploadSuccess) onUploadSuccess();
        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Failed to upload file');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="file-upload">
            <h3>Attachments</h3>
            <input type="file" onChange={handleFileChange} disabled={uploading} />
            {uploading && <span>Uploading...</span>}
        </div>
    );
};
