import React, { useState, useEffect, useCallback, useRef } from 'react';

const DB_NAME = 'StarPrestasiAppDB';
const STORE_NAME = 'keyval';
const DB_VERSION = 1;

export function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

export async function idbGet(key: string): Promise<any> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn(`idbGet error for ${key}:`, err);
    return null;
  }
}

export async function idbSet(key: string, value: any): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(value, key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn(`idbSet error for ${key}:`, err);
  }
}

// Hanya simpan state penting di localStorage untuk menghindari QuotaExceededError (batas 5MB)
const USE_LS_KEYS = new Set(['star_auth_user']);

function useLocalStorage<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const readValue = useCallback((): T => {
    if (!USE_LS_KEYS.has(key)) return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      const parsed = item ? JSON.parse(item) : initialValue;
      if (parsed === null && initialValue !== null) return initialValue;
      if (Array.isArray(initialValue) && !Array.isArray(parsed)) return initialValue;
      return parsed;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  }, [initialValue, key]);

  const [storedValue, setStoredValueState] = useState<T>(readValue);
  const [isInitialized, setIsInitialized] = useState(false);
  const isManuallySet = React.useRef(false);
  const isExternalUpdate = React.useRef(false);
  const instanceId = React.useRef(Math.random().toString(36).substring(7));

  const setStoredValue = useCallback((value: React.SetStateAction<T>) => {
    isManuallySet.current = true;
    setStoredValueState(value);
  }, []);

  useEffect(() => {
    let isMounted = true;
    idbGet(key).then(val => {
      if (isMounted) {
        if (isManuallySet.current) {
            setIsInitialized(true);
            return;
        }

        let finalVal = val;
        if (val === undefined || val === null) {
            if (initialValue !== null) finalVal = initialValue;
        } else if (Array.isArray(initialValue) && !Array.isArray(val)) {
            finalVal = initialValue;
        }
        
        if (finalVal !== undefined && finalVal !== null) {
          setStoredValueState(finalVal);
        } else if (finalVal === null && initialValue === null) {
          setStoredValueState(finalVal);
        }
        setIsInitialized(true);
      }
    });
    return () => { isMounted = false; };
  }, [key]);

  useEffect(() => {
    if (!isInitialized) return;
      if (isExternalUpdate.current) {
          isExternalUpdate.current = false;
          return;
      }
      if (USE_LS_KEYS.has(key)) {
        try {
          window.localStorage.setItem(key, JSON.stringify(storedValue));
        } catch (error) {
          console.warn(`Error setting localStorage key "${key}":`, error);
        }
      }
      
      // Await idbSet to prevent race condition where idbGet reads old value
      idbSet(key, storedValue).then(() => {
        // Notify other components using the same key
        window.dispatchEvent(new CustomEvent('local-storage-update', { detail: { key, value: storedValue, sourceId: instanceId.current } }));
        
        // Auto-sync trigger
        window.dispatchEvent(new CustomEvent('sync-to-cloud', { detail: { key, value: storedValue } }));
      });
    }, [key, storedValue, isInitialized]);

  useEffect(() => {
    const handleStorageChange = async (e: StorageEvent | CustomEvent) => {
      if (e instanceof StorageEvent && e.key !== key) return;
      if (e instanceof CustomEvent && e.detail?.key && e.detail.key !== key) return;
      if (e instanceof CustomEvent && e.detail?.sourceId === instanceId.current) return;
      
      let newValue: any = null;
      if (e instanceof CustomEvent && e.detail && 'value' in e.detail) {
          newValue = e.detail.value;
      } else {
          const idbVal = await idbGet(key);
          if (idbVal !== null && idbVal !== undefined) {
              newValue = idbVal;
          } else {
              newValue = readValue();
          }
      }
      
      setStoredValueState((prev) => {
          if (prev === newValue) return prev;
          isExternalUpdate.current = true;
          return newValue;
      });
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('local-storage-update', handleStorageChange as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('local-storage-update', handleStorageChange as EventListener);
    };
  }, [key, readValue]);

  return [storedValue, setStoredValue];
}

export default useLocalStorage;
