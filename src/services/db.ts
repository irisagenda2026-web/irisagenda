import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs,
  addDoc,
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { Empresa, Servico, Agendamento, Bloqueio, Review, User, PlatformSettings, Profissional, AvailabilityOverride } from '../types/firebase';

// Platform Settings
export const getPlatformSettings = async () => {
  const docRef = doc(db, 'platform', 'settings');
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? (docSnap.data() as PlatformSettings) : null;
};

export const updatePlatformSettings = async (data: Partial<PlatformSettings>) => {
  const docRef = doc(db, 'platform', 'settings');
  await setDoc(docRef, data, { merge: true });
};

// Users
export const getAllUsers = async () => {
  const q = query(collection(db, 'users'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
};

export const updateUser = async (id: string, data: Partial<User>) => {
  const docRef = doc(db, 'users', id);
  await updateDoc(docRef, data);
};

// Empresas
export const getEmpresa = async (id: string) => {
  const docRef = doc(db, 'empresas', id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? (docSnap.data() as Empresa) : null;
};

export const getEmpresaBySlug = async (slug: string) => {
  const q = query(collection(db, 'empresas'), where('slug', '==', slug));
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) return null;
  const doc = querySnapshot.docs[0];
  return { id: doc.id, ...doc.data() } as Empresa;
};

export const updateEmpresa = async (id: string, data: Partial<Empresa>) => {
  const docRef = doc(db, 'empresas', id);
  await updateDoc(docRef, data);
};

export const createEmpresa = async (id: string, data: Omit<Empresa, 'id' | 'createdAt'>) => {
  const docRef = doc(db, 'empresas', id);
  await setDoc(docRef, {
    ...data,
    id,
    createdAt: Date.now(),
  });
};

export const getAllEmpresas = async () => {
  const q = query(collection(db, 'empresas'), orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Empresa));
};

// Servicos
export const getServicos = async (empresaId: string) => {
  const q = query(collection(db, 'servicos'), where('empresaId', '==', empresaId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Servico));
};

export const addServico = async (data: Omit<Servico, 'id'>) => {
  return await addDoc(collection(db, 'servicos'), data);
};

export const updateServico = async (id: string, data: Partial<Servico>) => {
  const docRef = doc(db, 'servicos', id);
  await updateDoc(docRef, data);
};

export const deleteServico = async (id: string) => {
  const { deleteDoc } = await import('firebase/firestore');
  await deleteDoc(doc(db, 'servicos', id));
};

// Agendamentos
export const getAgendamentos = async (empresaId: string, dateStart: number, dateEnd: number) => {
  // OPTIMIZATION: We fetch by empresaId and filter dates on client-side 
  // to avoid requiring a composite index during development.
  const q = query(
    collection(db, 'agendamentos'), 
    where('empresaId', '==', empresaId)
  );
  const querySnapshot = await getDocs(q);
  const allAgendamentos = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Agendamento));
  
  return allAgendamentos.filter(a => a.startTime >= dateStart && a.startTime <= dateEnd);
};

export const getAllAgendamentos = async (empresaId: string) => {
  const q = query(
    collection(db, 'agendamentos'), 
    where('empresaId', '==', empresaId)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Agendamento));
};

export const createAgendamento = async (data: Omit<Agendamento, 'id' | 'createdAt'>) => {
  return await addDoc(collection(db, 'agendamentos'), {
    ...data,
    createdAt: Date.now(),
  });
};

export const updateAgendamentoStatus = async (id: string, status: Agendamento['status']) => {
  const docRef = doc(db, 'agendamentos', id);
  await updateDoc(docRef, { status });
};

// Reviews
export const getReviews = async (empresaId: string) => {
  // OPTIMIZATION: Client-side sort to avoid index requirement
  const q = query(
    collection(db, 'reviews'), 
    where('empresaId', '==', empresaId)
  );
  const querySnapshot = await getDocs(q);
  const reviews = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
  
  return reviews.sort((a, b) => b.createdAt - a.createdAt);
};

export const addReview = async (data: Omit<Review, 'id' | 'createdAt'>) => {
  return await addDoc(collection(db, 'reviews'), {
    ...data,
    createdAt: Date.now(),
  });
};

// Bloqueios
export const getBloqueios = async (empresaId: string, dateStart: number, dateEnd: number) => {
  // OPTIMIZATION: Client-side filtering to avoid index requirement
  const q = query(
    collection(db, 'bloqueios'), 
    where('empresaId', '==', empresaId)
  );
  const querySnapshot = await getDocs(q);
  const allBloqueios = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Bloqueio));
  
  return allBloqueios.filter(b => b.startTime >= dateStart && b.startTime <= dateEnd);
};

export const createBloqueio = async (data: Omit<Bloqueio, 'id' | 'createdAt'>) => {
  return await addDoc(collection(db, 'bloqueios'), {
    ...data,
    createdAt: Date.now(),
  });
};

export const deleteBloqueio = async (id: string) => {
  const { deleteDoc } = await import('firebase/firestore');
  await deleteDoc(doc(db, 'bloqueios', id));
};

// Profissionais
export const getProfissionais = async (empresaId: string) => {
  const q = query(collection(db, 'profissionais'), where('empresaId', '==', empresaId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Profissional));
};

export const addProfissional = async (data: Omit<Profissional, 'id' | 'createdAt'>) => {
  return await addDoc(collection(db, 'profissionais'), {
    ...data,
    createdAt: Date.now(),
  });
};

export const updateProfissional = async (id: string, data: Partial<Profissional>) => {
  const docRef = doc(db, 'profissionais', id);
  await updateDoc(docRef, data);
};

export const deleteProfissional = async (id: string) => {
  const { deleteDoc } = await import('firebase/firestore');
  await deleteDoc(doc(db, 'profissionais', id));
};

// Horários de Expediente
export const saveBusinessHours = async (empresaId: string, hours: any) => {
  const docRef = doc(db, 'businessHours', empresaId);
  await setDoc(docRef, { hours, updatedAt: Date.now() });
};

export const getBusinessHours = async (empresaId: string) => {
  const docRef = doc(db, 'businessHours', empresaId);
  const snap = await getDoc(docRef);
  return snap.exists() ? snap.data().hours : null;
};

// Availability Overrides
export const getAvailabilityOverrides = async (empresaId: string, month: string) => {
  // month format: YYYY-MM
  const q = query(
    collection(db, 'availabilityOverrides'),
    where('empresaId', '==', empresaId),
    where('date', '>=', `${month}-01`),
    where('date', '<=', `${month}-31`)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AvailabilityOverride));
};

export const saveAvailabilityOverride = async (data: Omit<AvailabilityOverride, 'id' | 'updatedAt'>) => {
  const id = `${data.empresaId}_${data.date}`;
  const docRef = doc(db, 'availabilityOverrides', id);
  await setDoc(docRef, {
    ...data,
    id,
    updatedAt: Date.now()
  });
};

export const bulkSaveAvailability = async (empresaId: string, dates: string[], config: Omit<AvailabilityOverride, 'id' | 'empresaId' | 'date' | 'updatedAt'>) => {
  const { writeBatch } = await import('firebase/firestore');
  const batch = writeBatch(db);
  
  dates.forEach(date => {
    const id = `${empresaId}_${date}`;
    const docRef = doc(db, 'availabilityOverrides', id);
    batch.set(docRef, {
      ...config,
      id,
      empresaId,
      date,
      updatedAt: Date.now()
    });
  });
  
  await batch.commit();
};
