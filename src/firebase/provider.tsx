
'use client';

import {
  createContext,
  useContext,
  useMemo,
  type PropsWithChildren,
} from 'react';
import { initializeFirebase } from './index';
import type { Auth } from 'firebase/auth';
import type { FirebaseApp } from 'firebase/app';
import type { Firestore } from 'firebase/firestore';

type Firebase = {
  app: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
};

const FirebaseContext = createContext<Firebase | undefined>(undefined);

export function FirebaseProvider({ children }: PropsWithChildren) {
  const firebase = useMemo(initializeFirebase, []);

  return (
    <FirebaseContext.Provider value={firebase}>
      {children}
    </FirebaseContext.Provider>
  );
}

export const useFirebase = () => {
  return useContext(FirebaseContext);
};

export const useFirebaseApp = () => {
  return useFirebase()?.app;
};

export const useAuth = () => {
  return useFirebase()?.auth;
};

export const useFirestore = () => {
  return useFirebase()?.firestore;
};
