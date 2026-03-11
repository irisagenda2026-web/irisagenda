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

    const contentType = response.headers.get('content-type');
    const text = await response.text();
    
    if (!text || text.trim() === '') {
      throw new Error(`O servidor retornou uma resposta vazia (${response.status}).`);
    }

    if (contentType && contentType.includes('application/json')) {
      try {
        const data = JSON.parse(text.trim());
        if (!response.ok) {
          throw new Error(data.error || `Erro no servidor (${response.status})`);
        }
        return data.url as string;
      } catch (e) {
        console.error('JSON Parse Error:', e, 'Text:', text);
        throw new Error(`Erro ao processar resposta do servidor. Resposta: ${text.substring(0, 100)}`);
      }
    } else {
      if (!response.ok) {
        if (text.includes('<!DOCTYPE html>') || text.includes('<html>')) {
          throw new Error(`Erro no servidor (${response.status}): Rota não encontrada ou erro interno.`);
        }
        throw new Error(`Erro no servidor (${response.status}): ${text.substring(0, 100)}`);
      }
      throw new Error('Resposta do servidor não é JSON.');
    }
  } catch (error: any) {
    console.error('Upload Proxy Error:', error);
    throw error;
  }
};

export const deleteImage = async (path: string) => {
  const storageRef = ref(storage, path);
  await deleteObject(storageRef);
};
