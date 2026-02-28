import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { auth, db } from '../services/firebase';
import { onAuthStateChanged, User as FirebaseUser, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { User, UserRole } from '../types/firebase';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  isLoading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRoleState] = useState<UserRole>('guest');
  const [isLoading, setIsLoading] = useState(true);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setIsLoading(true);
      setFirestoreError(null);
      
      if (firebaseUser) {
        try {
          // Try to get user role from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            setUser({ ...userData, id: firebaseUser.uid });
            setRoleState(userData.role);
          } else {
            // Default role for new users if not set
            // For testing purposes, if the email is admin@irisagenda.com, make them an admin
            const isFirstAdmin = firebaseUser.email === 'admin@irisagenda.com';
            const newUser: User = {
              id: firebaseUser.uid,
              name: isFirstAdmin ? 'Administrador Geral' : (firebaseUser.displayName || 'Usuário'),
              email: firebaseUser.email || '',
              role: isFirstAdmin ? 'admin' : 'empresa' // Defaulting to empresa for this demo
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
            setUser(newUser);
            setRoleState(newUser.role);
          }
        } catch (error: any) {
          console.error("Firestore Error:", error);
          if (error.code === 'permission-denied') {
             setFirestoreError("Acesso Negado. O banco de dados não permite leitura. Verifique as Regras de Segurança no Firebase Console.");
          } else if (error.message && error.message.includes("offline")) {
            setFirestoreError("Erro de Conexão. Verifique sua internet.");
          } else {
             setFirestoreError("Erro ao acessar o banco de dados: " + error.message);
          }
        }
      } else {
        setUser(null);
        setRoleState('guest');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (firestoreError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 p-8">
        <div className="max-w-md bg-white p-8 rounded-3xl shadow-xl border border-red-100 text-center">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <h2 className="text-2xl font-bold text-red-900 mb-4">Erro de Conexão</h2>
          <p className="text-red-700 mb-6 whitespace-pre-line">{firestoreError}</p>
          
          <div className="bg-zinc-50 p-4 rounded-xl text-left text-sm text-zinc-600 mb-6 border border-zinc-200">
            <p className="font-bold mb-2">Tentativas de solução:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Verifique se o Firestore Database foi criado no modo <strong>Test Mode</strong>.</li>
              <li>Tente limpar o cache do navegador.</li>
              <li>Se estiver usando bloqueadores de anúncios ou VPN, tente desativá-los.</li>
            </ul>
          </div>
          
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-all"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, role, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
