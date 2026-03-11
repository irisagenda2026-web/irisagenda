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
    
    if (!text) {
      throw new Error(`O servidor retornou uma resposta vazia (${response.status}). Verifique se o backend está configurado corretamente.`);
    }

    if (contentType && contentType.includes('application/json')) {
      try {
        const data = JSON.parse(text);
        if (!response.ok) {
          throw new Error(data.error || `Erro no servidor (${response.status}): O servidor recusou o upload.`);
        }
        return data.url as string;
      } catch (e) {
        throw new Error(`Erro ao processar resposta do servidor: A resposta não é um JSON válido. Conteúdo recebido: ${text.substring(0, 200)}`);
      }
    } else {
      if (!response.ok) {
        if (text.includes('<!DOCTYPE html>') || text.includes('<html>')) {
          throw new Error(`Erro no servidor (${response.status}): A rota de upload não foi encontrada (404) ou o servidor falhou (500). Certifique-se de que você fez o deploy das funções de API no Vercel.`);
        }
        throw new Error(`Erro no servidor (${response.status}): ${text.substring(0, 100)}`);
      }
      throw new Error('Resposta do servidor não é um JSON válido. Verifique a configuração das rotas no Vercel.');
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
