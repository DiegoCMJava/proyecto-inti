import { useSolarContext } from "@/context/SolarContext";
import type { SolarFlareEvent } from "@/types/solar";

export function useSolarStore() {
  const {
    state,
    flaresOfSelectedDate,
    setSelectedDate,
    setSelectedFlare,
    loadMonthEvents,
  } = useSolarContext();
  
  return {
   selectedDate: state.selectedDate,
   selectedFlare: state.selectedFlare,
   eventsByDate: state.eventsByDate,
   loadedMonths: state.loadedMonths,
   isLoading: state.isLoading,
   errorMessage: state.errorMessage,
   flaresOfSelectedDate,

   setSelectedDate,
   setSelectedFlare,
   loadMonthEvents,

   hasFlaresToday: flaresOfSelectedDate.length > 0,
   flareCountToday: flaresOfSelectedDate.length,
   findFlareById: (flrID: string): SolarFlareEvent | undefined => {
     return flaresOfSelectedDate.find((f) => f.flrID === flrID);
   },
  };
} 