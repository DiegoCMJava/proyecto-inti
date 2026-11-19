interface HelpModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function HelpModal({ isOpen, onClose }: HelpModalProps){
    return (
        <div className={`fixed inset-0 z-50 flex justify-center items-center bg-black/80 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={(e) => { if (e.target === e.currentTarget) onClose();}}>
            <div className="relative p-6 w-full max-w-lg bg-[#0e131f] border border-amber-500/40 rounded-2xl shadow-2xl text-2xl text-slate-100">
              <h2 className="text-xl font-bold font-mono text-amber-400 mb-2 flex items-center gap-2">Como funciona esta web</h2>
              <p className="p-2 text-sm text-slate-300 font-sans">En este sítio podrás interactuar con información que facilita la NASA por medio de sus APIs públicas, en este caso datos sobre llamaradas solares de una manera gráfica e interactiva, así:</p>
              <ol className="space-3-y text-sm text-slate-300 font-sans">
                <li className="flex items-start gap-2">
                    <span className="font-bold text-amber-400">1.</span>
                    <span>Selecciona una fecha en el calendario de "Selección Cronológica". Los días con llamaradas registradas se destacan en color naranja.</span></li>
                <li className="flex items-start gap-2">
                    <span className="font-bold text-amber-400">2.</span>
                    <span>En "Llamaradas Detectadas", elige de la lista desplegable el o los registros disponibles.</span></li>
                <li className="flex items-start gap-2">
                    <span className="font-bold text-amber-400">3.</span>
                    <span>Mira la información detallada del registro seleccionado dentro de "Registro seleccionado".</span></li>
                <li className="flex items-start gap-2">
                    <span className="font-bold text-amber-400">4.</span>
                    <span>Observa e interactura con la simulación 3D.</span></li>            
              </ol>
              <p className="p-2 text-sm text-slate-300 font-sans mb-4">(Algunos datos pueden tardar en actualizarse, o no estar disponibles)</p>
              <h3 className="text-lg font-bold font-mono text-amber-400 mb-2 flex items-center gap-2">Investiga por tu cuenta</h3>
              <p className="p-2 text-sm text-slate-300 font-sans">Las llamaradas solares pueden estar asociadas a interferencias de ciertos sistemas en la Tierra. Si te llama la atención alguna llamarada específica, busca en la web si el día de ese 
                registro ocurrieron eventos en nuestro planeta asociado a dicho evento.</p>
              <div className="mt-6 flex justify-end">
                <button onClick={onClose} type="button" className="px-5 py-2 bg-linear-to-r  from-amber-600 to-orange-500 hover:from-amber-500 hover-to-orange-400 text-white font-semibold rounded-lg shadow-lg cursor-pointer transition-all select-none">Entendido</button>
            </div>
            </div>
            
        </div>  
    );
}