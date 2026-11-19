import logoProyectoInti from "@/assets/images/logo-proyecto-inti.png";

interface HeaderProps {
    onOpenHelp: () => void;
}

export function Header({ onOpenHelp }: HeaderProps){
    return (
        <header className="w-full bg-[#090c12]/90 backdrop-blur-md border-b border-amber-500/20 px-4 sm:px py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-lg">
            <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 flex items-center justify-center">
                    <span className="absolute inset-0 rounded-full bg-amber-500/20 blur-sm animate-pulse" />
                    <img src={logoProyectoInti} alt="Logo del Proyecto Inti" className="relative w-12 h-12 object-contain rounded-full select-none"/>
                </div>
                <div>
                    <h1 className="text-lg sm:text-xl font-bold font-mono tracking-tight text-transparent bg-clip-text bg-linear-to-r from-amber-400 via-orange-400 to-amber-200">PROYECTO INTI</h1>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <button type="button" onClick={onOpenHelp} aria-label="Ver instrucciones y ayuda"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 hover:text-amber-200 text-xs sm:text-sm font-medium transition-all duration-150 cursor-pointer shadow-sm active-scale-95">
                    <span className="w-4 h-4 rounded-full border border-amber-400/80 flex items-center justify-center text-[10px] font-bold">?</span>
                    <span>Guía</span>
                </button>
            </div>
        </header>
    )
}