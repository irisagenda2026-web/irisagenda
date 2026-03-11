import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';

export const uploadImage = async (path: string, file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('path', path);

  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro no upload via servidor');
    }

    const data = await response.json();
    return data.url as string;
  } catch (error: any) {
    console.error('Upload Proxy Error:', error);
    throw error;
  }
};

export const deleteImage = async (path: string) => {
  const storageRef = ref(storage, path);
  await deleteObject(storageRef);
};
