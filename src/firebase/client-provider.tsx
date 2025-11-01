
'use client';

import { useState, useEffect, type PropsWithChildren } from 'react';
import { FirebaseProvider } from './provider';

export function FirebaseClientProvider({ children }: PropsWithChildren) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; 
  }

  return <FirebaseProvider>{children}</FirebaseProvider>;
}
