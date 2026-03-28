import React, { useState, useEffect, createContext, useContext } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

interface UserData {
  uid: string;
  id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  class?: string;
  photoURL?: string;
  phoneNumber?: string;
  address?: string;
}

interface AuthContextType {
  user: FirebaseUser | null;
  userData: UserData | null;
  loading: boolean;
  isAuthReady: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  isAuthReady: false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setUserData({ ...userDoc.data(), uid: userDoc.id } as UserData);
        } else {
          // Check if it's the default admin
          if (firebaseUser.email === 'bettiahmart1@gmail.com') {
             const defaultAdmin: UserData = {
               uid: firebaseUser.uid,
               id: 'ADMIN001',
               name: firebaseUser.displayName || 'Super Admin',
               email: firebaseUser.email,
               role: 'admin',
               createdAt: new Date().toISOString(),
             } as any;
             await setDoc(doc(db, 'users', firebaseUser.uid), defaultAdmin);
             setUserData(defaultAdmin);
          } else {
            setUserData(null);
          }
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
      setIsAuthReady(true);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, userData, loading, isAuthReady }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
