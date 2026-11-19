import { useState} from "react";
import { SolarProvider } from "./context/SolarContext";
import { Header} from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HelpModal } from "@/components/modal/HelpModal"
import { CalendarSection } from "@/components/solar/CalendarSection";
import { FlareSelector } from "./components/solar/FlareSelector";
import { FlareCard } from "./components/solar/FlareCard";
import { SolarViewer3D } from "@/components/solar/SolarViewer3D";


export function App(){
    const [isHelpOpen, setIsHelpOpen] = useState(false);

    return (
        <SolarProvider>
            <div className="flex flex-col min-h-screen bg-[#090c12]">
            <Header onOpenHelp={() => setIsHelpOpen(true)} />
                <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)}/>
            <main className="flex-1 max-w-[1920px] w-full mx-auto p-3 sm:p-5 lg:p-6 flex flex-col lg:flex-row gap-5 items-stretch min-h-0">
                <aside className="w-full lg:w-105 xl:w-112.5 shrink-0  flex flex-col gap-4 z-20">
                    <CalendarSection />
                    <FlareSelector />
                    <FlareCard />
                </aside>
                <SolarViewer3D />
            </main>
            <Footer />
        </div>
        </SolarProvider>
    );
}