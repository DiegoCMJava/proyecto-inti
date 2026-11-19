import  { createContext, useContext, useReducer, useCallback, useRef, type ReactNode} from "react";
import type { SolarFlareEvent } from "@/types/solar";
import { fetchSolarFlares, getMonthDateRange } from "@/services/nasa.service";
import { loadRangeCache, saveRangeCache } from "@/services/db.service";


interface SolarState {
    selectedDate: string;
    selectedFlare: SolarFlareEvent | null;
    eventsByDate: Map<string, SolarFlareEvent[]>;
    loadedMonths: Set<string>;
    isLoading: boolean;
    errorMessage: string | null;
}

type SolarAction =
 | { type: "SET_DATE"; payload: string }
 | { type: "SET_FLARE"; payload: SolarFlareEvent | null }
 | { type: "SET_LOADING"; payload: boolean }
 | { type: "SET_ERROR"; payload: string | null }
 | { type: "MERGE_EVENTS"; payload: { monthKey: string; events: SolarFlareEvent[]}};

 const initialState: SolarState = {
    selectedDate: new Date().toISOString().split("T")[0],
    selectedFlare: null,
    eventsByDate: new Map(),
    loadedMonths: new Set(),
    isLoading: false,
    errorMessage: null,
 };

 function solarReducer(state: SolarState, action: SolarAction): SolarState {
    switch (action.type) {
        case "SET_DATE":
            return { ...state, selectedDate: action.payload };
        case "SET_FLARE":
            return { ...state, selectedFlare: action.payload };
        case "SET_LOADING":
            return { ...state, isLoading: action.payload };
        case "SET_ERROR":
            return { ...state, errorMessage: action.payload };
        case "MERGE_EVENTS": {
            const nextMap = new Map(state.eventsByDate);
            for (const ev of action.payload.events ){
                if(!ev.beginTime) continue;
                const dateStr = ev.beginTime.split("T")[0];
                const list = nextMap.get(dateStr) ?? [];
                if(!list.some((e) => e.flrID === ev.flrID)) list.push(ev);
                nextMap.set(dateStr, list);
            }
            const nextMonths = new Set(state.loadedMonths);
            nextMonths.add(action.payload.monthKey);
            return { ...state, eventsByDate: nextMap, loadedMonths: nextMonths };
        }
    
        default:
            return state;
    }
 }

 interface SolarContextValue {
    state: SolarState;
    flaresOfSelectedDate: SolarFlareEvent[];
    setSelectedDate: (date: string) => void;
    setSelectedFlare: (flare: SolarFlareEvent | null) => void;
    loadMonthEvents: (year: number, monthIndex: number ) => Promise<void>;
 }

 const SolarContext = createContext<SolarContextValue | null>(null);

 export function SolarProvider({ children }: { children: ReactNode }) {
    const [state, dispatch ] = useReducer(solarReducer, initialState);

    const stateRef = useRef(state);
    stateRef.current = state;

    const flaresOfSelectedDate = state.eventsByDate.get(state.selectedDate) ?? [];

    const setSelectedDate = useCallback((date: string) => {
        dispatch({ type: "SET_DATE", payload: date });
    }, []);

    const setSelectedFlare = useCallback((flare: SolarFlareEvent | null ) => {
        dispatch({ type: "SET_FLARE", payload: flare});
    }, []);

    const loadMonthEvents = useCallback(
        async (year: number, monthIndex: number) => {
            const monthKey = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
            if (stateRef.current.loadedMonths.has(monthKey)) return;

            const { startDate, endDate } = getMonthDateRange(year, monthIndex);
            const rangeKey = `${startDate}_${endDate}`;

            dispatch({ type: "SET_LOADING", payload: true });
            dispatch({ type: "SET_ERROR", payload: null});

            try {
                const cached = await loadRangeCache(rangeKey);
                let flareData: SolarFlareEvent[];

                if (cached) {
                    flareData = cached.data;
                } else {
                    flareData = await fetchSolarFlares(startDate, endDate);
                    const flareDates = [
                        ...new Set(flareData.map((ev) => ev.beginTime?.split("T")[0]).filter(Boolean)),
                    ] as string[];
                    await saveRangeCache(rangeKey, { flareDates, data: flareData, savedAt: Date.now()});
                }

                dispatch({ type: "MERGE_EVENTS", payload: { monthKey, events: flareData }});

                if (!stateRef.current.selectedFlare && flareData.length > 0 ){
                    const sorted = [...flareData].sort(
                        (a, b) => new Date(b.beginTime).getTime() - new Date(a.beginTime).getTime()
                    );
                    dispatch({ type: "SET_DATE", payload: sorted[0].beginTime.split("T")[0] });
                    dispatch({ type: "SET_FLARE", payload: sorted[0] });
                }
            } catch(err: unknown) {
                dispatch({ type: "SET_ERROR", payload: err instanceof Error ? err.message: "Error al conectar con la NASA", });
            } finally {
                dispatch({ type: "SET_LOADING", payload: false});
            }
        },
        []
    );

    return (
        <SolarContext.Provider value={{ state, flaresOfSelectedDate, setSelectedDate, setSelectedFlare, loadMonthEvents}}>
            {children}
        </SolarContext.Provider>
    );
 }
 
 export function useSolarContext(): SolarContextValue {
    const ctx = useContext(SolarContext);
    if(!ctx) throw new Error("useSolarContext debe usarse dentro de <SolarProvider>");
    return ctx;
 }