export function Footer(){
    return (
        <footer className="w-full bg-[#07090e] border-t border-slate-800/80 py-3.5 px-4 sm:px-6 text-center text-xs text-slate-400 mt-auto">
            <div className="max-w-[1920px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
                <p className="font-sans">
                    Datos científicos abiertos provistos por{" "}
                    <a href="https://ccmc.gsfc.nasa.gov/tools/DONKI/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-400 hover:text-amber-300 underline underline-offset-2 transition-colors font-medium">
                        NASA Space Weather DONKI</a>{" "} (Centro Goddard).
                </p>
                <p className="text-[11px] text-slate-400 font-mono">
                    Visualización 3D con ThreeJS y React •{" "}
                    <a
                      href="https://github.com/DiegoCMJava/proyecto-inti"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-300 hover:text-white underline underline-offset-2 transition-colors">
                         DiegoCMJava/proyecto-inti
                      </a>
                </p>
            </div>
        </footer>
    );

}