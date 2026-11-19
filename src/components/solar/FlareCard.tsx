import { useSolarStore } from "@/hooks/useSolarStore";

function getClassColor(classType?: string): { badge: string; text: string} {
    if (!classType) return {badge: "bg-slate-700/60 border-slate-500/50", text: "text-slate-300"};
    const first = classType.charAt(0).toUpperCase();
    switch (first){
        case "X":
            return { badge: "bg-red-500/20 border-red-500/60 text-red-400", text: "text-red-400" };
        case "M":
            return { badge: "bg-orange-500/20 border-orange-500/60 text-orange-400", text: "text-orange-400" };
        case "C":
            return { badge: "bg-amber-500/20 border-amber-500/60 text-amber-300", text: "text-amber-300" };
        case "B":
            return { badge: "bg-blue-500/20 border-bluer-500/60 text-blue-400", text: "text-blue-400" };     
        default:
            return {badge: "bg-slate-500/20 border-slate-500/50 text-slate-300", text: "text-slate-300"};    
    }
}

export function FlareCard() {
    const { selectedFlare, isLoading } = useSolarStore();

    if(isLoading){
        return (
            <div className="bg-[#0e131f]/90 backdrop-blur-md border border-amber-500/30 rounded-2xl p-5 shadow-xl animate-pulse">
                <div className="h-4 bg-slate-800 rounded w-1/3 mb-4"/>
                <div className="space-y-3">
                    <div className="h-3 bg-slate-800 rounded w-full"/>
                    <div className="h-3 bg-slate-800 rounded w-5/6"/>
                    <div className="h-3 bg-slate-800 rounded w-4/6"/>
                </div>
            </div> 
        );
    }

    if (!selectedFlare){
        return (
            <div className="bg-[#0e131f]/90 backdrop-blur-md border border-amber-500/20 rounded-2xl p-6 shadow-xl text-center">
            <h3 className="text-xs font-semibold text-slate-300 mb-1">
                Sin registro seleccionado
            </h3>
            <p className="text-[11px] text-slate-400 font-sans">Selecciona un día resaltado en el calendario y un registro en el menú superior para ver sus métricas</p>
        </div>
        );
    }
    const classStyle = getClassColor(selectedFlare.classType);
    return (
        <div className="bg-[#0e131f]/90 backdrop-blur-md border border-amber-500/30 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                        Registro Seleccionado
                    </span>
                    <h3 className="text-sm font-mono font-bold text-slate-100">
                        {selectedFlare.flrID}
                    </h3>
                </div>
                <div className={`px-3 py-1 rounded-lg border text-xs font-mono font-bold uppercase tracking-wider ${classStyle.badge}`}>
                    {selectedFlare.classType || "Clase ?"}
                </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-[#090c12]/80 p-2.5 rounded-xl border border-slate-800">
                    <span className="block text-[10px] font-mono text-slate-400 md-0.5">Inicio</span>
                    <span className="text-xs font-mono font-semibold text-amber-300">
                        {selectedFlare.beginTime ? selectedFlare.beginTime.split("T")[1]?.slice(0, 5) : "N/A"}
                    </span>
                    <span className="block text-[9px] text-slate-500 font-mono">UTC</span>
                </div>
                <div className="bg-[#090c12]/80 p-2.5 rounded-xl border border-slate-800">
                    <span className="block text-[10px] font-mono text-slate-400 md-0.5">Pico Máx.</span>
                    <span className="text-xs font-mono font-semibold text-orange-400">
                        {selectedFlare.peakTime ? selectedFlare.peakTime.split("T")[1]?.slice(0, 5) : "N/A"}
                    </span>
                    <span className="block text-[9px] text-slate-500 font-mono">UTC</span>
                </div>
                <div className="bg-[#090c12]/80 p-2.5 rounded-xl border border-slate-800">
                    <span className="block text-[10px] font-mono text-slate-400 md-0.5">Fin</span>
                    <span className="text-xs font-mono font-semibold text-slate-300">
                        {selectedFlare.endTime ? selectedFlare.endTime.split("T")[1]?.slice(0, 5) : "N/A"}
                    </span>
                    <span className="block text-[9px] text-slate-500 font-mono">UTC</span>
                </div>
            </div>
            <div className="space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between p-2 rounded-lg bg-[#090c12]/20 border border-slate-800/60">
                    <span className="text-slate-400">Coordenadas:</span>
                    <span className="font-semibold text-amber-300">
                        {selectedFlare.sourceLocation || "No especificada"}
                    </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-[#090c12]/20 border border-slate-800/60">
                    <span className="text-slate-400">Región Activa (AR):</span>
                    <span className="font-semibold text-slate-200">
                        {selectedFlare.activeRegionNum ? `AR ${selectedFlare.activeRegionNum}` : "No asignada"}
                    </span>
                </div>
                {selectedFlare.instruments && selectedFlare.instruments.length > 0 && (
                    <div className="p-2 rounded-lg bg-[#090c12]/50 border border-slate-800/60">
                        <span className="block text-slate-400 mb-1.5 text-[11px]">Instrumentos Detectores:</span>
                        <div className="flex flex-wrap gap-1.5">
                            {selectedFlare.instruments.map((inst, idx) => (
                                <span
                                key={idx}
                                className="px-2 py-0.5 text-[10px] rounded bg-slate-800 text-slate-300 border border-slate-700"
                                >
                                    {inst.displayName}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}