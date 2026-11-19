import type { MonthlyFlareCache } from "@/types/solar";

const DB_NAME = "SolarFlareDB";
const DB_VERSION = 1;
const STORE_NAME = "flares";

function openDB(): Promise<IDBDatabase>{
    return new Promise((resolve, reject) => {
      if(typeof window === "undefined" || !window.indexedDB){
        reject(new Error("IndexedDB no está disponible en este entorno."));
        return;
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)){
            db.createObjectStore(STORE_NAME);
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error("Error al abrir la base de datos IndexedDB."));
    });
}

/**
 * @param rangeKey - Clave del rango con formato 'YYYY-MM-DD_YYYY-MM-DD'
 */

export async function loadRangeCache(rangeKey: string): Promise<MonthlyFlareCache | null> {
try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(rangeKey);
        
        request.onsuccess = () => {
            resolve((request.result as MonthlyFlareCache) || null)
       
        };
         request.onerror = () => {
            reject(request.error ?? new Error("Error al leer el caché en IndexedDB."))
        };
    });
} catch (error) {
    console.warn("[IndexedDB] Error al recuperar caché: ", error);
    return null;
}
}

/**
 * @param rangeKey - Clave del rango con formato 'YYYY-MM-DD_YYYY-MM-DD'
 * @param cacheData - Objeto MonthlyFlareCache con flareDates, data y timestamp
 */
export async function saveRangeCache(
    rangeKey: string,
    cacheData: MonthlyFlareCache
): Promise<void> {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, "readwrite");
            const store = transaction.objectStore(STORE_NAME);
            const request = store.put(cacheData, rangeKey);

            request.onsuccess = () => resolve();
            request.onerror = () => {
                reject(request.error ?? new Error("Error al persistir en IndexedDB"));

            };

        });
    } catch (error){
        console.warn("[IndexedDB] No se pudo persistir en caché:", error);
    }
}