import { getAttachmentUrl } from '../../../config/api';

export const useAttachments = () => {
  const handlePreviewFile = async (file: any) => {
    try {
      const response = await fetch(getAttachmentUrl(file.id), {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to fetch file');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error previewing file:', error);
      alert('Failed to preview file');
    }
  };

  const handleDownloadFile = async (file: any) => {
    try {
      const response = await fetch(getAttachmentUrl(file.id, true), {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to fetch file');

      const blob = await response.blob();
      const downloadBlob = new Blob([blob], {
        type: 'application/octet-stream',
      });
      const url = window.URL.createObjectURL(downloadBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file');
    }
  };

  return {
    handlePreviewFile,
    handleDownloadFile,
  };
};
