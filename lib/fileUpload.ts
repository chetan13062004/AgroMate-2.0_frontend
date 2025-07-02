import { apiRequest } from './api';

export interface UploadedFile {
  url: string;
  public_id: string;
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
  fieldname: string;
  encoding: string;
  path?: string;
}

interface UploadResponse {
  file: UploadedFile;
}

interface MultipleUploadResponse {
  files: UploadedFile[];
}

export const uploadFile = async (file: File): Promise<UploadedFile> => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await apiRequest<UploadResponse>('/api/upload', 'POST', formData, localStorage.getItem('token') || '');
    
    if (response.error) {
      throw new Error(typeof response.error === 'string' ? response.error : 'Failed to upload file');
    }

    if (!response.data?.file) {
      throw new Error('Invalid response format from server');
    }

    return response.data.file;
  } catch (error) {
    console.error('Upload error:', error);
    throw error instanceof Error ? error : new Error('Failed to upload file');
  }
};

export const uploadMultipleFiles = async (files: File[]): Promise<UploadedFile[]> => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file);
  });

  try {
    const response = await apiRequest<MultipleUploadResponse>(
      '/api/upload/multiple', 
      'POST', 
      formData, 
      localStorage.getItem('token') || ''
    );
    
    if (response.error) {
      throw new Error(typeof response.error === 'string' ? response.error : 'Failed to upload files');
    }

    if (!response.data?.files) {
      throw new Error('Invalid response format from server');
    }

    return response.data.files;
  } catch (error) {
    console.error('Multiple upload error:', error);
    throw error instanceof Error ? error : new Error('Failed to upload files');
  }
};

export const deleteFile = async (publicId: string): Promise<void> => {
  try {
    const response = await apiRequest<void>(
      `/api/upload/${publicId}`,
      'DELETE',
      undefined,
      localStorage.getItem('token') || ''
    );

    if (response.error) {
      throw new Error(typeof response.error === 'string' ? response.error : 'Failed to delete file');
    }
  } catch (error) {
    console.error('Delete file error:', error);
    throw error instanceof Error ? error : new Error('Failed to delete file');
  }
};

// Helper function to get Cloudinary image URL with transformations
export const getCloudinaryImageUrl = (
  publicId: string, 
  options: {
    width?: number;
    height?: number;
    quality?: number;
    crop?: 'fill' | 'fit' | 'limit' | 'pad' | 'scale' | 'crop' | 'thumb';
    gravity?: 'face' | 'center' | 'north' | 'south' | 'east' | 'west' | 'auto';
    format?: 'webp' | 'jpg' | 'png' | 'avif';
  } = {}
): string => {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloudName) {
    console.warn('Cloudinary cloud name is not set');
    return '';
  }

  const transformations = [];
  
  if (options.width) transformations.push(`w_${options.width}`);
  if (options.height) transformations.push(`h_${options.height}`);
  if (options.quality) transformations.push(`q_${options.quality}`);
  if (options.crop) transformations.push(`c_${options.crop}`);
  if (options.gravity) transformations.push(`g_${options.gravity}`);
  
  // Default to auto format for modern browsers
  const format = options.format || 'auto';
  
  const baseUrl = `https://res.cloudinary.com/${cloudName}/image/upload`;
  const transformationString = transformations.length > 0 ? `${transformations.join(',')}/` : '';
  
  return `${baseUrl}/${transformationString}f_${format}/${publicId}`;
};
