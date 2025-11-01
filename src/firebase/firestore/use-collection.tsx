
'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  onSnapshot,
  collection,
  query,
  where,
  orderBy,
  limit,
  type Query,
  type QueryConstraint,
  type DocumentData,
  type CollectionReference,
} from 'firebase/firestore';
import { useFirestore } from '@/firebase';

// A utility hook to memoize the Firestore query.
// This is important to prevent re-creating the query on every render,
// which would cause an infinite loop in the `useEffect` of `useCollection`.
export function useMemoizedQuery<T = DocumentData>(
  path: string,
  constraints: QueryConstraint[] = []
) {
  const firestore = useFirestore();

  const q = useMemo(() => {
    if (!firestore) return null;
    const ref = collection(firestore, path) as CollectionReference<T>;
    return query(ref, ...constraints);
  }, [firestore, path, constraints]); // Note: constraints need to be stable

  return q;
}

export function useCollection<T = DocumentData>(
  query: Query<T> | null
) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!query) {
      setLoading(false);
      // You might want to set data to null or an initial state here
      return;
    }

    setLoading(true);

    const unsubscribe = onSnapshot(
      query,
      (snapshot) => {
        const docs = snapshot.docs.map(
          (doc) => ({ ...doc.data(), id: doc.id }) as T
        );
        setData(docs);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching collection:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [query]); // Effect dependencies only include the memoized query

  return { data, loading, error };
}
