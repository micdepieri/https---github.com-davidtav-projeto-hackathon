
'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  onSnapshot,
  doc,
  type DocumentReference,
  type DocumentData,
} from 'firebase/firestore';
import { useFirestore } from '@/firebase';

// A utility hook to memoize the Firestore document reference.
// This is important to prevent re-creating the reference on every render,
// which would cause an infinite loop in the `useEffect` of `useDoc`.
export function useMemoizedDocRef<T = DocumentData>(path: string) {
  const firestore = useFirestore();

  const ref = useMemo(
    () => (firestore ? (doc(firestore, path) as DocumentReference<T>) : null),
    [firestore, path]
  );

  return ref;
}

export function useDoc<T = DocumentData>(
  ref: DocumentReference<T> | null
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!ref) {
      setLoading(false);
      // You might want to set data to null or an initial state here
      return;
    }

    setLoading(true);

    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        if (snapshot.exists()) {
          setData({ ...snapshot.data(), id: snapshot.id } as T);
        } else {
          setData(null); // Document does not exist
        }
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching document:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [ref]); // Effect dependencies only include the memoized ref

  return { data, loading, error };
}
