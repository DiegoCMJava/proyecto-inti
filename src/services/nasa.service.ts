import type { SolarFlareEvent } from "@/types/solar";

const NASA_API_BASE = "https://ccmc.gsfc.nasa.gov/DONKI-API/get/FLR";
const API_KEY = import.meta.env.VITE_NASA_API_KEY || "DEMO_KEY";

if (API_KEY === "DEMO_KEY") {
  console.warn(
    "[Proyecto Inti] Advertencia: Se está utilizando la 'DEMO_KEY' de la NASA. " +
    "El límite de peticiones es de 30/hora. Configura VITE_NASA_API_KEY en tu archivo .env.local."
  );
}

/**
 * @param startDate - Fecha inicial en formato YYYY-MM-DD
 * @param endDate - Fecha final en formato YYYY-MM-DD
 */
export async function fetchSolarFlares(
  startDate: string,
  endDate: string
): Promise<SolarFlareEvent[]> {
  const url = `${NASA_API_BASE}?startDate=${startDate}&endDate=${endDate}&api_key=${API_KEY}`;
  const response = await fetch(url);

  if (!response.ok){
    if(response.status === 429){
      throw new Error (
        "Se ha excedido la cuota de peticiones a la API de la NASA (HTTP 429). Configura tu propia VITE_NASA_API_KEY en el archivo .env."
      );
    }
    throw new Error (
      `Error en la API DONKI de la NASA: ${response.status} ${response.statusText}`
    );
  }
  const data = (await response.json()) as SolarFlareEvent[] | null;
  return Array.isArray(data) ? data : []; 
}

/**
 * @param year - Año calendario (ej. 2026)
 * @param monthIndex - Índice del mes (0 = Enero, 11 = Diciembre)
 */
export function getMonthDateRange(
  year: number,
  monthIndex: number
): { startDate: string; endDate: string } {
  const start = new Date(Date.UTC(year, monthIndex, 1));
  const end = new Date(Date.UTC(year, monthIndex + 1, 0));
  return {
    startDate: start.toISOString().split("T")[0],
    endDate: end.toISOString().split("T")[0],
  };
}