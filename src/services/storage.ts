import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';

export const uploadImage = async (path: string, file: File) => {
  const storageRef = ref(storage, path);
  
  // Create a timeout promise
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Timeout: O upload está demorando muito. Verifique sua conexão ou as configurações de CORS.')), 15000)
  );

  try {
    const uploadPromise = (async () => {
      const snapshot = await uploadBytes(storageRef, file);
      return await getDownloadURL(snapshot.ref);
    })();

    // Race between upload and timeout
    return await Promise.race([uploadPromise, timeoutPromise]) as string;
  } catch (error) {
    throw error;
  }
};

export const deleteImage = async (path: string) => {
  const storageRef = ref(storage, path);
  await deleteObject(storageRef);
};
