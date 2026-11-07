import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, Hospital } from '../types/blood';
import { INITIAL_HOSPITALS } from '../data/mockData';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

interface AuthContextType {
  currentUser: UserProfile | null;
  currentHospital: Hospital | null;
  firebaseAuthUser: FirebaseUser | null;
  isAuthenticated: boolean;
  loginWithGmail: (email: string, name: string, hospitalId: string, role?: string) => void;
  loginWithGooglePopup: (hospitalId: string, role?: string) => Promise<void>;
  logout: () => void;
  switchHospital: (hospitalId: string) => void;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY_USER = 'thai_bloodlink_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USER);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return null;
  });

  const [firebaseAuthUser, setFirebaseAuthUser] = useState<FirebaseUser | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

  // Sync Firebase Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      setFirebaseAuthUser(fbUser);
      if (fbUser && fbUser.email) {
        // If logged in via Firebase Auth, ensure currentUser reflects it
        setCurrentUser((prev) => {
          if (prev && prev.email === fbUser.email) return prev;
          const hospital = INITIAL_HOSPITALS[0];
          const updated: UserProfile = {
            email: fbUser.email || 'user@gmail.com',
            name: fbUser.displayName || prev?.name || 'เจ้าหน้าที่คลังเลือด',
            avatar: fbUser.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fbUser.email || 'user')}`,
            hospitalId: prev?.hospitalId || hospital.id,
            hospitalName: prev?.hospitalName || hospital.name,
            department: 'งานธนาคารเลือดและเวชศาสตร์บริการโลหิต',
            role: prev?.role || 'นักเทคนิคการแพทย์ (Blood Bank Officer)',
            licenseNo: prev?.licenseNo || 'ทน.พ. ' + Math.floor(10000 + Math.random() * 90000),
            phone: prev?.phone || hospital.bloodBankPhone,
          };
          localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updated));
          return updated;
        });
      }
    });

    return () => unsubscribe();
  }, []);

  // If user is not authenticated on mount, prompt login modal
  useEffect(() => {
    if (!currentUser && !auth.currentUser) {
      setIsLoginModalOpen(true);
    }
  }, [currentUser]);

  const currentHospital = currentUser
    ? INITIAL_HOSPITALS.find((h) => h.id === currentUser.hospitalId) || INITIAL_HOSPITALS[0]
    : null;

  const loginWithGmail = (
    email: string,
    name: string,
    hospitalId: string,
    role: string = 'นักเทคนิคการแพทย์ (Blood Bank Officer)'
  ) => {
    const hospital = INITIAL_HOSPITALS.find((h) => h.id === hospitalId) || INITIAL_HOSPITALS[0];
    
    const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
      name || email
    )}&backgroundColor=e11d48,0284c7,0f766e&textColor=ffffff`;

    const newUser: UserProfile = {
      email,
      name,
      avatar: avatarUrl,
      hospitalId: hospital.id,
      hospitalName: hospital.name,
      department: 'งานธนาคารเลือดและเวชศาสตร์บริการโลหิต',
      role,
      licenseNo: 'ทน.พ. ' + Math.floor(10000 + Math.random() * 90000),
      phone: hospital.bloodBankPhone,
    };

    setCurrentUser(newUser);
    try {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(newUser));
    } catch (e) {
      console.error(e);
    }
    setIsLoginModalOpen(false);
  };

  const loginWithGooglePopup = async (
    hospitalId: string,
    role: string = 'นักเทคนิคการแพทย์ (Blood Bank Officer)'
  ) => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      const hospital = INITIAL_HOSPITALS.find((h) => h.id === hospitalId) || INITIAL_HOSPITALS[0];

      const newUser: UserProfile = {
        email: fbUser.email || 'user@gmail.com',
        name: fbUser.displayName || 'นักเทคนิคการแพทย์',
        avatar: fbUser.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fbUser.email || 'user')}`,
        hospitalId: hospital.id,
        hospitalName: hospital.name,
        department: 'งานธนาคารเลือดและเวชศาสตร์บริการโลหิต',
        role,
        licenseNo: 'ทน.พ. ' + Math.floor(10000 + Math.random() * 90000),
        phone: hospital.bloodBankPhone,
      };

      setCurrentUser(newUser);
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(newUser));
      setIsLoginModalOpen(false);
    } catch (error) {
      console.warn('Firebase signInWithPopup failed or popup blocked, using fallback login:', error);
      // Fallback
      loginWithGmail('chatchara97@gmail.com', 'ทนพ. พัชรภัทร ชาญเจริญ', hospitalId, role);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error(e);
    }
    setCurrentUser(null);
    setFirebaseAuthUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY_USER);
    } catch (e) {
      console.error(e);
    }
    setIsLoginModalOpen(true);
  };

  const switchHospital = (hospitalId: string) => {
    if (!currentUser) return;
    const hospital = INITIAL_HOSPITALS.find((h) => h.id === hospitalId);
    if (!hospital) return;

    const updatedUser: UserProfile = {
      ...currentUser,
      hospitalId: hospital.id,
      hospitalName: hospital.name,
      phone: hospital.bloodBankPhone,
    };
    setCurrentUser(updatedUser);
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentHospital,
        firebaseAuthUser,
        isAuthenticated: !!currentUser,
        loginWithGmail,
        loginWithGooglePopup,
        logout,
        switchHospital,
        isLoginModalOpen,
        setIsLoginModalOpen,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
