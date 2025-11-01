
'use client';

import { useEffect, useState } from 'react';
import {
  onSnapshot,
  type DocumentReference,
  type DocumentData,
} from 'firebase/firestore';

export function useDoc<T = DocumentData>(
  ref: DocumentReference<T> | null
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (ref === null) {
      setData(null);
      setLoading(false);
      return;
    }
    // The ref is not null, so we can assume it's a DocumentReference<T>
    // and we should start loading.
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
