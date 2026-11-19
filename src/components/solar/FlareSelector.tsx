import React, { useEffect } from "react";
import { useSolarStore } from "@/hooks/useSolarStore";

export function FlareSelector(){
    const {
        flaresOfSelectedDate,
        selectedFlare,
        setSelectedFlare,
        selectedDate,
        isLoading,
    } = useSolarStore();

    useEffect(() =>{
        if(flaresOfSelectedDate.length > 0){
            const isCurrentInList = flaresOfSelectedDate.some((f) => f.flrID === selectedFlare?.flrID);
            if(!isCurrentInList && selectedFlare?.flrID !== flaresOfSelectedDate[0].flrID){
                setSelectedFlare(flaresOfSelectedDate[0]);
            }
        } else {
            if (selectedFlare !== null) {
                setSelectedFlare(null);
            }
        }
    }, [flaresOfSelectedDate, selectedFlare, setSelectedFlare]);

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const flrId = e.target.value;
        const found = flaresOfSelectedDate.find((f) => f.flrID === flrId) ?? null;
        setSelectedFlare(found);
    };

    const hasFlares = flaresOfSelectedDate.length > 0;

    return (
        <div className="bg-[#0e131f]/90 backdrop-blur-md border border-amber-500/30 rounded-2xl p-4 shadow-xl">
            <label htmlFor="flare-select" className="text-xs font-mono font-semibold text-amber-400 mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">Eventos del Día ({selectedDate})</span>
                {hasFlares && (
                    <span className="text-[11px] text-amber-300 font-normal">{flaresOfSelectedDate.length} detectada{flaresOfSelectedDate.length < 1 ? "s" : ""}</span>
                )}
            </label>
            <div className="relative">
                <select
                  id="flare-select"
                  disabled={!hasFlares || isLoading}
                  value={selectedFlare?.flrID ?? ""}
                  onChange={handleChange}
                 className="w-full bg-[#090c12] text-slate-100 border border-amber-500/40 rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-400 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed appearance-none">
                    {!hasFlares ? (
                        <option value="" disabled>
                            {isLoading ? "Cargando eventos..." : "Sin llamaradas registradas en esta fecha"}
                        </option>
                    ) : (
                        flaresOfSelectedDate.map((flare) => {
                            const time =flare.beginTime?.split("T")[1]?.slice(0, 5) ?? "00:00";
                            const region = flare.activeRegionNum ? ` - AR ${flare.activeRegionNum}` : "";
                            const classStr = flare.classType ? `[${flare.classType}]` : "[Sin clasif.]"
                            return (
                                  <option key={flare.flrID} value={flare.flrID}>
                                    {classStr} {time} UTC{region}
                                  </option>  
                            ); 
                        })
                    )}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-amber-400 text-xs">▼</div>
            </div>
        </div>
    )
}
